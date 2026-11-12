package com.codecrew.smartwater.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class TariffSimulationResponse {
    private BigDecimal currentRevenue;
    private BigDecimal projectedRevenue;
    private BigDecimal revenueDifference;
}