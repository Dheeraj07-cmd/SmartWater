package com.codecrew.smartwater.service;

import com.codecrew.smartwater.dto.request.TariffPlanRequest;
import com.codecrew.smartwater.dto.response.AdminAlertOverviewResponse;
import com.codecrew.smartwater.dto.response.AdminDashboardResponse;
import com.codecrew.smartwater.dto.response.TariffSimulationResponse;
import com.codecrew.smartwater.model.entity.*;
import com.codecrew.smartwater.model.enums.InvoiceStatus;
import com.codecrew.smartwater.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final HouseholdRepository householdRepository;
    private final WaterUsageLogRepository logRepository;
    private final UsageAlertRepository alertRepository;
    private final InvoiceRepository invoiceRepository;
    private final TariffPlanRepository tariffPlanRepository;
    private final BulkWaterPurchaseRepository purchaseRepository;
    private final BillingCycleRepository billingCycleRepository;

    public AnalyticsService(HouseholdRepository householdRepository,
                            WaterUsageLogRepository logRepository,
                            UsageAlertRepository alertRepository,
                            InvoiceRepository invoiceRepository,
                            TariffPlanRepository tariffPlanRepository,
                            BulkWaterPurchaseRepository purchaseRepository,
                            BillingCycleRepository billingCycleRepository) {
        this.householdRepository = householdRepository;
        this.logRepository = logRepository;
        this.alertRepository = alertRepository;
        this.invoiceRepository = invoiceRepository;
        this.tariffPlanRepository = tariffPlanRepository;
        this.purchaseRepository = purchaseRepository;
        this.billingCycleRepository = billingCycleRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboardAnalytics(Long apartmentId) {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        long totalHouseholds = householdRepository.countByApartmentId(apartmentId);

        BigDecimal totalConsumption = logRepository.sumConsumptionByApartmentIdAndDateRange(apartmentId, startOfMonth, endOfMonth);
        if (totalConsumption == null) totalConsumption = BigDecimal.ZERO;

        long activeAlerts = alertRepository.countByHouseholdApartmentIdAndIsReadFalse(apartmentId);
        long pendingInvoices = invoiceRepository.countByHouseholdApartmentIdAndStatus(apartmentId, InvoiceStatus.UNPAID);

        final BigDecimal average = totalHouseholds > 0
                ? totalConsumption.divide(BigDecimal.valueOf(totalHouseholds), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<Household> households = householdRepository.findByApartmentId(apartmentId);
        List<AdminDashboardResponse.HouseholdComparisonDto> comparisons = households.stream().map(h -> {
            BigDecimal usage = logRepository.sumConsumptionByHouseholdIdAndDateRange(h.getId(), startOfMonth, endOfMonth);
            return AdminDashboardResponse.HouseholdComparisonDto.builder()
                    .flatNumber(h.getFlatNumber())
                    .usage(usage != null ? usage : BigDecimal.ZERO)
                    .average(average)
                    .build();
        }).collect(Collectors.toList());

        // Financial Reconciliation: Check most recent cycle first; if empty, sum across all cycles for this apartment
        List<BillingCycle> apartmentCycles = billingCycleRepository.findAll().stream()
                .filter(c -> c.getApartment().getId().equals(apartmentId))
                .sorted(Comparator.comparingLong(BillingCycle::getId).reversed())
                .toList();

        BigDecimal totalSharedExpenses = BigDecimal.ZERO;
        BigDecimal totalAllocatedExpenses = BigDecimal.ZERO;

        for (BillingCycle cycle : apartmentCycles) {
            BigDecimal cycleShared = purchaseRepository.findByBillingCycleId(cycle.getId()).stream()
                    .map(BulkWaterPurchase::getTotalCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal cycleAllocated = invoiceRepository.findByBillingCycleId(cycle.getId()).stream()
                    .map(Invoice::getSharedAreaCharge)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (cycleShared.compareTo(BigDecimal.ZERO) > 0 || cycleAllocated.compareTo(BigDecimal.ZERO) > 0) {
                totalSharedExpenses = cycleShared;
                totalAllocatedExpenses = cycleAllocated;
                break;
            }
        }

        // Dynamic Meter Status directly from DB (ACTIVE, INACTIVE, FAULTY, or UNASSIGNED)
        List<AdminDashboardResponse.MeterHealthDto> meterHealthList = households.stream().map(h -> {
            WaterMeter m = h.getWaterMeter();
            if (m == null) {
                return AdminDashboardResponse.MeterHealthDto.builder()
                        .meterId(null)
                        .flatNumber(h.getFlatNumber())
                        .meterNumber("No Meter")
                        .status("UNASSIGNED")
                        .lastReadingValue(BigDecimal.ZERO)
                        .lastReadingDate(null)
                        .build();
            }

            return AdminDashboardResponse.MeterHealthDto.builder()
                    .meterId(m.getId())
                    .flatNumber(h.getFlatNumber())
                    .meterNumber(m.getMeterNumber())
                    .status(m.getStatus().name())
                    .lastReadingValue(m.getLastReadingValue() != null ? m.getLastReadingValue() : BigDecimal.ZERO)
                    .lastReadingDate(m.getLastReadingDate())
                    .build();
        }).collect(Collectors.toList());

        return AdminDashboardResponse.builder()
                .totalHouseholds(totalHouseholds)
                .totalConsumptionKl(totalConsumption)
                .activeAlerts(activeAlerts)
                .pendingInvoices(pendingInvoices)
                .householdComparisons(comparisons)
                .totalSharedExpenses(totalSharedExpenses)
                .totalAllocatedExpenses(totalAllocatedExpenses)
                .meterHealth(meterHealthList)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminAlertOverviewResponse> getActiveApartmentAlerts(Long apartmentId) {
        List<UsageAlert> alerts = alertRepository.findByHouseholdApartmentIdOrderByCreatedAtDesc(apartmentId);

        return alerts.stream().map(alert -> AdminAlertOverviewResponse.builder()
                .alertId(alert.getId())
                .flatNumber(alert.getHousehold().getFlatNumber())
                .residentName(alert.getHousehold().getResident() != null ?
                        alert.getHousehold().getResident().getFirstName() + " " + alert.getHousehold().getResident().getLastName() : "Unassigned")
                .alertType(alert.getAlertType())
                .message(alert.getMessage())
                .isReadByResident(alert.getIsRead())
                .createdAt(alert.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TariffSimulationResponse simulateTariffChanges(Long apartmentId, TariffPlanRequest request) {
        YearMonth lastMonth = YearMonth.now().minusMonths(1);
        LocalDate startDate = lastMonth.atDay(1);
        LocalDate endDate = lastMonth.atEndOfMonth();

        BigDecimal lastMonthTotal = logRepository.sumConsumptionByApartmentIdAndDateRange(apartmentId, startDate, endDate);
        if (lastMonthTotal == null || lastMonthTotal.compareTo(BigDecimal.ZERO) == 0) {
            startDate = LocalDate.now().minusDays(30);
            endDate = LocalDate.now();
        }

        TariffPlan currentTariff = tariffPlanRepository.findFirstByApartmentIdAndIsActiveTrueOrderByEffectiveFromDesc(apartmentId)
                .orElse(null);

        BigDecimal currentRevenue = BigDecimal.ZERO;

        TariffPlan projectedTariff = TariffPlan.builder()
                .baseRatePerKl(request.getBaseRatePerKl())
                .tier1ThresholdKl(request.getTier1ThresholdKl())
                .tier2RatePerKl(request.getTier2RatePerKl())
                .tier2ThresholdKl(request.getTier2ThresholdKl())
                .tier3RatePerKl(request.getTier3RatePerKl())
                .build();

        BigDecimal projectedRevenue = BigDecimal.ZERO;

        List<Household> households = householdRepository.findByApartmentId(apartmentId);

        for (Household h : households) {
            BigDecimal usage = logRepository.sumConsumptionByHouseholdIdAndDateRange(h.getId(), startDate, endDate);
            if (usage == null) usage = BigDecimal.ZERO;

            if (currentTariff != null) {
                currentRevenue = currentRevenue.add(calculateTieredCharge(usage, currentTariff));
            }
            projectedRevenue = projectedRevenue.add(calculateTieredCharge(usage, projectedTariff));
        }

        return TariffSimulationResponse.builder()
                .currentRevenue(currentRevenue)
                .projectedRevenue(projectedRevenue)
                .revenueDifference(projectedRevenue.subtract(currentRevenue))
                .build();
    }

    private BigDecimal calculateTieredCharge(BigDecimal consumption, TariffPlan tariff) {
        BigDecimal totalCharge = BigDecimal.ZERO;

        if (tariff.getBaseRatePerKl() == null || tariff.getTier1ThresholdKl() == null) {
            return totalCharge;
        }

        BigDecimal tier1Usage = consumption.min(tariff.getTier1ThresholdKl());
        totalCharge = totalCharge.add(tier1Usage.multiply(tariff.getBaseRatePerKl()));

        if (consumption.compareTo(tariff.getTier1ThresholdKl()) > 0 && tariff.getTier2ThresholdKl() != null && tariff.getTier2RatePerKl() != null) {
            BigDecimal remaining = consumption.subtract(tariff.getTier1ThresholdKl());
            BigDecimal tier2Capacity = tariff.getTier2ThresholdKl().subtract(tariff.getTier1ThresholdKl());
            BigDecimal tier2Usage = remaining.min(tier2Capacity);
            totalCharge = totalCharge.add(tier2Usage.multiply(tariff.getTier2RatePerKl()));

            if (remaining.compareTo(tier2Capacity) > 0 && tariff.getTier3RatePerKl() != null) {
                BigDecimal tier3Usage = remaining.subtract(tier2Capacity);
                totalCharge = totalCharge.add(tier3Usage.multiply(tariff.getTier3RatePerKl()));
            }
        }
        return totalCharge.setScale(2, RoundingMode.HALF_UP);
    }
}