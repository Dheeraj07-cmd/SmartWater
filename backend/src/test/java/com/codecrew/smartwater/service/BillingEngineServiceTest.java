package com.codecrew.smartwater.service;

import com.codecrew.smartwater.dto.response.InvoiceResponse;
import com.codecrew.smartwater.model.entity.*;
import com.codecrew.smartwater.model.enums.CycleStatus;
import com.codecrew.smartwater.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BillingEngineServiceTest {

    @Mock private BillingCycleRepository cycleRepo;
    @Mock private TariffPlanRepository tariffRepo;
    @Mock private HouseholdRepository householdRepo;
    @Mock private WaterUsageLogRepository logRepo;
    @Mock private BulkWaterPurchaseRepository purchaseRepo;
    @Mock private InvoiceRepository invoiceRepo;
    @Mock private PdfGeneratorService pdfGeneratorService;

    @InjectMocks private BillingEngineService billingEngineService;

    private Apartment apartment;
    private BillingCycle cycle;
    private Household household;
    private TariffPlan tariff;

    @BeforeEach
    void setUp() {
        apartment = Apartment.builder().id(1L).name("Test Apt").build();

        cycle = BillingCycle.builder().id(1L).apartment(apartment).status(CycleStatus.OPEN)
                .startDate(LocalDate.now().minusDays(30)).endDate(LocalDate.now()).build();

        household = Household.builder().id(1L).apartment(apartment).flatNumber("A101")
                .areaSqFt(BigDecimal.valueOf(1000)).waterMeter(WaterMeter.builder().id(1L).build()).build();

        tariff = TariffPlan.builder().baseRatePerKl(BigDecimal.valueOf(10))
                .tier1ThresholdKl(BigDecimal.valueOf(15)).build();
    }

    @Test
    void generateInvoicesForCycle_Success() {
        when(cycleRepo.findById(1L)).thenReturn(Optional.of(cycle));
        when(invoiceRepo.existsByBillingCycleId(1L)).thenReturn(false);
        when(tariffRepo.findFirstByApartmentIdAndIsActiveTrueOrderByEffectiveFromDesc(1L)).thenReturn(Optional.of(tariff));
        when(purchaseRepo.findByBillingCycleId(1L)).thenReturn(List.of()); // No bulk purchases for simplicity
        when(householdRepo.findByApartmentId(1L)).thenReturn(List.of(household));

        // Mock 10kL consumption
        WaterUsageLog log = WaterUsageLog.builder().consumption(BigDecimal.valueOf(10)).build();
        when(logRepo.findByWaterMeterIdAndReadingDateBetweenOrderByReadingDateAsc(any(), any(), any())).thenReturn(List.of(log));
        when(pdfGeneratorService.generateInvoicePdf(any(Invoice.class))).thenReturn("invoices/test.pdf");

        List<InvoiceResponse> responses = billingEngineService.generateInvoicesForCycle(1L);

        assertEquals(1, responses.size());
        assertEquals(0, BigDecimal.valueOf(100.00).compareTo(responses.get(0).getMeteredCharge())); // 10kL * $10
        assertEquals(CycleStatus.FINALIZED, cycle.getStatus());
        verify(invoiceRepo, times(1)).saveAll(anyList());
        verify(pdfGeneratorService, times(1)).generateInvoicePdf(any(Invoice.class));
    }
}