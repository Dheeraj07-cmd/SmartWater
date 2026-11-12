package com.codecrew.smartwater.repository;

import com.codecrew.smartwater.model.entity.UsageAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsageAlertRepository extends JpaRepository<UsageAlert, Long> {
    List<UsageAlert> findByHouseholdIdOrderByCreatedAtDesc(Long householdId);
    long countByHouseholdApartmentIdAndIsReadFalse(Long apartmentId);
    List<UsageAlert> findByHouseholdApartmentIdOrderByCreatedAtDesc(Long apartmentId);
}