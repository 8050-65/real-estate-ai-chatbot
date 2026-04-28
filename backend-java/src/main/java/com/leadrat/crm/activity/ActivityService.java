package com.leadrat.crm.activity;

import com.leadrat.crm.common.ResourceNotFoundException;
import com.leadrat.crm.activity.dto.ActivityDto;
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
public class ActivityService {

    private final ActivityRepository activityRepository;

    public ActivityDto createActivity(UUID tenantId, ActivityDto dto) {
        CrmActivity activity = new CrmActivity();
        activity.setId(UUID.randomUUID());
        activity.setTenantId(tenantId);
        activity.setLeadratLeadId(dto.getLeadratLeadId());
        activity.setLeadratProjectId(dto.getLeadratProjectId());
        activity.setLeadratVisitId(dto.getLeadratVisitId());
        activity.setCustomerName(dto.getCustomerName());
        activity.setWhatsappNumber(dto.getWhatsappNumber());
        activity.setRmId(dto.getRmId());
        activity.setScheduledAt(dto.getScheduledAt());
        activity.setDurationMinutes(dto.getDurationMinutes());
        activity.setVisitorCount(dto.getVisitorCount());
        activity.setStatus(dto.getStatus());
        activity.setNotes(dto.getNotes());
        activity.setCancelledReason(dto.getCancelledReason());
        activity.setGoogleMapsLink(dto.getGoogleMapsLink());
        activity.setLeadratSynced(false);

        CrmActivity saved = activityRepository.save(activity);
        return toDto(saved);
    }

    public Page<ActivityDto> getActivitiesByTenant(UUID tenantId, Pageable pageable) {
        Page<CrmActivity> activities = activityRepository.findByTenantId(tenantId, pageable);
        return new PageImpl<>(
                activities.getContent().stream().map(this::toDto).collect(Collectors.toList()),
                pageable,
                activities.getTotalElements()
        );
    }

    public Page<ActivityDto> getActivitiesByTenantAndStatus(UUID tenantId, String status, Pageable pageable) {
        Page<CrmActivity> activities = activityRepository.findByTenantIdAndStatus(tenantId, status, pageable);
        return new PageImpl<>(
                activities.getContent().stream().map(this::toDto).collect(Collectors.toList()),
                pageable,
                activities.getTotalElements()
        );
    }

    public Page<ActivityDto> getActivitiesByLeadId(UUID tenantId, String leadratLeadId, Pageable pageable) {
        Page<CrmActivity> activities = activityRepository.findByTenantIdAndLeadratLeadId(tenantId, leadratLeadId, pageable);
        return new PageImpl<>(
                activities.getContent().stream().map(this::toDto).collect(Collectors.toList()),
                pageable,
                activities.getTotalElements()
        );
    }

    public ActivityDto getActivityById(UUID tenantId, UUID activityId) {
        CrmActivity activity = activityRepository.findByIdAndTenantId(activityId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));
        return toDto(activity);
    }

    public ActivityDto updateActivityStatus(UUID tenantId, UUID activityId, String status) {
        CrmActivity activity = activityRepository.findByIdAndTenantId(activityId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));
        activity.setStatus(status);
        CrmActivity updated = activityRepository.save(activity);
        return toDto(updated);
    }

    public ActivityDto updateActivity(UUID tenantId, UUID activityId, ActivityDto dto) {
        CrmActivity activity = activityRepository.findByIdAndTenantId(activityId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (dto.getCustomerName() != null) activity.setCustomerName(dto.getCustomerName());
        if (dto.getWhatsappNumber() != null) activity.setWhatsappNumber(dto.getWhatsappNumber());
        if (dto.getScheduledAt() != null) activity.setScheduledAt(dto.getScheduledAt());
        if (dto.getDurationMinutes() != null) activity.setDurationMinutes(dto.getDurationMinutes());
        if (dto.getVisitorCount() != null) activity.setVisitorCount(dto.getVisitorCount());
        if (dto.getStatus() != null) activity.setStatus(dto.getStatus());
        if (dto.getNotes() != null) activity.setNotes(dto.getNotes());
        if (dto.getCancelledReason() != null) activity.setCancelledReason(dto.getCancelledReason());
        if (dto.getGoogleMapsLink() != null) activity.setGoogleMapsLink(dto.getGoogleMapsLink());

        CrmActivity updated = activityRepository.save(activity);
        return toDto(updated);
    }

    public void deleteActivity(UUID tenantId, UUID activityId) {
        CrmActivity activity = activityRepository.findByIdAndTenantId(activityId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));
        activityRepository.delete(activity);
    }

    private ActivityDto toDto(CrmActivity activity) {
        return ActivityDto.builder()
                .id(activity.getId())
                .tenantId(activity.getTenantId())
                .leadratLeadId(activity.getLeadratLeadId())
                .leadratProjectId(activity.getLeadratProjectId())
                .leadratVisitId(activity.getLeadratVisitId())
                .customerName(activity.getCustomerName())
                .whatsappNumber(activity.getWhatsappNumber())
                .rmId(activity.getRmId())
                .scheduledAt(activity.getScheduledAt())
                .durationMinutes(activity.getDurationMinutes())
                .visitorCount(activity.getVisitorCount())
                .status(activity.getStatus())
                .notes(activity.getNotes())
                .cancelledReason(activity.getCancelledReason())
                .reminder24hSent(activity.getReminder24hSent())
                .reminder2hSent(activity.getReminder2hSent())
                .leadratSynced(activity.getLeadratSynced())
                .leadratSyncError(activity.getLeadratSyncError())
                .googleMapsLink(activity.getGoogleMapsLink())
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();
    }
}
