package com.leadrat.crm.user;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.common.PageResponse;
import com.leadrat.crm.common.TenantContext;
import com.leadrat.crm.user.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get current authenticated user details")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser() {
        UUID tenantId = TenantContext.get();
        UUID userId = UUID.randomUUID(); // Will be set by JwtAuthFilter
        UserDto user = userService.getCurrentUser(userId, tenantId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping
    @Operation(summary = "List users", description = "List all active users in tenant")
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID tenantId = TenantContext.get();
        Pageable pageable = PageRequest.of(page, size);
        var pageResponse = PageResponse.from(userService.getUsers(tenantId, pageable));
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Get specific user by ID")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable UUID id) {
        UUID tenantId = TenantContext.get();
        UserDto user = userService.getUserById(id, tenantId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
