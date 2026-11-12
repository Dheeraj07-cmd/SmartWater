package com.codecrew.smartwater.service;

import com.codecrew.smartwater.dto.request.HouseholdRequest;
import com.codecrew.smartwater.dto.response.HouseholdResponse;
import com.codecrew.smartwater.dto.response.UserProfileResponse;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.exception.ResourceNotFoundException;
import com.codecrew.smartwater.model.entity.Apartment;
import com.codecrew.smartwater.model.entity.Household;
import com.codecrew.smartwater.model.entity.User;
import com.codecrew.smartwater.model.entity.WaterMeter;
import com.codecrew.smartwater.model.enums.Role;
import com.codecrew.smartwater.repository.ApartmentRepository;
import com.codecrew.smartwater.repository.HouseholdRepository;
import com.codecrew.smartwater.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class HouseholdService {

    private final HouseholdRepository householdRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;

    public HouseholdService(HouseholdRepository householdRepository,
                            ApartmentRepository apartmentRepository,
                            UserRepository userRepository) {
        this.householdRepository = householdRepository;
        this.apartmentRepository = apartmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public HouseholdResponse createHousehold(HouseholdRequest request) {
        if (householdRepository.existsByApartmentIdAndFlatNumber(request.getApartmentId(), request.getFlatNumber())) {
            throw new ApiException("Flat number already exists in this apartment", HttpStatus.BAD_REQUEST);
        }

        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Apartment", "id", request.getApartmentId()));

        Household household = Household.builder()
                .flatNumber(request.getFlatNumber())
                .floor(request.getFloor())
                .areaSqFt(request.getAreaSqFt())
                .occupantsCount(request.getOccupantsCount())
                .apartment(apartment)
                .build();

        Household savedHousehold = householdRepository.save(household);
        return mapToResponse(savedHousehold);
    }

    @Transactional
    public HouseholdResponse assignResident(Long householdId, Long residentId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new ResourceNotFoundException("Household", "id", householdId));

        if (household.getResident() != null) {
            throw new ApiException("This flat already has a resident assigned.", HttpStatus.BAD_REQUEST);
        }

        if (householdRepository.findByResidentId(residentId).isPresent()) {
            throw new ApiException("This resident is already assigned to another flat.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findById(residentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", residentId));

        household.setResident(user);
        Household updatedHousehold = householdRepository.save(household);

        return mapToResponse(updatedHousehold);
    }

    @Transactional
    public HouseholdResponse unassignResident(Long householdId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new ResourceNotFoundException("Household", "id", householdId));

        if (household.getResident() == null) {
            throw new ApiException("No resident is currently assigned to this flat.", HttpStatus.BAD_REQUEST);
        }

        household.setResident(null);
        Household updatedHousehold = householdRepository.save(household);

        return mapToResponse(updatedHousehold);
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getUnassignedResidents() {
        List<Long> assignedUserIds = householdRepository.findAll().stream()
                .filter(h -> h.getResident() != null)
                .map(h -> h.getResident().getId())
                .collect(Collectors.toList());

        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_RESIDENT)
                .filter(u -> !assignedUserIds.contains(u.getId()))
                .map(u -> UserProfileResponse.builder()
                        .id(u.getId())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .email(u.getEmail())
                        .phoneNumber(u.getPhoneNumber())
                        .profilePhotoUrl(u.getProfilePhotoUrl())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllResidents() {
        Map<Long, Household> residentHouseholdMap = householdRepository.findAll().stream()
                .filter(h -> h.getResident() != null)
                .collect(Collectors.toMap(
                        h -> h.getResident().getId(),
                        Function.identity(),
                        (existing, replacement) -> existing
                ));

        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_RESIDENT)
                .map(u -> {
                    Household h = residentHouseholdMap.get(u.getId());
                    WaterMeter meter = (h != null) ? h.getWaterMeter() : null;

                    return UserProfileResponse.builder()
                            .id(u.getId())
                            .firstName(u.getFirstName())
                            .lastName(u.getLastName())
                            .email(u.getEmail())
                            .role(u.getRole().name())
                            .phoneNumber(u.getPhoneNumber())
                            .profilePhotoUrl(u.getProfilePhotoUrl())
                            .apartmentName(h != null && h.getApartment() != null ? h.getApartment().getName() : null)
                            .flatNumber(h != null ? h.getFlatNumber() : null)
                            .areaSqFt(h != null ? h.getAreaSqFt() : null)
                            .meterNumber(meter != null ? meter.getMeterNumber() : null)
                            .meterStatus(meter != null && meter.getStatus() != null ? meter.getStatus().name() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HouseholdResponse> getHouseholdsByApartment(Long apartmentId) {
        return householdRepository.findByApartmentId(apartmentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private HouseholdResponse mapToResponse(Household household) {
        return HouseholdResponse.builder()
                .id(household.getId())
                .flatNumber(household.getFlatNumber())
                .floor(household.getFloor())
                .areaSqFt(household.getAreaSqFt())
                .occupantsCount(household.getOccupantsCount())
                .apartmentId(household.getApartment().getId())
                .residentId(household.getResident() != null ? household.getResident().getId() : null)
                .residentName(household.getResident() != null ?
                        household.getResident().getFirstName() + " " + household.getResident().getLastName() : null)
                .meterId(household.getWaterMeter() != null ? household.getWaterMeter().getId() : null)
                .meterNumber(household.getWaterMeter() != null ? household.getWaterMeter().getMeterNumber() : null)
                .build();
    }
}