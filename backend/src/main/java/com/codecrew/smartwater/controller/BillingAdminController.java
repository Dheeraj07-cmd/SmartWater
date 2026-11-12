package com.codecrew.smartwater.controller;

import com.codecrew.smartwater.common.ApiResponse;
import com.codecrew.smartwater.dto.request.BillingCycleRequest;
import com.codecrew.smartwater.dto.request.BulkPurchaseRequest;
import com.codecrew.smartwater.dto.request.TariffPlanRequest;
import com.codecrew.smartwater.dto.response.BillingCycleResponse;
import com.codecrew.smartwater.dto.response.BulkPurchaseResponse;
import com.codecrew.smartwater.dto.response.InvoiceResponse;
import com.codecrew.smartwater.dto.response.TariffPlanResponse;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.exception.ResourceNotFoundException;
import com.codecrew.smartwater.model.entity.Apartment;
import com.codecrew.smartwater.model.entity.BillingCycle;
import com.codecrew.smartwater.model.entity.BulkWaterPurchase;
import com.codecrew.smartwater.model.entity.TariffPlan;
import com.codecrew.smartwater.model.enums.CycleStatus;
import com.codecrew.smartwater.repository.ApartmentRepository;
import com.codecrew.smartwater.repository.BillingCycleRepository;
import com.codecrew.smartwater.repository.BulkWaterPurchaseRepository;
import com.codecrew.smartwater.repository.TariffPlanRepository;
import com.codecrew.smartwater.service.AlertEngineService;
import com.codecrew.smartwater.service.BillingEngineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/billing")
@Tag(name = "Admin Billing & Finance", description = "Endpoints for managing tariffs, billing cycles, and bulk purchases")
@SecurityRequirement(name = "BearerAuth")
public class BillingAdminController {

    private final TariffPlanRepository tariffRepo;
    private final BillingCycleRepository cycleRepo;
    private final BulkWaterPurchaseRepository purchaseRepo;
    private final ApartmentRepository apartmentRepo;
    private final BillingEngineService billingEngineService;
    private final AlertEngineService alertEngineService;

    public BillingAdminController(TariffPlanRepository tariffRepo,
                                  BillingCycleRepository cycleRepo,
                                  BulkWaterPurchaseRepository purchaseRepo,
                                  ApartmentRepository apartmentRepo,
                                  BillingEngineService billingEngineService,
                                  AlertEngineService alertEngineService) {
        this.tariffRepo = tariffRepo;
        this.cycleRepo = cycleRepo;
        this.purchaseRepo = purchaseRepo;
        this.apartmentRepo = apartmentRepo;
        this.billingEngineService = billingEngineService;
        this.alertEngineService = alertEngineService;
    }

