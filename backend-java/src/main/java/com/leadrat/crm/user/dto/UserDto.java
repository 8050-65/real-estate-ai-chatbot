package com.leadrat.crm.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private UUID id;
    private UUID tenantId;
    private String email;
    private String fullName;
    private String role;
    private String whatsappNumber;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
