package com.codecrew.smartwater.dto.response;

import com.codecrew.smartwater.model.enums.InvoiceStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private String flatNumber;
    private String cycleName;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private BigDecimal consumptionKl;
    private BigDecimal meteredCharge;
    private BigDecimal sharedAreaCharge;
    private BigDecimal totalAmount;
    private InvoiceStatus status;
}