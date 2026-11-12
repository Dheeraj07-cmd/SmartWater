package com.codecrew.smartwater.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.codecrew.smartwater.dto.request.ChangePasswordRequest;
import com.codecrew.smartwater.dto.request.SupportTicketRequest;
import com.codecrew.smartwater.dto.response.*;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.exception.ResourceNotFoundException;
import com.codecrew.smartwater.model.entity.*;
import com.codecrew.smartwater.model.enums.MeterStatus;
import com.codecrew.smartwater.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final WaterUsageLogRepository logRepository;
    private final InvoiceRepository invoiceRepository;
    private final UsageAlertRepository usageAlertRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final AnnouncementRepository announcementRepository;
    private final Cloudinary cloudinary;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       HouseholdRepository householdRepository,
                       WaterUsageLogRepository logRepository,
                       InvoiceRepository invoiceRepository,
                       UsageAlertRepository usageAlertRepository,
                       SupportTicketRepository supportTicketRepository,
                       AnnouncementRepository announcementRepository,
                       Cloudinary cloudinary,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.logRepository = logRepository;
        this.invoiceRepository = invoiceRepository;
        this.usageAlertRepository = usageAlertRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.announcementRepository = announcementRepository;
        this.cloudinary = cloudinary;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Household household = householdRepository.findByResidentId(user.getId()).orElse(null);
        WaterMeter meter = (household != null) ? household.getWaterMeter() : null;

        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phoneNumber(user.getPhoneNumber())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .apartmentName(household != null ? household.getApartment().getName() : null)
                .flatNumber(household != null ? household.getFlatNumber() : null)
                .areaSqFt(household != null ? household.getAreaSqFt() : null)
                .meterNumber(meter != null ? meter.getMeterNumber() : null)
                .meterStatus(meter != null && meter.getStatus() != null ? meter.getStatus().name() : null) // <-- Added here
                .build();
    }

    @Transactional(readOnly = true)
    public List<WaterUsageLogResponse> getResidentUsageHistory(String email, LocalDate startDate, LocalDate endDate) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Household household = householdRepository.findByResidentId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No household assigned to resident: " + email));

        WaterMeter meter = household.getWaterMeter();
        if (meter == null) {
            throw new ResourceNotFoundException("No water meter configured for your flat");
        }

        List<WaterUsageLog> logs = logRepository.findByWaterMeterIdAndReadingDateBetweenOrderByReadingDateAsc(
                meter.getId(), startDate, endDate);

        return logs.stream().map(log -> WaterUsageLogResponse.builder()
                .id(log.getId())
                .meterId(meter.getId())
                .meterNumber(meter.getMeterNumber())
                .readingDate(log.getReadingDate())
                .currentReading(log.getCurrentReading())
                .consumption(log.getConsumption())
                .readingSource(log.getReadingSource())
                .isSimulated(log.getIsSimulated())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getResidentInvoices(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Household household = householdRepository.findByResidentId(user.getId()).orElse(null);
        if (household == null) {
            return List.of();
        }

        List<Invoice> invoices = invoiceRepository.findByHouseholdId(household.getId());

        return invoices.stream().map(inv -> InvoiceResponse.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .flatNumber(inv.getHousehold().getFlatNumber())
                .cycleName(inv.getBillingCycle().getCycleName())
                .issueDate(inv.getIssueDate())
                .dueDate(inv.getDueDate())
                .consumptionKl(inv.getConsumptionKl())
                .meteredCharge(inv.getMeteredCharge())
                .sharedAreaCharge(inv.getSharedAreaCharge())
                .totalAmount(inv.getTotalAmount())
                .status(inv.getStatus())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UsageAlertResponse> getResidentAlerts(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Household household = householdRepository.findByResidentId(user.getId()).orElse(null);
        if (household == null) {
            return List.of();
        }

        List<UsageAlert> alerts = usageAlertRepository.findByHouseholdIdOrderByCreatedAtDesc(household.getId());

        return alerts.stream().map(alert -> UsageAlertResponse.builder()
                .id(alert.getId())
                .alertType(alert.getAlertType())
                .message(alert.getMessage())
                .isRead(alert.getIsRead())
                .createdAt(alert.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public void markAlertAsRead(Long alertId, String email) {
        UsageAlert alert = usageAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("UsageAlert", "id", alertId));

        if (alert.getHousehold().getResident() == null ||
                !alert.getHousehold().getResident().getEmail().equals(email)) {
            throw new ApiException("Not authorized to modify this alert", HttpStatus.FORBIDDEN);
        }

        alert.setIsRead(true);
        usageAlertRepository.save(alert);
    }

    @Transactional
    public SupportTicketResponse createSupportTicket(SupportTicketRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // If resident reports a METER_FAULT, automatically mark their flat's meter as FAULTY in DB
        if ("METER_FAULT".equalsIgnoreCase(request.getIssueType())) {
            householdRepository.findByResidentId(user.getId()).ifPresent(household -> {
                if (household.getWaterMeter() != null) {
                    household.getWaterMeter().setStatus(MeterStatus.FAULTY);
                }
            });
        }

        SupportTicket ticket = SupportTicket.builder()
                .resident(user)
                .issueType(request.getIssueType())
                .description(request.getDescription())
                .build();

        SupportTicket savedTicket = supportTicketRepository.save(ticket);

        return SupportTicketResponse.builder()
                .id(savedTicket.getId())
                .issueType(savedTicket.getIssueType())
                .description(savedTicket.getDescription())
                .status(savedTicket.getStatus())
                .createdAt(savedTicket.getCreatedAt())
                .residentName(user.getFirstName() + " " + user.getLastName())
                .residentEmail(user.getEmail())
                .build();
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> getResidentSupportTickets(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return supportTicketRepository.findByResidentIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(t -> SupportTicketResponse.builder()
                        .id(t.getId())
                        .issueType(t.getIssueType())
                        .description(t.getDescription())
                        .status(t.getStatus())
                        .createdAt(t.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(a -> AnnouncementResponse.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .description(a.getDescription())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public UserProfileResponse updateUserProfile(String email, String phoneNumber, MultipartFile profilePhoto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            user.setPhoneNumber(phoneNumber.trim());
        }

        if (profilePhoto != null && !profilePhoto.isEmpty()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> uploadResult = cloudinary.uploader().upload(
                        profilePhoto.getBytes(),
                        ObjectUtils.asMap("folder", "smartwater/profiles", "resource_type", "image")
                );
                Object secureUrl = uploadResult.get("secure_url");
                String photoUrl = secureUrl != null ? secureUrl.toString() : uploadResult.get("url").toString();
                user.setProfilePhotoUrl(photoUrl);
            } catch (IOException e) {
                throw new ApiException("Failed to upload profile photo to Cloudinary", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        userRepository.save(user);
        return getUserProfile(email);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new ApiException("Incorrect old password", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUserAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        householdRepository.findByResidentId(user.getId()).ifPresent(household -> {
            household.setResident(null);
            householdRepository.saveAndFlush(household);
        });

        List<SupportTicket> tickets = supportTicketRepository.findByResidentIdOrderByCreatedAtDesc(user.getId());
        if (!tickets.isEmpty()) {
            supportTicketRepository.deleteAll(tickets);
        }

        userRepository.delete(user);
    }
}