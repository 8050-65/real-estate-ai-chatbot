package com.leadrat.crm.auth;

import com.leadrat.crm.auth.dto.LoginRequest;
import com.leadrat.crm.auth.dto.LoginResponse;
import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.common.TenantContext;
import com.leadrat.crm.tenant.Tenant;
import com.leadrat.crm.tenant.TenantRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, logout, token refresh")
public class AuthController {

    private final AuthService authService;
    private final TenantRepository tenantRepository;

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticate user and return JWT token")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            @RequestParam(defaultValue = "black") String tenant) {

        Tenant tenantEntity = tenantRepository.findBySlug(tenant)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        LoginResponse response = authService.login(request, tenantEntity.getId());
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Logout current user")
    public ResponseEntity<ApiResponse<Void>> logout() {
        authService.logout(UUID.fromString("0"));
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if auth service is running")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Auth service healthy", "OK"));
    }
}
