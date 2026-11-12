package com.codecrew.smartwater.service;

import com.codecrew.smartwater.model.entity.*;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertTrue;

class PdfGeneratorServiceTest {

    private final PdfGeneratorService pdfGeneratorService = new PdfGeneratorService();

    @Test
    void generateInvoicePdf_CreatesFileSuccessfully() {
        Apartment apt = Apartment.builder().name("Test Apt").build();
        User resident = User.builder().id(1L).build();
        Household household = Household.builder().apartment(apt).flatNumber("101").resident(resident).build();
        BillingCycle cycle = BillingCycle.builder().cycleName("Test Cycle").build();

        Invoice invoice = Invoice.builder()
                .invoiceNumber("TEST-INV-123")
                .household(household)
                .billingCycle(cycle)
                .issueDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(15))
                .consumptionKl(BigDecimal.TEN)
                .meteredCharge(BigDecimal.valueOf(100))
                .sharedAreaCharge(BigDecimal.valueOf(50))
                .totalAmount(BigDecimal.valueOf(150))
                .build();

        String path = pdfGeneratorService.generateInvoicePdf(invoice);

        File pdfFile = new File(path);
        assertTrue(pdfFile.exists());

        // Clean up after test
        pdfFile.delete();
    }
}