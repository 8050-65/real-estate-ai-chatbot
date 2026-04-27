package com.leadrat.crm.sitevisit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteVisitDto {
    private UUID id;
    private UUID tenantId;
    private String leadratLeadId;
    private String leadratProjectId;
    private String leadratVisitId;
    private String customerName;
    private String whatsappNumber;
    private UUID rmId;
    private OffsetDateTime scheduledAt;
    private Integer durationMinutes;
    private Integer visitorCount;
    private String status;
    private String notes;
    private String googleMapsLink;
    private Boolean reminder24hSent;
    private Boolean reminder2hSent;
    private Boolean leadratSynced;
    private String leadratSyncError;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
