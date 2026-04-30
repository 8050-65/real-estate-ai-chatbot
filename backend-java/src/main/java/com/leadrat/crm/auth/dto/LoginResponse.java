package com.leadrat.crm.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UUID userId;
    private String email;
    private String role;
    private UUID tenantId;
}
