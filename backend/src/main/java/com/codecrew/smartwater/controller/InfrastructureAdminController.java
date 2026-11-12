package com.codecrew.smartwater.controller;

import com.codecrew.smartwater.common.ApiResponse;
import com.codecrew.smartwater.dto.request.ApartmentRequest;
import com.codecrew.smartwater.dto.request.HouseholdRequest;
import com.codecrew.smartwater.dto.request.TariffPlanRequest;
import com.codecrew.smartwater.dto.request.WaterMeterRequest;
import com.codecrew.smartwater.dto.response.*;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.service.AnalyticsService;
import com.codecrew.smartwater.service.ApartmentService;
import com.codecrew.smartwater.service.HouseholdService;
import com.codecrew.smartwater.service.WaterMeterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Infrastructure", description = "Endpoints for managing apartments, households, and meters (Admin only)")
@SecurityRequirement(name = "BearerAuth")
public class InfrastructureAdminController {

    private final ApartmentService apartmentService;
    private final HouseholdService householdService;
    private final WaterMeterService waterMeterService;
    private final AnalyticsService analyticsService;

    public InfrastructureAdminController(ApartmentService apartmentService,
                                         HouseholdService householdService,
                                         WaterMeterService waterMeterService,
                                         AnalyticsService analyticsService) {
        this.apartmentService = apartmentService;
        this.householdService = householdService;
        this.waterMeterService = waterMeterService;
        this.analyticsService = analyticsService;
    }

    // --- Apartment Endpoints ---

    @PostMapping("/apartments")
    @Operation(summary = "Register a new apartment complex")
    public ResponseEntity<ApiResponse<ApartmentResponse>> createApartment(@Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Apartment created successfully", apartmentService.createApartment(request)));
    }

    @GetMapping("/apartments")
    @Operation(summary = "Get all apartments")
    public ResponseEntity<ApiResponse<List<ApartmentResponse>>> getAllApartments() {
        return ResponseEntity.ok(ApiResponse.success(apartmentService.getAllApartments()));
    }

