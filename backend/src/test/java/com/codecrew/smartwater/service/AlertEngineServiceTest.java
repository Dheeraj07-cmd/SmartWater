package com.codecrew.smartwater.service;

import com.codecrew.smartwater.model.entity.*;
import com.codecrew.smartwater.repository.HouseholdRepository;
import com.codecrew.smartwater.repository.UsageAlertRepository;
import com.codecrew.smartwater.repository.WaterUsageLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertEngineServiceTest {

    @Mock private HouseholdRepository householdRepository;
    @Mock private WaterUsageLogRepository logRepository;
    @Mock private UsageAlertRepository alertRepository;
    @Mock private EmailService emailService;

    @InjectMocks private AlertEngineService alertEngineService;

    @Test
    void runDailyAnomalyDetection_TriggersHighUsageAlert() {
        User resident = User.builder().email("test@local.com").firstName("John").build();
        WaterMeter meter = WaterMeter.builder().id(1L).build();
        Household household = Household.builder().id(1L).resident(resident).waterMeter(meter).build();

        // Mock 2.5 kL usage (Above the 1.5 threshold)
        WaterUsageLog highUsageLog = WaterUsageLog.builder().consumption(BigDecimal.valueOf(2.5)).build();

        when(householdRepository.findAll()).thenReturn(List.of(household));
        when(logRepository.findByWaterMeterIdAndReadingDate(eq(1L), any(LocalDate.class)))
                .thenReturn(Optional.of(highUsageLog));

        // Mock historical data (not enough for 2-sigma deviation, just testing static threshold)
        when(logRepository.findByWaterMeterIdAndReadingDateBetweenOrderByReadingDateAsc(any(), any(), any()))
                .thenReturn(List.of());

        alertEngineService.runDailyAnomalyDetection();

        verify(alertRepository, times(1)).save(any(UsageAlert.class));
        verify(emailService, times(1)).sendAlertEmail(eq("test@local.com"), eq("John"), anyString(), anyString());
    }
}