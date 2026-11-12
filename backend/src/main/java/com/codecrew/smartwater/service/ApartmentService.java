package com.codecrew.smartwater.service;

import com.codecrew.smartwater.dto.request.AnnouncementRequest;
import com.codecrew.smartwater.dto.request.ApartmentRequest;
import com.codecrew.smartwater.dto.response.AnnouncementResponse;
import com.codecrew.smartwater.dto.response.ApartmentResponse;
import com.codecrew.smartwater.dto.response.SupportTicketResponse;
import com.codecrew.smartwater.exception.ApiException;
import com.codecrew.smartwater.exception.ResourceNotFoundException;
import com.codecrew.smartwater.model.entity.Announcement;
import com.codecrew.smartwater.model.entity.Apartment;
import com.codecrew.smartwater.model.entity.SupportTicket;
import com.codecrew.smartwater.repository.AnnouncementRepository;
import com.codecrew.smartwater.repository.ApartmentRepository;
import com.codecrew.smartwater.repository.SupportTicketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final SupportTicketRepository ticketRepository;
    private final AnnouncementRepository announcementRepository;

    public ApartmentService(ApartmentRepository apartmentRepository, SupportTicketRepository ticketRepository, AnnouncementRepository announcementRepository) {
        this.apartmentRepository = apartmentRepository;
        this.ticketRepository = ticketRepository;
        this.announcementRepository = announcementRepository;
    }

    @Transactional
    public ApartmentResponse createApartment(ApartmentRequest request) {
        if (apartmentRepository.existsByName(request.getName())) {
            throw new ApiException("Apartment with this name already exists", HttpStatus.BAD_REQUEST);
        }

        Apartment apartment = Apartment.builder()
                .name(request.getName())
                .address(request.getAddress())
                .totalFlats(request.getTotalFlats())
                .commonAreaSqFt(request.getCommonAreaSqFt())
                .build();

        Apartment savedApartment = apartmentRepository.save(apartment);
        return mapToResponse(savedApartment);
    }

    @Transactional(readOnly = true)
    public List<ApartmentResponse> getAllApartments() {
        return apartmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApartmentResponse getApartmentById(Long id) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment", "id", id));
        return mapToResponse(apartment);
    }

    private ApartmentResponse mapToResponse(Apartment apartment) {
        return ApartmentResponse.builder()
                .id(apartment.getId())
                .name(apartment.getName())
                .address(apartment.getAddress())
                .totalFlats(apartment.getTotalFlats())
                .commonAreaSqFt(apartment.getCommonAreaSqFt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> getAllSupportTickets() {
        List<SupportTicket> tickets = ticketRepository.findAllByOrderByCreatedAtDesc();

        return tickets.stream().map(t -> SupportTicketResponse.builder()
                .id(t.getId())
                .issueType(t.getIssueType())
                .description(t.getDescription())
                .status(t.getStatus())
                .createdAt(t.getCreatedAt())
                .residentName(t.getResident() != null
                        ? t.getResident().getFirstName() + " " + t.getResident().getLastName()
                        : "Unknown Resident")
                .residentEmail(t.getResident() != null ? t.getResident().getEmail() : "")
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public void updateSupportTicketStatus(Long ticketId, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new ApiException("Ticket status cannot be empty", HttpStatus.BAD_REQUEST);
        }

        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("SupportTicket", "id", ticketId));

        ticket.setStatus(status.trim().toUpperCase());
        ticketRepository.save(ticket);
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(AnnouncementRequest request) {
        Announcement announcement = Announcement.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .build();

        Announcement saved = announcementRepository.save(announcement);

        return AnnouncementResponse.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .createdAt(saved.getCreatedAt())
                .build();
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
    public void deleteAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));
        announcementRepository.delete(announcement);
    }
}