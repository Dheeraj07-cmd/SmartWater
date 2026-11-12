package com.codecrew.smartwater.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SupportTicketRequest {
    @NotBlank(message = "Issue type is required")
    private String issueType;

    @NotBlank(message = "Description is required")
    private String description;
}