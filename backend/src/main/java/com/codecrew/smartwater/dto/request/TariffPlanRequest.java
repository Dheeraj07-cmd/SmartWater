package com.codecrew.smartwater.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TariffPlanRequest {
    @NotNull private Long apartmentId;
    @NotBlank private String planName;
    @NotNull private BigDecimal baseRatePerKl;
    @NotNull private BigDecimal tier1ThresholdKl;
    @NotNull private BigDecimal tier2RatePerKl;
    private BigDecimal tier2ThresholdKl;
    private BigDecimal tier3RatePerKl;
    @NotNull private LocalDate effectiveFrom;
}