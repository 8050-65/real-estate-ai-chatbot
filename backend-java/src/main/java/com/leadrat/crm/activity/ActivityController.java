package com.leadrat.crm.activity;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.common.PageResponse;
import com.leadrat.crm.common.TenantContext;
import com.leadrat.crm.activity.dto.ActivityDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
@Tag(name = "Activities", description = "Activity and visit management")
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    @Operation(summary = "Create activity", description = "Create new activity/visit")
    public ResponseEntity<ApiResponse<ActivityDto>> createActivity(
            @Valid @RequestBody ActivityDto request) {
        UUID tenantId = TenantContext.get();
        ActivityDto activity = activityService.createActivity(tenantId, request);
        return ResponseEntity.ok(ApiResponse.success("Activity created", activity));
    }

    @GetMapping
    @Operation(summary = "List activities", description = "List all activities for tenant")
    public ResponseEntity<ApiResponse<PageResponse<ActivityDto>>> getActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        UUID tenantId = TenantContext.get();
        Pageable pageable = PageRequest.of(page, size);
        var pageResponse = status != null && !status.isEmpty()
            ? PageResponse.from(activityService.getActivitiesByTenantAndStatus(tenantId, status, pageable))
            : PageResponse.from(activityService.getActivitiesByTenant(tenantId, pageable));
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @GetMapping("/lead/{leadId}")
    @Operation(summary = "List activities by lead", description = "List all activities for a specific lead")
    public ResponseEntity<ApiResponse<PageResponse<ActivityDto>>> getActivitiesByLeadId(
            @PathVariable String leadId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID tenantId = TenantContext.get();
        Pageable pageable = PageRequest.of(page, size);
        var pageResponse = PageResponse.from(activityService.getActivitiesByLeadId(tenantId, leadId, pageable));
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get activity by ID", description = "Get specific activity details")
    public ResponseEntity<ApiResponse<ActivityDto>> getActivityById(@PathVariable UUID id) {
        UUID tenantId = TenantContext.get();
        ActivityDto activity = activityService.getActivityById(tenantId, id);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update activity", description = "Update activity details")
    public ResponseEntity<ApiResponse<ActivityDto>> updateActivity(
            @PathVariable UUID id,
            @Valid @RequestBody ActivityDto request) {
        UUID tenantId = TenantContext.get();
        ActivityDto activity = activityService.updateActivity(tenantId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Activity updated", activity));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update activity status", description = "Update activity status (scheduled, completed, cancelled, etc.)")
    public ResponseEntity<ApiResponse<ActivityDto>> updateActivityStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        UUID tenantId = TenantContext.get();
        ActivityDto activity = activityService.updateActivityStatus(tenantId, id, status);
        return ResponseEntity.ok(ApiResponse.success("Activity status updated", activity));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete activity", description = "Delete activity by ID")
    public ResponseEntity<ApiResponse<Void>> deleteActivity(@PathVariable UUID id) {
        UUID tenantId = TenantContext.get();
        activityService.deleteActivity(tenantId, id);
        return ResponseEntity.ok(ApiResponse.success("Activity deleted", null));
    }
}
