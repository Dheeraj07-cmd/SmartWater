package com.codecrew.smartwater.repository;

import com.codecrew.smartwater.model.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByResidentIdOrderByCreatedAtDesc(Long residentId);
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
}