package com.codecrew.smartwater.service;

import com.codecrew.smartwater.model.entity.Household;
import com.codecrew.smartwater.model.entity.UsageAlert;
import com.codecrew.smartwater.model.entity.WaterUsageLog;
import com.codecrew.smartwater.repository.HouseholdRepository;
import com.codecrew.smartwater.repository.UsageAlertRepository;
import com.codecrew.smartwater.repository.WaterUsageLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class AlertEngineService {

    private static final Logger logger = LoggerFactory.getLogger(AlertEngineService.class);

    // Configurable static threshold: 1.5 kL in a single day
    private static final BigDecimal HIGH_USAGE_THRESHOLD = new BigDecimal("1.500");

    private final HouseholdRepository householdRepository;
    private final WaterUsageLogRepository logRepository;
    private final UsageAlertRepository alertRepository;
    private final EmailService emailService;

    public AlertEngineService(HouseholdRepository householdRepository,
                              WaterUsageLogRepository logRepository,
                              UsageAlertRepository alertRepository,
                              EmailService emailService) {
        this.householdRepository = householdRepository;
        this.logRepository = logRepository;
        this.alertRepository = alertRepository;
        this.emailService = emailService;
    }

    // Runs every night at 2:00 AM or when manually triggered by Admin
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void runDailyAnomalyDetection() {
        logger.info("Starting Daily Anomaly & Leak Detection Scan...");

        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<Household> households = householdRepository.findAll();

        for (Household household : households) {
            if (household.getWaterMeter() == null || household.getResident() == null) continue;

            Long meterId = household.getWaterMeter().getId();

            // Check yesterday's reading; fall back to the meter's latest reading date for manual testing
            LocalDate targetDate = yesterday;
            WaterUsageLog targetLog = logRepository.findByWaterMeterIdAndReadingDate(meterId, targetDate).orElse(null);

            if (targetLog == null && household.getWaterMeter().getLastReadingDate() != null) {
                targetDate = household.getWaterMeter().getLastReadingDate();
                targetLog = logRepository.findByWaterMeterIdAndReadingDate(meterId, targetDate).orElse(null);
            }

            if (targetLog == null) continue;
            BigDecimal dailyConsumption = targetLog.getConsumption();

            // Check Static High Usage Threshold (> 1.5 kL)
            if (dailyConsumption.compareTo(HIGH_USAGE_THRESHOLD) > 0) {
                createAndSendAlert(household, "HIGH_USAGE",
                        "Your water usage on " + targetDate + " was unusually high (" + dailyConsumption + " kL). Please check your taps.");
            }

            // Statistical Outlier Detection (2 Standard Deviations above 30-day average)
            List<WaterUsageLog> historicalLogs = logRepository.findByWaterMeterIdAndReadingDateBetweenOrderByReadingDateAsc(
                    meterId, targetDate.minusDays(30), targetDate.minusDays(1));

            if (historicalLogs.size() >= 7) {
                double average = historicalLogs.stream()
                        .mapToDouble(log -> log.getConsumption().doubleValue())
                        .average().orElse(0.0);

                double variance = historicalLogs.stream()
                        .mapToDouble(log -> Math.pow(log.getConsumption().doubleValue() - average, 2))
                        .average().orElse(0.0);

                double stdDev = Math.sqrt(variance);

                // Fixed multiplication syntax: average + (2 * stdDev)
                double outlierThreshold = average + (2 * stdDev);

                if (dailyConsumption.doubleValue() > outlierThreshold) {
                    createAndSendAlert(household, "POTENTIAL_LEAK",
                            "Potential leak detected! Your usage of " + dailyConsumption +
                                    " kL on " + targetDate + " is significantly higher than your normal average of " +
                                    String.format("%.2f", average) + " kL.");
                }
            }
        }
        logger.info("Daily Anomaly Scan Completed.");
    }

    private void createAndSendAlert(Household household, String type, String message) {
        UsageAlert alert = UsageAlert.builder()
                .household(household)
                .alertType(type)
                .message(message)
                .build();
        alertRepository.save(alert);

        emailService.sendAlertEmail(
                household.getResident().getEmail(),
                household.getResident().getFirstName(),
                "SmartWater Alert: " + type.replace("_", " "),
                message
        );
    }
}