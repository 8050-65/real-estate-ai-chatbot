package com.leadrat.crm.sitevisit;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "site_visits", indexes = {
        @Index(name = "idx_sitevisit_tenant", columnList = "tenant_id"),
        @Index(name = "idx_sitevisit_leadrat_lead", columnList = "leadrat_lead_id"),
        @Index(name = "idx_sitevisit_status", columnList = "status"),
        @Index(name = "idx_sitevisit_scheduled", columnList = "scheduled_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteVisit {
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

    @Column(nullable = false)
    @Builder.Default
    private Boolean reminder24hSent = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean reminder2hSent = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean leadratSynced = false;

    @Column
    private LocalDateTime leadratSyncAt;

    @Column(columnDefinition = "TEXT")
    private String leadratSyncError;

    @Column(nullable = false)
    @Builder.Default
    private Boolean leadratStatusSynced = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
