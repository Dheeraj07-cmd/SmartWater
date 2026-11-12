package com.codecrew.smartwater.service;

import com.codecrew.smartwater.dto.request.MeterReadingRequest;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.exception.ResourceNotFoundException;
import com.codecrew.smartwater.model.entity.WaterMeter;
import com.codecrew.smartwater.model.entity.WaterUsageLog;
import com.codecrew.smartwater.model.enums.ReadingSource;
import com.codecrew.smartwater.repository.WaterMeterRepository;
import com.codecrew.smartwater.repository.WaterUsageLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class WaterUsageService {

    private final WaterUsageLogRepository logRepository;
    private final WaterMeterRepository meterRepository;

    public WaterUsageService(WaterUsageLogRepository logRepository, WaterMeterRepository meterRepository) {
        this.logRepository = logRepository;
        this.meterRepository = meterRepository;
    }

    @Transactional
    public WaterUsageLog recordManualReading(MeterReadingRequest request) {
        String meterNumber = request.getMeterNumber().trim();
        WaterMeter meter = meterRepository.findByMeterNumber(meterNumber)
                .orElseThrow(() -> new ResourceNotFoundException("WaterMeter", "meterNumber", meterNumber));

        return processAndSaveReading(meter, request.getReadingDate(), request.getConsumption(), ReadingSource.MANUAL, false);
    }

    @Transactional
    public String processCsvUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("CSV file is empty", HttpStatus.BAD_REQUEST);
        }

        int successCount = 0;
        int errorCount = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isHeader = true;

            while ((line = br.readLine()) != null) {
                if (line.isBlank()) {
                    continue; // Skip blank lines without counting as errors
                }
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip header row
                }

                String[] data = line.split(",");
                if (data.length < 3) {
                    errorCount++;
                    continue;
                }

                try {
                    String meterNumber = data[0].trim();
                    LocalDate date = LocalDate.parse(data[1].trim());
                    BigDecimal consumption = new BigDecimal(data[2].trim());

                    WaterMeter meter = meterRepository.findByMeterNumber(meterNumber).orElse(null);
                    if (meter != null && !logRepository.existsByWaterMeterIdAndReadingDate(meter.getId(), date)) {
                        processAndSaveReading(meter, date, consumption, ReadingSource.CSV_UPLOAD, false);
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (Exception e) {
                    errorCount++;
                }
            }
        } catch (Exception e) {
            throw new ApiException("Failed to parse CSV file: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }

        return String.format("CSV Upload complete. Successfully imported: %d, Failed/Skipped: %d", successCount, errorCount);
    }

    @Transactional
    public WaterUsageLog processAndSaveReading(WaterMeter meter, LocalDate date, BigDecimal consumption, ReadingSource source, boolean isSimulated) {
        if (logRepository.existsByWaterMeterIdAndReadingDate(meter.getId(), date)) {
            throw new ApiException("Reading already exists for this meter on " + date, HttpStatus.CONFLICT);
        }

        BigDecimal previousReading = meter.getLastReadingValue() != null ? meter.getLastReadingValue() : BigDecimal.ZERO;
        BigDecimal newCumulativeReading = previousReading.add(consumption);

        WaterUsageLog log = WaterUsageLog.builder()
                .waterMeter(meter)
                .readingDate(date)
                .consumption(consumption)
                .currentReading(newCumulativeReading)
                .readingSource(source)
                .isSimulated(isSimulated)
                .build();

        WaterUsageLog savedLog = logRepository.save(log);

        // Update meter status
        if (meter.getLastReadingDate() == null || date.isAfter(meter.getLastReadingDate()) || date.isEqual(meter.getLastReadingDate())) {
            meter.setLastReadingValue(newCumulativeReading);
            meter.setLastReadingDate(date);
            meterRepository.save(meter);
        }

        return savedLog;
    }
}