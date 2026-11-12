package com.codecrew.smartwater.controller;

import com.codecrew.smartwater.common.ApiResponse;
import com.codecrew.smartwater.dto.request.ChangePasswordRequest;
import com.codecrew.smartwater.dto.request.SupportTicketRequest;
import com.codecrew.smartwater.dto.response.*;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.exception.ResourceNotFoundException;
import com.codecrew.smartwater.model.entity.Invoice;
import com.codecrew.smartwater.repository.InvoiceRepository;
import com.codecrew.smartwater.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/resident")
@Tag(name = "Resident Portal", description = "Endpoints accessible by residents to view profiles and usage history")
@SecurityRequirement(name = "BearerAuth")
public class ResidentController {

    private final UserService userService;
    private final InvoiceRepository invoiceRepository;

    public ResidentController(UserService userService, InvoiceRepository invoiceRepository) {
        this.userService = userService;
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping("/profile")
    @Operation(summary = "Get current resident's profile and flat details")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserProfile(authentication.getName())));
    }

    @GetMapping("/usage")
    @Operation(summary = "Get water usage logs for the logged-in resident within a date range")
    public ResponseEntity<ApiResponse<List<WaterUsageLogResponse>>> getUsageHistory(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getResidentUsageHistory(authentication.getName(), startDate, endDate)));
    }

    @Transactional(readOnly = true)
    @GetMapping("/invoices/{invoiceId}/download")
    @Operation(summary = "Download a PDF invoice")
    public ResponseEntity<Resource> downloadInvoice(@PathVariable Long invoiceId, Authentication authentication) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        if (invoice.getHousehold() == null ||
                invoice.getHousehold().getResident() == null ||
                !invoice.getHousehold().getResident().getEmail().equals(authentication.getName())) {
            throw new ApiException("You are not authorized to download this invoice.", HttpStatus.FORBIDDEN);
        }

        if (invoice.getPdfPath() == null || invoice.getPdfPath().isBlank()) {
            throw new ApiException("PDF file path is missing for this invoice.", HttpStatus.NOT_FOUND);
        }

        try {
            Path file = Paths.get(invoice.getPdfPath());
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(resource);
            } else {
                throw new ApiException("Could not read the PDF file on server.", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (MalformedURLException e) {
            throw new ApiException("Error downloading the PDF file.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/invoices")
    @Operation(summary = "Get all invoices for the logged-in resident")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getMyInvoices(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(userService.getResidentInvoices(authentication.getName())));
    }

    @GetMapping("/alerts")
    @Operation(summary = "Get all alerts for the logged-in resident")
    public ResponseEntity<ApiResponse<List<UsageAlertResponse>>> getMyAlerts(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(userService.getResidentAlerts(authentication.getName())));
    }

    @PatchMapping("/alerts/{alertId}/read")
    @Operation(summary = "Mark a specific alert as read")
    public ResponseEntity<ApiResponse<String>> markAlertRead(@PathVariable Long alertId, Authentication authentication) {
        userService.markAlertAsRead(alertId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Alert marked as read.", null));
    }

    @PostMapping("/support")
    @Operation(summary = "Submit a support ticket")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> submitSupportTicket(
            @Valid @RequestBody SupportTicketRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Support ticket submitted successfully.",
                userService.createSupportTicket(request, authentication.getName())));
    }

    @PatchMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update resident profile (phone, photo upload)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) MultipartFile profilePhoto,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.updateUserProfile(authentication.getName(), phoneNumber, profilePhoto)));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change account password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @GetMapping("/support")
    @Operation(summary = "Get all support tickets submitted by the logged-in resident")
    public ResponseEntity<ApiResponse<List<SupportTicketResponse>>> getMySupportTickets(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(userService.getResidentSupportTickets(authentication.getName())));
    }

    @GetMapping("/announcements")
    @Operation(summary = "Get all community announcements for residents")
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getAnnouncements() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllAnnouncements()));
    }

    @DeleteMapping("/profile")
    @Operation(summary = "Delete current resident's account permanently")
    public ResponseEntity<ApiResponse<String>> deleteAccount(Authentication authentication) {
        userService.deleteUserAccount(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Your account has been deleted permanently.", null));
    }
}