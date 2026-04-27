package com.leadrat.crm.sitevisit;

import com.leadrat.crm.common.ResourceNotFoundException;
import com.leadrat.crm.sitevisit.dto.SiteVisitDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteVisitService {

    private final SiteVisitRepository siteVisitRepository;

    public SiteVisitDto scheduleVisit(UUID tenantId, SiteVisitDto dto) {
        SiteVisit visit = new SiteVisit();
        visit.setId(UUID.randomUUID());
        visit.setTenantId(tenantId);
        visit.setLeadratLeadId(dto.getLeadratLeadId());
        visit.setLeadratProjectId(dto.getLeadratProjectId());
        visit.setLeadratVisitId(dto.getLeadratVisitId());
        visit.setCustomerName(dto.getCustomerName());
        visit.setWhatsappNumber(dto.getWhatsappNumber());
        visit.setRmId(dto.getRmId());
        visit.setScheduledAt(dto.getScheduledAt());
        visit.setDurationMinutes(dto.getDurationMinutes());
        visit.setVisitorCount(dto.getVisitorCount());
        visit.setStatus("scheduled");
        visit.setNotes(dto.getNotes());
        visit.setGoogleMapsLink(dto.getGoogleMapsLink());
        visit.setReminder24hSent(false);
        visit.setReminder2hSent(false);
        visit.setLeadratSynced(false);
        visit.setLeadratStatusSynced(false);

        SiteVisit saved = siteVisitRepository.save(visit);
        return toDto(saved);
    }

    public Page<SiteVisitDto> getVisitsByTenant(UUID tenantId, Pageable pageable) {
        Page<SiteVisit> visits = siteVisitRepository.findByTenantId(tenantId, pageable);
        return new PageImpl<>(
                visits.getContent().stream().map(this::toDto).collect(Collectors.toList()),
                pageable,
                visits.getTotalElements()
        );
    }

    public Page<SiteVisitDto> getVisitsByStatus(UUID tenantId, String status, Pageable pageable) {
        Page<SiteVisit> visits = siteVisitRepository.findByTenantIdAndStatus(tenantId, status, pageable);
        return new PageImpl<>(
                visits.getContent().stream().map(this::toDto).collect(Collectors.toList()),
                pageable,
                visits.getTotalElements()
        );
    }

    public SiteVisitDto getVisitById(UUID tenantId, UUID visitId) {
        SiteVisit visit = siteVisitRepository.findByIdAndTenantId(visitId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Visit not found"));
        return toDto(visit);
    }

    public SiteVisitDto updateVisitStatus(UUID tenantId, UUID visitId, String status) {
        SiteVisit visit = siteVisitRepository.findByIdAndTenantId(visitId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Visit not found"));
        visit.setStatus(status);
        SiteVisit updated = siteVisitRepository.save(visit);
        return toDto(updated);
    }

    public SiteVisitDto updateVisit(UUID tenantId, UUID visitId, SiteVisitDto dto) {
        SiteVisit visit = siteVisitRepository.findByIdAndTenantId(visitId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Visit not found"));

        if (dto.getCustomerName() != null) visit.setCustomerName(dto.getCustomerName());
        if (dto.getScheduledAt() != null) visit.setScheduledAt(dto.getScheduledAt());
        if (dto.getDurationMinutes() != null) visit.setDurationMinutes(dto.getDurationMinutes());
        if (dto.getVisitorCount() != null) visit.setVisitorCount(dto.getVisitorCount());
        if (dto.getNotes() != null) visit.setNotes(dto.getNotes());
        if (dto.getGoogleMapsLink() != null) visit.setGoogleMapsLink(dto.getGoogleMapsLink());
        if (dto.getStatus() != null) visit.setStatus(dto.getStatus());

        SiteVisit updated = siteVisitRepository.save(visit);
        return toDto(updated);
    }

    public void deleteVisit(UUID tenantId, UUID visitId) {
        SiteVisit visit = siteVisitRepository.findByIdAndTenantId(visitId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Visit not found"));
        siteVisitRepository.delete(visit);
    }

    private SiteVisitDto toDto(SiteVisit visit) {
        return SiteVisitDto.builder()
                .id(visit.getId())
                .tenantId(visit.getTenantId())
                .leadratLeadId(visit.getLeadratLeadId())
                .leadratProjectId(visit.getLeadratProjectId())
                .leadratVisitId(visit.getLeadratVisitId())
                .customerName(visit.getCustomerName())
                .whatsappNumber(visit.getWhatsappNumber())
                .rmId(visit.getRmId())
                .scheduledAt(visit.getScheduledAt())
                .durationMinutes(visit.getDurationMinutes())
                .visitorCount(visit.getVisitorCount())
                .status(visit.getStatus())
                .notes(visit.getNotes())
                .googleMapsLink(visit.getGoogleMapsLink())
                .reminder24hSent(visit.getReminder24hSent())
                .reminder2hSent(visit.getReminder2hSent())
                .leadratSynced(visit.getLeadratSynced())
                .leadratSyncError(visit.getLeadratSyncError())
                .createdAt(visit.getCreatedAt())
                .updatedAt(visit.getUpdatedAt())
                .build();
    }
}