    @GetMapping("/apartments/{id}")
    @Operation(summary = "Get apartment by ID")
    public ResponseEntity<ApiResponse<ApartmentResponse>> getApartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(apartmentService.getApartmentById(id)));
    }

    @PostMapping("/apartments/{apartmentId}/analytics/forecast")
    @Operation(summary = "Simulate how tariff changes impact revenue based on last month's usage")
    public ResponseEntity<ApiResponse<TariffSimulationResponse>> simulateRevenueForecast(
            @PathVariable Long apartmentId,
            @Valid @RequestBody TariffPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.simulateTariffChanges(apartmentId, request)));
    }

    // --- Household Endpoints ---

    @PostMapping("/households")
    @Operation(summary = "Register a new household within an apartment")
    public ResponseEntity<ApiResponse<HouseholdResponse>> createHousehold(@Valid @RequestBody HouseholdRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Household created successfully", householdService.createHousehold(request)));
    }

    @GetMapping("/apartments/{apartmentId}/households")
    @Operation(summary = "Get all households for a specific apartment")
    public ResponseEntity<ApiResponse<List<HouseholdResponse>>> getHouseholdsByApartment(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(ApiResponse.success(householdService.getHouseholdsByApartment(apartmentId)));
    }

    @PatchMapping("/households/{householdId}/assign-resident/{residentId}")
    @Operation(summary = "Assign a registered user (resident) to a household")
    public ResponseEntity<ApiResponse<HouseholdResponse>> assignResident(
            @PathVariable Long householdId,
            @PathVariable Long residentId) {
        return ResponseEntity.ok(ApiResponse.success("Resident assigned successfully",
                householdService.assignResident(householdId, residentId)));
    }

    @GetMapping("/unassigned-residents")
    @Operation(summary = "Get all registered residents who are not yet assigned to a flat")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getUnassignedResidents() {
        return ResponseEntity.ok(ApiResponse.success(householdService.getUnassignedResidents()));
    }

    @PatchMapping("/households/{householdId}/unassign-resident")
    @Operation(summary = "Remove (unassign) the current resident from a household")
    public ResponseEntity<ApiResponse<HouseholdResponse>> unassignResident(@PathVariable Long householdId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Resident removed from flat successfully",
                householdService.unassignResident(householdId)));
    }

    @GetMapping("/residents")
    @Operation(summary = "Get all registered residents with their flat assignment details")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllResidents() {
        return ResponseEntity.ok(ApiResponse.success(householdService.getAllResidents()));
    }

    // --- Water Meter Endpoints ---

    @PostMapping("/meters")
    @Operation(summary = "Configure a new water meter for a household")
    public ResponseEntity<ApiResponse<WaterMeterResponse>> createWaterMeter(@Valid @RequestBody WaterMeterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Water meter configured successfully", waterMeterService.createWaterMeter(request)));
    }

    @GetMapping("/apartments/{apartmentId}/analytics")
    @Operation(summary = "Get aggregated dashboard analytics for an apartment")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAnalytics(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getAdminDashboardAnalytics(apartmentId)));
    }

    @GetMapping("/apartments/{apartmentId}/active-alerts")
    @Operation(summary = "Get all system-generated leak and usage alerts for the apartment")
    public ResponseEntity<ApiResponse<List<AdminAlertOverviewResponse>>> getApartmentAlerts(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getActiveApartmentAlerts(apartmentId)));
    }

    @PatchMapping("/meters/{meterId}/status")
    @Operation(summary = "Update a water meter's status (ACTIVE, INACTIVE, FAULTY)")
    public ResponseEntity<ApiResponse<WaterMeterResponse>> updateMeterStatus(
            @PathVariable Long meterId,
            @RequestBody Map<String, String> payload) {
        String newStatus = payload != null ? payload.get("status") : null;
        return ResponseEntity.ok(ApiResponse.success(
                "Meter status updated to " + newStatus,
                waterMeterService.updateMeterStatus(meterId, newStatus)));
    }

    // --- Support-Tickets Endpoints ---

    @GetMapping("/support-tickets")
    @Operation(summary = "Get all support tickets across the apartment")
    public ResponseEntity<ApiResponse<List<SupportTicketResponse>>> getAllSupportTickets() {
        return ResponseEntity.ok(ApiResponse.success(apartmentService.getAllSupportTickets()));
    }

    @PatchMapping("/support-tickets/{ticketId}/status")
    @Operation(summary = "Update the status of a support ticket")
    public ResponseEntity<ApiResponse<String>> updateTicketStatus(
            @PathVariable Long ticketId,
            @RequestBody(required = false) Map<String, String> payload) {

        String newStatus = payload != null ? payload.get("status") : null;
        if (newStatus == null || newStatus.isBlank()) {
            throw new ApiException("Status field is required", HttpStatus.BAD_REQUEST);
        }

        apartmentService.updateSupportTicketStatus(ticketId, newStatus);
        return ResponseEntity.ok(ApiResponse.success("Ticket status updated successfully", null));
    }

    // --- Community Announcements Endpoints ---

    @PostMapping("/announcements")
    @Operation(summary = "Publish a new community announcement")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @Valid @RequestBody com.codecrew.smartwater.dto.request.AnnouncementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Announcement published successfully", apartmentService.createAnnouncement(request)));
    }

    @GetMapping("/announcements")
    @Operation(summary = "Get all community announcements")
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getAllAnnouncements() {
        return ResponseEntity.ok(ApiResponse.success(apartmentService.getAllAnnouncements()));
    }

    @DeleteMapping("/announcements/{id}")
    @Operation(summary = "Delete a community announcement")
    public ResponseEntity<ApiResponse<String>> deleteAnnouncement(@PathVariable Long id) {
        apartmentService.deleteAnnouncement(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted successfully", null));
    }
}