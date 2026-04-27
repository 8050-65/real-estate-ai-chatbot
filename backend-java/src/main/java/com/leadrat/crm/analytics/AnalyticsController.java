package com.leadrat.crm.analytics;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.common.TenantContext;
import com.leadrat.crm.analytics.dto.AnalyticsQueryDto;
import com.leadrat.crm.analytics.dto.AnalyticsSummaryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Analytics and reporting endpoints")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    @Operation(summary = "Get daily summary", description = "Get analytics summary for a specific date")
    public ResponseEntity<ApiResponse<AnalyticsSummaryDto>> getAnalyticsSummary(
            @RequestParam(required = false) LocalDate date) {
        UUID tenantId = TenantContext.get();
        if (date == null) {
            date = LocalDate.now();
        }
        AnalyticsSummaryDto summary = analyticsService.getAnalyticsSummary(tenantId, date);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @PostMapping("/nlq")
    @Operation(summary = "Process NLQ", description = "Process natural language query for analytics")
    public ResponseEntity<ApiResponse<AnalyticsQueryDto>> processNlqQuery(
            @RequestBody Map<String, String> request) {
        UUID tenantId = TenantContext.get();
        String query = request.get("query");
        if (query == null || query.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("Query cannot be empty"));
        }
        AnalyticsQueryDto result = analyticsService.processNlqQuery(tenantId, query);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get metrics by date range", description = "Get metrics for a date range")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMetricsByDateRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        UUID tenantId = TenantContext.get();
        Map<String, Object> metrics = analyticsService.getMetricsByDateRange(tenantId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }
}
