package com.codecrew.smartwater.dto.response;

import com.codecrew.smartwater.model.enums.CycleStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class BillingCycleResponse {
    private Long id;
    private Long apartmentId;
    private String cycleName;
    private LocalDate startDate;
    private LocalDate endDate;
    private CycleStatus status;
}