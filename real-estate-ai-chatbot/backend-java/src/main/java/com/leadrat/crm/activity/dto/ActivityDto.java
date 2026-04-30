package com.leadrat.crm.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityDto {
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
    private String cancelledReason;
    private Boolean reminder24hSent;
    private Boolean reminder2hSent;
    private Boolean leadratSynced;
    private String leadratSyncError;
    private String googleMapsLink;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
