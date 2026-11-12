package com.codecrew.smartwater.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BulkPurchaseRequest {
    @NotNull private Long apartmentId;
    @NotNull private Long billingCycleId;
    @NotNull private LocalDate purchaseDate;
    @NotNull private BigDecimal volumeKl;
    @NotNull private BigDecimal totalCost;
    private String vendorName;
}