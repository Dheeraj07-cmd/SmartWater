package com.codecrew.smartwater.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class AdminDashboardResponse {
    private long totalHouseholds;
    private BigDecimal totalConsumptionKl;
    private long activeAlerts;
    private long pendingInvoices;
    private List<HouseholdComparisonDto> householdComparisons;

    private BigDecimal totalSharedExpenses;
    private BigDecimal totalAllocatedExpenses;
    private BigDecimal totalMeteredRevenue;

    private List<MeterHealthDto> meterHealth;

    @Data
    @Builder
    public static class HouseholdComparisonDto {
        private String flatNumber;
        private BigDecimal usage;
        private BigDecimal average;
    }

    @Data
    @Builder
    public static class MeterHealthDto {
        private Long meterId;
        private String flatNumber;
        private String meterNumber;
        private String status; // ACTIVE, INACTIVE, FAULTY
        private BigDecimal lastReadingValue;
        private LocalDate lastReadingDate;
    }
}