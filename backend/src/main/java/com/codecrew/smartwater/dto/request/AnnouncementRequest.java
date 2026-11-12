package com.codecrew.smartwater.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnnouncementRequest {
    @NotBlank(message = "Announcement title is required")
    private String title;

    @NotBlank(message = "Announcement description is required")
    private String description;
}