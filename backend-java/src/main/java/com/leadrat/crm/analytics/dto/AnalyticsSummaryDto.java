package com.leadrat.crm.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsSummaryDto {
    private UUID tenantId;
    private LocalDate summaryDate;
    private Integer totalMessages;
    private Integer totalSessions;
    private Integer totalVisitsScheduled;
    private Integer totalVisitsCompleted;
    private Long averageResponseTimeMs;
    private Long totalTokensUsed;
    private Integer failedQueries;
    private Double successRate;
}
