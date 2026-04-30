package com.leadrat.crm.webhook;

import com.leadrat.crm.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/events/internal")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Internal Events", description = "Webhook endpoints for FastAPI backend")
public class InternalEventController {

    @PostMapping("/conversation-completed")
    @Operation(summary = "Conversation completed", description = "Webhook called when conversation ends")
    public ResponseEntity<ApiResponse<Void>> onConversationCompleted(
            @RequestBody Map<String, Object> event) {
        log.info("Conversation completed event: {}", event);
        return ResponseEntity.ok(ApiResponse.success("Event processed", null));
    }

    @PostMapping("/visit-scheduled")
    @Operation(summary = "Visit scheduled", description = "Webhook called when visit is scheduled")
    public ResponseEntity<ApiResponse<Void>> onVisitScheduled(
            @RequestBody Map<String, Object> event) {
        log.info("Visit scheduled event: {}", event);
        return ResponseEntity.ok(ApiResponse.success("Event processed", null));
    }

    @PostMapping("/visit-completed")
    @Operation(summary = "Visit completed", description = "Webhook called when visit is completed")
    public ResponseEntity<ApiResponse<Void>> onVisitCompleted(
            @RequestBody Map<String, Object> event) {
        log.info("Visit completed event: {}", event);
        return ResponseEntity.ok(ApiResponse.success("Event processed", null));
    }

    @PostMapping("/lead-qualified")
    @Operation(summary = "Lead qualified", description = "Webhook called when lead qualifies")
    public ResponseEntity<ApiResponse<Void>> onLeadQualified(
            @RequestBody Map<String, Object> event) {
        log.info("Lead qualified event: {}", event);
        return ResponseEntity.ok(ApiResponse.success("Event processed", null));
    }

    @PostMapping("/error-occurred")
    @Operation(summary = "Error occurred", description = "Webhook called when error occurs in FastAPI")
    public ResponseEntity<ApiResponse<Void>> onErrorOccurred(
            @RequestBody Map<String, Object> event) {
        log.error("Error event from FastAPI: {}", event);
        return ResponseEntity.ok(ApiResponse.success("Event processed", null));
    }

    @PostMapping("/health-check")
    @Operation(summary = "Health check", description = "Health check endpoint for FastAPI")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success("Backend healthy", "OK"));
    }
}
