package com.codecrew.smartwater.service;

import com.codecrew.smartwater.dto.response.InvoiceResponse;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.exception.ResourceNotFoundException;
import com.codecrew.smartwater.model.entity.*;
import com.codecrew.smartwater.model.enums.CycleStatus;
import com.codecrew.smartwater.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BillingEngineService {

    private final BillingCycleRepository cycleRepo;
    private final TariffPlanRepository tariffRepo;
    private final HouseholdRepository householdRepo;
    private final WaterUsageLogRepository logRepo;
    private final BulkWaterPurchaseRepository purchaseRepo;
    private final InvoiceRepository invoiceRepo;
    private final PdfGeneratorService pdfGeneratorService;

    public BillingEngineService(BillingCycleRepository cycleRepo,
                                TariffPlanRepository tariffRepo,
                                HouseholdRepository householdRepo,
                                WaterUsageLogRepository logRepo,
                                BulkWaterPurchaseRepository purchaseRepo,
                                InvoiceRepository invoiceRepo,
                                PdfGeneratorService pdfGeneratorService) {
        this.cycleRepo = cycleRepo;
        this.tariffRepo = tariffRepo;
        this.householdRepo = householdRepo;
        this.logRepo = logRepo;
        this.purchaseRepo = purchaseRepo;
        this.invoiceRepo = invoiceRepo;
        this.pdfGeneratorService = pdfGeneratorService;
    }

    @Transactional
    public List<InvoiceResponse> generateInvoicesForCycle(Long cycleId) {
        BillingCycle cycle = cycleRepo.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("BillingCycle", "id", cycleId));

        if (cycle.getStatus() != CycleStatus.OPEN) {
            throw new ApiException("Invoices can only be generated for OPEN billing cycles.", HttpStatus.BAD_REQUEST);
        }
        if (invoiceRepo.existsByBillingCycleId(cycleId)) {
            throw new ApiException("Invoices already exist for this billing cycle.", HttpStatus.BAD_REQUEST);
        }

        Apartment apartment = cycle.getApartment();
        TariffPlan tariff = tariffRepo.findFirstByApartmentIdAndIsActiveTrueOrderByEffectiveFromDesc(apartment.getId())
                .orElseThrow(() -> new ApiException("No active tariff plan found for apartment. Create a Tariff Plan first.", HttpStatus.BAD_REQUEST));

        List<Household> households = householdRepo.findByApartmentId(apartment.getId());
        if (households.isEmpty()) {
            throw new ApiException("No households registered in this apartment complex.", HttpStatus.BAD_REQUEST);
        }

        List<BulkWaterPurchase> bulkPurchases = purchaseRepo.findByBillingCycleId(cycleId);
        BigDecimal totalBulkCost = bulkPurchases.stream()
                .map(BulkWaterPurchase::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalApartmentArea = households.stream()
                .map(Household::getAreaSqFt)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Invoice> invoices = new ArrayList<>();
        BigDecimal allocatedSharedSoFar = BigDecimal.ZERO;

        for (int i = 0; i < households.size(); i++) {
            Household household = households.get(i);
            boolean isLastHousehold = (i == households.size() - 1);

            BigDecimal householdConsumption = BigDecimal.ZERO;
            if (household.getWaterMeter() != null) {
                List<WaterUsageLog> logs = logRepo.findByWaterMeterIdAndReadingDateBetweenOrderByReadingDateAsc(
                        household.getWaterMeter().getId(), cycle.getStartDate(), cycle.getEndDate());
                householdConsumption = logs.stream()
                        .map(WaterUsageLog::getConsumption)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }

            BigDecimal meteredCharge = calculateTieredCharge(householdConsumption, tariff);

            // Proportional shared area calculation with exact penny reconciliation on the last household
            BigDecimal sharedAreaCharge = BigDecimal.ZERO;
            if (totalBulkCost.compareTo(BigDecimal.ZERO) > 0 && totalApartmentArea.compareTo(BigDecimal.ZERO) > 0) {
                if (isLastHousehold) {
                    sharedAreaCharge = totalBulkCost.subtract(allocatedSharedSoFar).max(BigDecimal.ZERO);
                } else {
                    BigDecimal sharedAreaRatio = household.getAreaSqFt().divide(totalApartmentArea, 6, RoundingMode.HALF_UP);
                    sharedAreaCharge = totalBulkCost.multiply(sharedAreaRatio).setScale(2, RoundingMode.HALF_UP);
                    allocatedSharedSoFar = allocatedSharedSoFar.add(sharedAreaCharge);
                }
            }

            Invoice newInvoice = Invoice.builder()
                    .household(household)
                    .billingCycle(cycle)
                    .invoiceNumber("INV-" + cycle.getId() + "-" + household.getId() + "-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase())
                    .issueDate(LocalDate.now())
                    .dueDate(LocalDate.now().plusDays(15))
                    .consumptionKl(householdConsumption)
                    .meteredCharge(meteredCharge)
                    .sharedAreaCharge(sharedAreaCharge)
                    .totalAmount(meteredCharge.add(sharedAreaCharge))
                    .build();

            String savedPdfPath = pdfGeneratorService.generateInvoicePdf(newInvoice);
            newInvoice.setPdfPath(savedPdfPath);
            invoices.add(newInvoice);
        }

        invoiceRepo.saveAll(invoices);
        cycle.setStatus(CycleStatus.FINALIZED);
        cycleRepo.save(cycle);

        return invoices.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private BigDecimal calculateTieredCharge(BigDecimal consumption, TariffPlan tariff) {
        BigDecimal totalCharge = BigDecimal.ZERO;

        if (tariff.getBaseRatePerKl() == null || tariff.getTier1ThresholdKl() == null) {
            return totalCharge;
        }

        // Tier 1 calculation
        BigDecimal tier1Usage = consumption.min(tariff.getTier1ThresholdKl());
        totalCharge = totalCharge.add(tier1Usage.multiply(tariff.getBaseRatePerKl()));

        // Tier 2 calculation (Null-safe for optional Tier 2/Tier 3 thresholds)
        if (consumption.compareTo(tariff.getTier1ThresholdKl()) > 0 && tariff.getTier2RatePerKl() != null) {
            BigDecimal remaining = consumption.subtract(tariff.getTier1ThresholdKl());

            if (tariff.getTier2ThresholdKl() != null && tariff.getTier2ThresholdKl().compareTo(tariff.getTier1ThresholdKl()) > 0) {
                BigDecimal tier2Capacity = tariff.getTier2ThresholdKl().subtract(tariff.getTier1ThresholdKl());
                BigDecimal tier2Usage = remaining.min(tier2Capacity);
                totalCharge = totalCharge.add(tier2Usage.multiply(tariff.getTier2RatePerKl()));

                // Tier 3 calculation
                if (remaining.compareTo(tier2Capacity) > 0 && tariff.getTier3RatePerKl() != null) {
                    BigDecimal tier3Usage = remaining.subtract(tier2Capacity);
                    totalCharge = totalCharge.add(tier3Usage.multiply(tariff.getTier3RatePerKl()));
                }
            } else {
                // If no Tier 2 upper threshold is set, bill all remaining usage at Tier 2 rate
                totalCharge = totalCharge.add(remaining.multiply(tariff.getTier2RatePerKl()));
            }
        }
        return totalCharge.setScale(2, RoundingMode.HALF_UP);
    }

    private InvoiceResponse mapToResponse(Invoice inv) {
        return InvoiceResponse.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .flatNumber(inv.getHousehold().getFlatNumber())
                .cycleName(inv.getBillingCycle().getCycleName())
                .issueDate(inv.getIssueDate())
                .dueDate(inv.getDueDate())
                .consumptionKl(inv.getConsumptionKl())
                .meteredCharge(inv.getMeteredCharge())
                .sharedAreaCharge(inv.getSharedAreaCharge())
                .totalAmount(inv.getTotalAmount())
                .status(inv.getStatus())
                .build();
    }
}