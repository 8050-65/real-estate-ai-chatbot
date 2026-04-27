package com.leadrat.crm.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsQueryDto {
    private UUID tenantId;
    private String queryText;
    private String interpretedQuery;
    private String resultType;
    private String resultSummary;
    private Long executionMs;
    private Boolean wasSuccessful;
    private String errorMessage;
}