    @Transactional
    @PostMapping("/tariffs")
    @Operation(summary = "Create a tiered tariff pricing plan")
    public ResponseEntity<ApiResponse<TariffPlanResponse>> createTariffPlan(@Valid @RequestBody TariffPlanRequest request) {
        Apartment apartment = apartmentRepo.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment", "id", request.getApartmentId()));

        TariffPlan plan = TariffPlan.builder()
                .apartment(apartment)
                .planName(request.getPlanName().trim())
                .baseRatePerKl(request.getBaseRatePerKl())
                .tier1ThresholdKl(request.getTier1ThresholdKl())
                .tier2RatePerKl(request.getTier2RatePerKl())
                .tier2ThresholdKl(request.getTier2ThresholdKl())
                .tier3RatePerKl(request.getTier3RatePerKl())
                .effectiveFrom(request.getEffectiveFrom())
                .isActive(true)
                .build();

        TariffPlan savedPlan = tariffRepo.save(plan);

        TariffPlanResponse response = TariffPlanResponse.builder()
                .id(savedPlan.getId())
                .apartmentId(savedPlan.getApartment().getId())
                .planName(savedPlan.getPlanName())
                .baseRatePerKl(savedPlan.getBaseRatePerKl())
                .tier1ThresholdKl(savedPlan.getTier1ThresholdKl())
                .tier2RatePerKl(savedPlan.getTier2RatePerKl())
                .tier2ThresholdKl(savedPlan.getTier2ThresholdKl())
                .tier3RatePerKl(savedPlan.getTier3RatePerKl())
                .effectiveFrom(savedPlan.getEffectiveFrom())
                .isActive(savedPlan.getIsActive())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @Transactional
    @PostMapping("/cycles")
    @Operation(summary = "Open a new billing cycle period")
    public ResponseEntity<ApiResponse<BillingCycleResponse>> createBillingCycle(@Valid @RequestBody BillingCycleRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ApiException("Cycle end date cannot be before start date", HttpStatus.BAD_REQUEST);
        }

        Apartment apartment = apartmentRepo.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment", "id", request.getApartmentId()));

        BillingCycle cycle = BillingCycle.builder()
                .apartment(apartment)
                .cycleName(request.getCycleName().trim())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(CycleStatus.OPEN)
                .build();

        BillingCycle savedCycle = cycleRepo.save(cycle);

        BillingCycleResponse response = BillingCycleResponse.builder()
                .id(savedCycle.getId())
                .apartmentId(savedCycle.getApartment().getId())
                .cycleName(savedCycle.getCycleName())
                .startDate(savedCycle.getStartDate())
                .endDate(savedCycle.getEndDate())
                .status(savedCycle.getStatus())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @Transactional
    @PostMapping("/purchases")
    @Operation(summary = "Log a bulk water purchase (e.g., Water Tanker)")
    public ResponseEntity<ApiResponse<BulkPurchaseResponse>> addBulkPurchase(@Valid @RequestBody BulkPurchaseRequest request) {
        Apartment apartment = apartmentRepo.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment", "id", request.getApartmentId()));

        BillingCycle cycle = cycleRepo.findById(request.getBillingCycleId())
                .orElseThrow(() -> new ResourceNotFoundException("BillingCycle", "id", request.getBillingCycleId()));

        BulkWaterPurchase purchase = BulkWaterPurchase.builder()
                .apartment(apartment)
                .billingCycle(cycle)
                .purchaseDate(request.getPurchaseDate())
                .volumeKl(request.getVolumeKl())
                .totalCost(request.getTotalCost())
                .vendorName(request.getVendorName())
                .build();

        BulkWaterPurchase savedPurchase = purchaseRepo.save(purchase);

        BulkPurchaseResponse response = BulkPurchaseResponse.builder()
                .id(savedPurchase.getId())
                .apartmentId(savedPurchase.getApartment().getId())
                .billingCycleId(savedPurchase.getBillingCycle().getId())
                .purchaseDate(savedPurchase.getPurchaseDate())
                .volumeKl(savedPurchase.getVolumeKl())
                .totalCost(savedPurchase.getTotalCost())
                .vendorName(savedPurchase.getVendorName())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PostMapping("/cycles/{id}/generate-invoices")
    @Operation(summary = "Generate invoices for a billing cycle (Closes the cycle)")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> generateInvoices(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Invoices generated successfully. Cycle is now finalized.",
                billingEngineService.generateInvoicesForCycle(id)));
    }

    @PostMapping("/trigger-alerts")
    @Operation(summary = "Manually trigger the daily anomaly and leak detection engine")
    public ResponseEntity<ApiResponse<String>> triggerAlertEngine() {
        alertEngineService.runDailyAnomalyDetection();
        return ResponseEntity.ok(ApiResponse.success("Anomaly detection scan completed successfully.", null));
    }

    @Transactional(readOnly = true)
    @GetMapping("/apartments/{apartmentId}/cycles")
    @Operation(summary = "Get all billing cycles for an apartment")
    public ResponseEntity<ApiResponse<List<BillingCycleResponse>>> getCyclesByApartment(@PathVariable Long apartmentId) {
        List<BillingCycleResponse> cycles = cycleRepo.findAll().stream()
                .filter(c -> c.getApartment().getId().equals(apartmentId))
                .map(c -> BillingCycleResponse.builder()
                        .id(c.getId())
                        .apartmentId(c.getApartment().getId())
                        .cycleName(c.getCycleName())
                        .startDate(c.getStartDate())
                        .endDate(c.getEndDate())
                        .status(c.getStatus())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success(cycles));
    }
}