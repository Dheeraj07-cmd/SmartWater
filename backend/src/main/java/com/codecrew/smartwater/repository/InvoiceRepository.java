package com.codecrew.smartwater.repository;

import com.codecrew.smartwater.model.entity.Invoice;
import com.codecrew.smartwater.model.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByBillingCycleId(Long billingCycleId);
    List<Invoice> findByHouseholdId(Long householdId);
    boolean existsByBillingCycleId(Long billingCycleId);
    long countByHouseholdApartmentIdAndStatus(Long apartmentId, InvoiceStatus status);
}