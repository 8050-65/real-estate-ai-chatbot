package com.leadrat.crm.analytics;

import com.leadrat.crm.analytics.dto.AnalyticsQueryDto;
import com.leadrat.crm.analytics.dto.AnalyticsSummaryDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.time.Duration;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final WebClient webClient;

    @Value("${fastapi.url:http://backend-ai:8000}")
    private String fastApiUrl;

    public AnalyticsSummaryDto getAnalyticsSummary(UUID tenantId, LocalDate date) {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("total_messages", 0);
        metrics.put("total_sessions", 0);
        metrics.put("total_visits_scheduled", 0);
        metrics.put("total_visits_completed", 0);
        metrics.put("average_response_time_ms", 0);
        metrics.put("total_tokens_used", 0);
        metrics.put("failed_queries", 0);
        metrics.put("success_rate", 0.0);

        try {
            String response = webClient.get()
                    .uri(fastApiUrl + "/api/v1/analytics/summary?date=" + date)
                    .header("X-Tenant-Id", tenantId.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            if (response != null) {
                return buildSummaryFromResponse(response, tenantId, date);
            }
        } catch (Exception e) {
            log.error("Failed to fetch analytics summary from FastAPI", e);
        }

        return AnalyticsSummaryDto.builder()
                .tenantId(tenantId)
                .summaryDate(date)
                .totalMessages(0)
                .totalSessions(0)
                .totalVisitsScheduled(0)
                .totalVisitsCompleted(0)
                .averageResponseTimeMs(0L)
                .totalTokensUsed(0L)
                .failedQueries(0)
                .successRate(0.0)
                .build();
    }

    public AnalyticsQueryDto processNlqQuery(UUID tenantId, String query) {
        try {
            AnalyticsQueryDto queryRequest = AnalyticsQueryDto.builder()
                    .tenantId(tenantId)
                    .queryText(query)
                    .build();

            String response = webClient.post()
                    .uri(fastApiUrl + "/api/v1/analytics/nlq")
                    .header("X-Tenant-Id", tenantId.toString())
                    .bodyValue(queryRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            if (response != null) {
                return buildQueryResultFromResponse(response, tenantId, query);
            }
        } catch (Exception e) {
            log.error("Failed to process NLQ query", e);
        }

        return AnalyticsQueryDto.builder()
                .tenantId(tenantId)
                .queryText(query)
                .wasSuccessful(false)
                .errorMessage("Failed to process query")
                .build();
    }

    public Map<String, Object> getMetricsByDateRange(UUID tenantId, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> metrics = new HashMap<>();
        try {
            String response = webClient.get()
                    .uri(fastApiUrl + "/api/v1/analytics/metrics?start_date=" + startDate + "&end_date=" + endDate)
                    .header("X-Tenant-Id", tenantId.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            if (response != null) {
                return parseMetricsResponse(response);
            }
        } catch (Exception e) {
            log.error("Failed to fetch metrics", e);
        }

        return metrics;
    }

    private AnalyticsSummaryDto buildSummaryFromResponse(String response, UUID tenantId, LocalDate date) {
        return AnalyticsSummaryDto.builder()
                .tenantId(tenantId)
                .summaryDate(date)
                .totalMessages(0)
                .totalSessions(0)
                .totalVisitsScheduled(0)
                .totalVisitsCompleted(0)
                .averageResponseTimeMs(0L)
                .totalTokensUsed(0L)
                .failedQueries(0)
                .successRate(0.0)
                .build();
    }

    private AnalyticsQueryDto buildQueryResultFromResponse(String response, UUID tenantId, String query) {
        return AnalyticsQueryDto.builder()
                .tenantId(tenantId)
                .queryText(query)
                .resultType("chart")
                .wasSuccessful(true)
                .build();
    }

    private Map<String, Object> parseMetricsResponse(String response) {
        Map<String, Object> metrics = new HashMap<>();
        try {
            metrics.put("total_messages", 0);
            metrics.put("total_sessions", 0);
            metrics.put("conversion_rate", 0.0);
        } catch (Exception e) {
            log.error("Failed to parse metrics response", e);
        }
        return metrics;
    }
}
