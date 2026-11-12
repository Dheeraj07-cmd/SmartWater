package com.codecrew.smartwater.controller;

import com.codecrew.smartwater.dto.request.ChangePasswordRequest;
import com.codecrew.smartwater.dto.request.SupportTicketRequest;
import com.codecrew.smartwater.dto.response.SupportTicketResponse;
import com.codecrew.smartwater.dto.response.UserProfileResponse;
import com.codecrew.smartwater.model.entity.Household;
import com.codecrew.smartwater.model.entity.Invoice;
import com.codecrew.smartwater.model.entity.User;
import com.codecrew.smartwater.repository.InvoiceRepository;
import com.codecrew.smartwater.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ResidentControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private UserService userService;
    @MockBean private InvoiceRepository invoiceRepository;

    @Test
    @WithMockUser(username = "resident@local.com", roles = "RESIDENT")
    void getProfile_Returns200OK() throws Exception {
        UserProfileResponse profile = UserProfileResponse.builder().email("resident@local.com").build();
        when(userService.getUserProfile(anyString())).thenReturn(profile);

        mockMvc.perform(get("/api/v1/resident/profile"))
                .andExpect(status().isOk());
    }

    @Test
    void getProfile_WithoutAuth_Returns403Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/resident/profile"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "resident@local.com", roles = "RESIDENT")
    void getUsageHistory_Returns200OK() throws Exception {
        when(userService.getResidentUsageHistory(anyString(), any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/resident/usage")
                        .param("startDate", "2026-10-01")
                        .param("endDate", "2026-10-31"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "resident@local.com", roles = "RESIDENT")
    void downloadInvoice_Success_Returns200OKWithPdf() throws Exception {
        Path tempFile = Files.createTempFile("test-invoice", ".pdf");
        Files.writeString(tempFile, "Dummy PDF Content");

        User resident = User.builder().email("resident@local.com").build();
        Household household = Household.builder().resident(resident).build();
        Invoice invoice = Invoice.builder()
                .id(1L)
                .pdfPath(tempFile.toString())
                .household(household)
                .build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        mockMvc.perform(get("/api/v1/resident/invoices/1/download"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + tempFile.getFileName().toString() + "\""));

        Files.deleteIfExists(tempFile);
    }

    @Test
    @WithMockUser(username = "hacker@local.com", roles = "RESIDENT")
    void downloadInvoice_DifferentUser_Returns403Forbidden() throws Exception {
        User realOwner = User.builder().email("resident@local.com").build();
        Household household = Household.builder().resident(realOwner).build();
        Invoice invoice = Invoice.builder().id(1L).household(household).build();

        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(invoice));

        mockMvc.perform(get("/api/v1/resident/invoices/1/download"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "resident@local.com", roles = "RESIDENT")
    void downloadInvoice_NotFound_Returns404() throws Exception {
        when(invoiceRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/resident/invoices/99/download"))
                .andExpect(status().isNotFound());
    }

    // --- NEW TESTS ---

    @Test
    @WithMockUser(username = "resident@local.com", roles = "RESIDENT")
    void getMyAlerts_Returns200OK() throws Exception {
        when(userService.getResidentAlerts(anyString())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/resident/alerts"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "resident@local.com", roles = "RESIDENT")
    void markAlertRead_Returns200OK() throws Exception {
        doNothing().when(userService).markAlertAsRead(anyLong(), anyString());

        mockMvc.perform(patch("/api/v1/resident/alerts/1/read"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "resident@local.com", roles = "RESIDENT")
    void submitSupportTicket_Returns201Created() throws Exception {
        SupportTicketRequest request = new SupportTicketRequest();
        request.setIssueType("LEAK_REPORT");
        request.setDescription("Pipe is leaking in the kitchen");

        SupportTicketResponse response = SupportTicketResponse.builder().id(1L).issueType("LEAK_REPORT").build();
        when(userService.createSupportTicket(any(SupportTicketRequest.class), anyString())).thenReturn(response);

        mockMvc.perform(post("/api/v1/resident/support")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "resident@local.com", roles = "RESIDENT")
    void updateProfile_WithMultipartFormData_Returns200OK() throws Exception {
        // Create a mock image file
        MockMultipartFile file = new MockMultipartFile(
                "profilePhoto",
                "test.png",
                MediaType.IMAGE_PNG_VALUE,
                "test image content".getBytes()
        );

        UserProfileResponse response = UserProfileResponse.builder()
                .email("resident@local.com")
                .phoneNumber("+91 9999999999")
                .profilePhotoUrl("http://cloudinary.com/test.png")
                .build();

        // Using any() for the MultipartFile since MockMultipartFile might not perfectly match internally during testing
        when(userService.updateUserProfile(anyString(), anyString(), any())).thenReturn(response);

        // For testing PATCH with Multipart, we use multipart().with(...) to override the default POST method
        mockMvc.perform(multipart("/api/v1/resident/profile")
                        .file(file)
                        .param("phoneNumber", "+91 9999999999")
                        .with(request -> {
                            request.setMethod("PATCH");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.phoneNumber").value("+91 9999999999"));
    }

    @Test
    @WithMockUser(username = "resident@local.com", roles = "RESIDENT")
    void changePassword_Returns200OK() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("oldPass123");
        request.setNewPassword("newPass123");

        doNothing().when(userService).changePassword(anyString(), any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/v1/resident/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}