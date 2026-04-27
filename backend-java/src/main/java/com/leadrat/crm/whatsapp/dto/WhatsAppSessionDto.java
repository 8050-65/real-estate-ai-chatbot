package com.leadrat.crm.whatsapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhatsAppSessionDto {
    private UUID id;
    private UUID tenantId;
    private String whatsappNumber;
    private String leadratLeadId;
    private Map<String, Object> sessionData;
    private Map<String, Object> visitBookingState;
    private String currentIntent;
    private Integer messageCount;
    private LocalDateTime lastActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
