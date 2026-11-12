package com.codecrew.smartwater.controller;

import com.codecrew.smartwater.service.AlertEngineService;
import com.codecrew.smartwater.service.BillingEngineService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BillingAdminControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private BillingEngineService billingEngineService;
    @MockBean private AlertEngineService alertEngineService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void generateInvoices_AsAdmin_Returns200OK() throws Exception {
        when(billingEngineService.generateInvoicesForCycle(1L)).thenReturn(List.of());

        mockMvc.perform(post("/api/v1/admin/billing/cycles/1/generate-invoices"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "RESIDENT")
    void generateInvoices_AsResident_Returns403Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/admin/billing/cycles/1/generate-invoices"))
                .andExpect(status().isForbidden());
    }
}