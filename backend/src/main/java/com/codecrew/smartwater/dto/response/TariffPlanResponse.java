package com.codecrew.smartwater.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class TariffPlanResponse {
    private Long id;
    private Long apartmentId;
    private String planName;
    private BigDecimal baseRatePerKl;
    private BigDecimal tier1ThresholdKl;
    private BigDecimal tier2RatePerKl;
    private BigDecimal tier2ThresholdKl;
    private BigDecimal tier3RatePerKl;
    private LocalDate effectiveFrom;
    private Boolean isActive;
}