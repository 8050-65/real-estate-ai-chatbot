package com.leadrat.crm.sitevisit;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.common.PageResponse;
import com.leadrat.crm.common.TenantContext;
import com.leadrat.crm.sitevisit.dto.SiteVisitDto;
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
@RequestMapping("/api/v1/site-visits")
@RequiredArgsConstructor
@Tag(name = "Site Visits", description = "Site visit scheduling and management")
public class SiteVisitController {

    private final SiteVisitService siteVisitService;

    @PostMapping
    @Operation(summary = "Schedule visit", description = "Schedule new site visit")
    public ResponseEntity<ApiResponse<SiteVisitDto>> scheduleVisit(
            @Valid @RequestBody SiteVisitDto request) {
        UUID tenantId = TenantContext.get();
        SiteVisitDto visit = siteVisitService.scheduleVisit(tenantId, request);
        return ResponseEntity.ok(ApiResponse.success("Visit scheduled", visit));
    }

    @GetMapping
    @Operation(summary = "List visits", description = "List all site visits for tenant")
    public ResponseEntity<ApiResponse<PageResponse<SiteVisitDto>>> getVisits(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID tenantId = TenantContext.get();
        Pageable pageable = PageRequest.of(page, size);
        var pageResponse = PageResponse.from(siteVisitService.getVisitsByTenant(tenantId, pageable));
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "List visits by status", description = "List visits filtered by status")
    public ResponseEntity<ApiResponse<PageResponse<SiteVisitDto>>> getVisitsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID tenantId = TenantContext.get();
        Pageable pageable = PageRequest.of(page, size);
        var pageResponse = PageResponse.from(siteVisitService.getVisitsByStatus(tenantId, status, pageable));
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get visit by ID", description = "Get specific site visit details")
    public ResponseEntity<ApiResponse<SiteVisitDto>> getVisitById(@PathVariable UUID id) {
        UUID tenantId = TenantContext.get();
        SiteVisitDto visit = siteVisitService.getVisitById(tenantId, id);
        return ResponseEntity.ok(ApiResponse.success(visit));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update visit", description = "Update site visit details")
    public ResponseEntity<ApiResponse<SiteVisitDto>> updateVisit(
            @PathVariable UUID id,
            @Valid @RequestBody SiteVisitDto request) {
        UUID tenantId = TenantContext.get();
        SiteVisitDto visit = siteVisitService.updateVisit(tenantId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Visit updated", visit));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update visit status", description = "Update visit status (scheduled, completed, cancelled)")
    public ResponseEntity<ApiResponse<SiteVisitDto>> updateVisitStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        UUID tenantId = TenantContext.get();
        SiteVisitDto visit = siteVisitService.updateVisitStatus(tenantId, id, status);
        return ResponseEntity.ok(ApiResponse.success("Visit status updated", visit));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete visit", description = "Delete site visit")
    public ResponseEntity<ApiResponse<Void>> deleteVisit(@PathVariable UUID id) {
        UUID tenantId = TenantContext.get();
        siteVisitService.deleteVisit(tenantId, id);
        return ResponseEntity.ok(ApiResponse.success("Visit deleted", null));
    }
}
