package com.codecrew.smartwater.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BillingCycleRequest {
    @NotNull private Long apartmentId;
    @NotBlank private String cycleName; // e.g., "April 2024"
    @NotNull private LocalDate startDate;
    @NotNull private LocalDate endDate;
}