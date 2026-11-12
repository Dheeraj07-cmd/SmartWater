package com.codecrew.smartwater.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class BulkPurchaseResponse {
    private Long id;
    private Long apartmentId;
    private Long billingCycleId;
    private LocalDate purchaseDate;
    private BigDecimal volumeKl;
    private BigDecimal totalCost;
    private String vendorName;
}