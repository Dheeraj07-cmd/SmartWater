package com.codecrew.smartwater.service;

import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.model.entity.Household;
import com.codecrew.smartwater.model.entity.Invoice;
import com.codecrew.smartwater.model.entity.User;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.util.Matrix;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

@Service
public class PdfGeneratorService {

    private static final String INVOICE_DIR = "invoices/";

    public PdfGeneratorService() {
        try {
            Path path = Paths.get(INVOICE_DIR);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize directory for invoices", e);
        }
    }

    public String generateInvoicePdf(Invoice invoice) {
        String fileName = invoice.getInvoiceNumber() + ".pdf";
        String filePath = INVOICE_DIR + fileName;

        Household household = invoice.getHousehold();
        User resident = household != null ? household.getResident() : null;
        String residentDisplay = (resident != null)
                ? (resident.getFirstName() + " " + resident.getLastName()).trim()
                : "Unassigned (Vacant Flat)";

        String apartmentName = (household != null && household.getApartment() != null)
                ? household.getApartment().getName()
                : "Apartment Complex";
        String flatNumber = (household != null) ? household.getFlatNumber() : "N/A";

        BigDecimal consumption = invoice.getConsumptionKl() != null ? invoice.getConsumptionKl() : BigDecimal.ZERO;
        BigDecimal meteredCharge = invoice.getMeteredCharge() != null ? invoice.getMeteredCharge() : BigDecimal.ZERO;
        BigDecimal sharedCharge = invoice.getSharedAreaCharge() != null ? invoice.getSharedAreaCharge() : BigDecimal.ZERO;
        BigDecimal totalAmount = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {

                PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font normalFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");

                // Draw Watermark
                contentStream.saveGraphicsState();
                PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
                gs.setNonStrokingAlphaConstant(0.15f);
                contentStream.setGraphicsStateParameters(gs);
                contentStream.beginText();
                contentStream.setFont(titleFont, 80);
                contentStream.setNonStrokingColor(Color.LIGHT_GRAY);
                contentStream.setTextMatrix(Matrix.getRotateInstance(Math.toRadians(45), 100, 200));
                contentStream.showText("SMARTWATER");
                contentStream.endText();
                contentStream.restoreGraphicsState();

                // Draw Header Background Box
                contentStream.setNonStrokingColor(new Color(41, 128, 185));
                contentStream.addRect(0, 700, page.getMediaBox().getWidth(), 100);
                contentStream.fill();

                // Draw Header Text
                contentStream.beginText();
                contentStream.setFont(titleFont, 24);
                contentStream.setNonStrokingColor(Color.WHITE);
                contentStream.newLineAtOffset(50, 750);
                contentStream.showText("UTILITY INVOICE");

                contentStream.setFont(normalFont, 12);
                contentStream.newLineAtOffset(0, -25);
                contentStream.showText("Smart Water Management Platform");
                contentStream.endText();

                // Draw Invoice Details (Left Side - Null-safe Resident Name)
                contentStream.beginText();
                contentStream.setNonStrokingColor(Color.DARK_GRAY);
                contentStream.setFont(normalFont, 12);
                contentStream.newLineAtOffset(50, 650);
                contentStream.setLeading(18f);

                contentStream.showText("Billed To:");
                contentStream.newLine();
                contentStream.setFont(titleFont, 12);
                contentStream.setNonStrokingColor(Color.BLACK);
                contentStream.showText(sanitizeText(apartmentName + " - Flat " + flatNumber));
                contentStream.newLine();
                contentStream.setFont(normalFont, 11);
                contentStream.showText(sanitizeText("Resident: " + residentDisplay));
                contentStream.endText();

                // Draw Invoice Metadata (Right Side)
                contentStream.beginText();
                contentStream.setFont(titleFont, 12);
                contentStream.newLineAtOffset(350, 650);
                contentStream.setLeading(18f);
                contentStream.showText(sanitizeText("Invoice No: " + invoice.getInvoiceNumber()));
                contentStream.newLine();
                contentStream.setFont(normalFont, 12);
                contentStream.showText(sanitizeText("Billing Cycle: " + invoice.getBillingCycle().getCycleName()));
                contentStream.newLine();
                contentStream.showText("Issue Date: " + invoice.getIssueDate().format(formatter));
                contentStream.newLine();
                contentStream.setNonStrokingColor(Color.RED);
                contentStream.showText("Due Date: " + invoice.getDueDate().format(formatter));
                contentStream.endText();

                // Draw Divider Line
                contentStream.setStrokingColor(Color.LIGHT_GRAY);
                contentStream.setLineWidth(1f);
                contentStream.moveTo(50, 560);
                contentStream.lineTo(560, 560);
                contentStream.stroke();

                // Billing Breakdown Section
                contentStream.beginText();
                contentStream.setNonStrokingColor(Color.BLACK);
                contentStream.setFont(titleFont, 14);
                contentStream.newLineAtOffset(50, 530);
                contentStream.showText("Charges Breakdown");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(normalFont, 12);
                contentStream.newLineAtOffset(50, 500);
                contentStream.setLeading(25f);
                contentStream.showText(String.format("Total Metered Consumption: %.3f kL", consumption));
                contentStream.newLine();
                contentStream.showText("Tiered Usage Charge: ");
                contentStream.newLine();
                contentStream.showText("Shared Area Contribution: ");
                contentStream.endText();

                // Align numbers to the right
                contentStream.beginText();
                contentStream.setFont(normalFont, 12);
                contentStream.newLineAtOffset(450, 475);
                contentStream.setLeading(25f);
                contentStream.showText(String.format("INR %.2f", meteredCharge));
                contentStream.newLine();
                contentStream.showText(String.format("INR %.2f", sharedCharge));
                contentStream.endText();

                // Total Amount Box
                contentStream.setNonStrokingColor(new Color(241, 245, 249));
                contentStream.addRect(50, 390, 510, 40);
                contentStream.fill();

                contentStream.beginText();
                contentStream.setFont(titleFont, 16);
                contentStream.setNonStrokingColor(new Color(41, 128, 185));
                contentStream.newLineAtOffset(60, 403);
                contentStream.showText("Total Amount Due:");

                contentStream.newLineAtOffset(370, 0);
                contentStream.showText(String.format("INR %.2f", totalAmount));
                contentStream.endText();

                // 9. Footer
                contentStream.beginText();
                contentStream.setFont(normalFont, 10);
                contentStream.setNonStrokingColor(Color.GRAY);
                contentStream.newLineAtOffset(200, 50);
                contentStream.showText("Thank you for conserving water!");
                contentStream.endText();
            }

            document.save(new File(filePath));
            return filePath;

        } catch (IOException e) {
            throw new ApiException("Failed to generate PDF for invoice: " + invoice.getInvoiceNumber(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    //Replaces unsupported non-ASCII characters so PDFBox Standard14Fonts never throw encoding exceptions.
    private String sanitizeText(String input) {
        if (input == null) return "";
        return input.replaceAll("[^\\x20-\\x7E]", "");
    }
}