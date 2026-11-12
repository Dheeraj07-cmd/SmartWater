package com.codecrew.smartwater.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UsageAlertResponse {
    private Long id;
    private String alertType;
    private String message;
    private Boolean isRead;
    private Instant createdAt;
}