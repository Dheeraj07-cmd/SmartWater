package com.codecrew.smartwater.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data
@Builder
public class SupportTicketResponse {
    private Long id;
    private String issueType;
    private String description;
    private String status;
    private Instant createdAt;
    private String residentName;
    private String residentEmail;
}