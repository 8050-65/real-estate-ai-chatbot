package com.leadrat.crm.activity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "site_visits", indexes = {
        @Index(name = "idx_activity_tenant", columnList = "tenant_id"),
        @Index(name = "idx_activity_leadrat_lead", columnList = "leadrat_lead_id"),
        @Index(name = "idx_activity_leadrat_project", columnList = "leadrat_project_id"),
        @Index(name = "idx_activity_status", columnList = "status"),
        @Index(name = "idx_activity_scheduled", columnList = "scheduled_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    private String leadratLeadId;

    @Column(length = 100)
    private String leadratProjectId;

    @Column(length = 100)
    private String leadratVisitId;

    @Column(nullable = false, length = 200)
    private String customerName;

    @Column(nullable = false, length = 20)
    private String whatsappNumber;

    @Column
    private UUID rmId;

    @Column(nullable = false)
    private OffsetDateTime scheduledAt;

    @Column(nullable = false)
    @Builder.Default
    private Integer durationMinutes = 60;

    @Column(nullable = false)
    @Builder.Default
    private Integer visitorCount = 1;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "scheduled";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String googleMapsLink;

    @Column(name = "reminder_24h_sent", nullable = false)
    @Builder.Default
    private Boolean reminder24hSent = false;

    @Column(name = "reminder_2h_sent", nullable = false)
    @Builder.Default
    private Boolean reminder2hSent = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean leadratSynced = false;

    @Column(columnDefinition = "TEXT")
    private String leadratSyncError;

    @Column(columnDefinition = "TEXT")
    private String cancelledReason;

    @Column(nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
