package com.codecrew.smartwater.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        // Inject the @Value properties manually for testing
        ReflectionTestUtils.setField(emailService, "senderEmail", "admin@smartwater.local");
    }

    @Test
    void sendAlertEmail_SkipsExecution_WhenApiKeyIsBlank() throws JsonProcessingException {
        // Arrange: Set a blank API key
        ReflectionTestUtils.setField(emailService, "apiKey", "");

        emailService.sendAlertEmail("resident@local.com", "John Doe", "Leak Alert", "Check your taps");

        // Assert: ObjectMapper should never be called because the method returns early
        verify(objectMapper, never()).writeValueAsString(anyMap());
    }

    @Test
    @SuppressWarnings("unchecked")
    void sendAlertEmail_ProcessesPayload_WhenApiKeyExists() throws JsonProcessingException {
        // Arrange: Set a valid dummy API key
        ReflectionTestUtils.setField(emailService, "apiKey", "dummy-brevo-api-key");

        // Mock the object mapper to return a dummy JSON string to prevent NullPointerExceptions
        when(objectMapper.writeValueAsString(anyMap())).thenReturn("{}");

        emailService.sendAlertEmail("resident@local.com", "John Doe", "High Usage Alert", "5.5 kL used");

        // Assert: Capture the Map that was passed to the ObjectMapper
        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        verify(objectMapper, times(1)).writeValueAsString(payloadCaptor.capture());

        Map<String, Object> capturedPayload = payloadCaptor.getValue();

        // Verify Subject
        assertEquals("High Usage Alert", capturedPayload.get("subject"));

        // Verify HTML Content generation
        String htmlContent = (String) capturedPayload.get("htmlContent");
        assertNotNull(htmlContent);
        assertTrue(htmlContent.contains("Hello John Doe,"));
        assertTrue(htmlContent.contains("5.5 kL used"));

        // Verify To Email
        List<Map<String, String>> toList = (List<Map<String, String>>) capturedPayload.get("to");
        assertEquals(1, toList.size());
        assertEquals("resident@local.com", toList.get(0).get("email"));
    }
}