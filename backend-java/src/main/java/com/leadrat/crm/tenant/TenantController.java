package com.leadrat.crm.tenant;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.common.PageResponse;
import com.leadrat.crm.tenant.dto.TenantDto;
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
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Tag(name = "Tenants", description = "Tenant management")
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @Operation(summary = "Create tenant", description = "Create new tenant")
    public ResponseEntity<ApiResponse<TenantDto>> createTenant(
            @Valid @RequestBody TenantDto request) {
        TenantDto tenant = tenantService.createTenant(request);
        return ResponseEntity.ok(ApiResponse.success("Tenant created", tenant));
    }

    @GetMapping
    @Operation(summary = "List tenants", description = "List all tenants")
    public ResponseEntity<ApiResponse<PageResponse<TenantDto>>> getAllTenants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var pageResponse = PageResponse.from(tenantService.getAllTenants(pageable));
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tenant by ID", description = "Get specific tenant")
    public ResponseEntity<ApiResponse<TenantDto>> getTenantById(@PathVariable UUID id) {
        TenantDto tenant = tenantService.getTenantById(id);
        return ResponseEntity.ok(ApiResponse.success(tenant));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get tenant by slug", description = "Get tenant by slug identifier")
    public ResponseEntity<ApiResponse<TenantDto>> getTenantBySlug(@PathVariable String slug) {
        TenantDto tenant = tenantService.getTenantBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(tenant));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update tenant", description = "Update tenant details")
    public ResponseEntity<ApiResponse<TenantDto>> updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody TenantDto request) {
        TenantDto tenant = tenantService.updateTenant(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tenant updated", tenant));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete tenant", description = "Delete tenant")
    public ResponseEntity<ApiResponse<Void>> deleteTenant(@PathVariable UUID id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.ok(ApiResponse.success("Tenant deleted", null));
    }
}
