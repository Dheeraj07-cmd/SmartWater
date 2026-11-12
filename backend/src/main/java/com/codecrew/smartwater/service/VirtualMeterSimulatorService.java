package com.codecrew.smartwater.service;

import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.exception.ResourceNotFoundException;
import com.codecrew.smartwater.model.entity.WaterMeter;
import com.codecrew.smartwater.model.enums.MeterStatus;
import com.codecrew.smartwater.model.enums.ReadingSource;
import com.codecrew.smartwater.repository.WaterMeterRepository;
import com.codecrew.smartwater.repository.WaterUsageLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class VirtualMeterSimulatorService {

    private static final Logger logger = LoggerFactory.getLogger(VirtualMeterSimulatorService.class);

    private final WaterMeterRepository meterRepository;
    private final WaterUsageLogRepository logRepository;
    private final WaterUsageService waterUsageService;

    @Value("${app.simulator.min-daily-liters:200.0}")
    private double minDailyLiters;

    @Value("${app.simulator.max-daily-liters:800.0}")
    private double maxDailyLiters;

    public VirtualMeterSimulatorService(WaterMeterRepository meterRepository,
                                        WaterUsageLogRepository logRepository,
                                        WaterUsageService waterUsageService) {
        this.meterRepository = meterRepository;
        this.logRepository = logRepository;
        this.waterUsageService = waterUsageService;
    }

    /**
     * Runs daily at 1:00 AM server time or when triggered manually from the Admin UI.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void triggerDailySimulation() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate today = LocalDate.now();
        List<WaterMeter> virtualMeters = meterRepository.findAllByStatusAndIsVirtual(MeterStatus.ACTIVE, true);

        int count = 0;
        for (WaterMeter meter : virtualMeters) {
            // 1. Ensure yesterday's reading exists
            if (!logRepository.existsByWaterMeterIdAndReadingDate(meter.getId(), yesterday)) {
                waterUsageService.processAndSaveReading(meter, yesterday, generateRandomConsumption(), ReadingSource.SIMULATED, true);
                count++;
            }
            // 2. Also ensure today's reading exists when manually triggered so Meter Health Map turns HEALTHY immediately
            if (!logRepository.existsByWaterMeterIdAndReadingDate(meter.getId(), today)) {
                waterUsageService.processAndSaveReading(meter, today, generateRandomConsumption(), ReadingSource.SIMULATED, true);
                count++;
            }
        }
        logger.info("Automated Simulation Complete. Generated {} new readings across {} active virtual meters.", count, virtualMeters.size());
    }

    @Transactional
    public String generateHistoricalData(Long meterId, LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new ApiException("Start date cannot be after end date.", HttpStatus.BAD_REQUEST);
        }

        WaterMeter meter = meterRepository.findById(meterId)
                .orElseThrow(() -> new ResourceNotFoundException("WaterMeter", "id", meterId));

        if (!Boolean.TRUE.equals(meter.getIsVirtual())) {
            return "Skipped. Meter " + meter.getMeterNumber() + " is not a virtual meter.";
        }

        int generatedCount = 0;
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            if (!logRepository.existsByWaterMeterIdAndReadingDate(meter.getId(), currentDate)) {
                BigDecimal consumption = generateRandomConsumption();
                waterUsageService.processAndSaveReading(meter, currentDate, consumption, ReadingSource.SIMULATED, true);
                generatedCount++;
            }
            currentDate = currentDate.plusDays(1);
        }

        return "Successfully generated " + generatedCount + " historical readings for meter " + meter.getMeterNumber();
    }

    private BigDecimal generateRandomConsumption() {
        double randomValue = ThreadLocalRandom.current().nextDouble(minDailyLiters, maxDailyLiters);
        double kiloliters = randomValue / 1000.0;
        return BigDecimal.valueOf(kiloliters).setScale(3, RoundingMode.HALF_UP);
    }
}