package com.codecrew.smartwater.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AnnouncementResponse {
    private Long id;
    private String title;
    private String description;
    private Instant createdAt;
}