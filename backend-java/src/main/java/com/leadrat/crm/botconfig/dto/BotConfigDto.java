package com.leadrat.crm.botconfig.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BotConfigDto {
    private UUID id;
    private UUID tenantId;
    private String personaName;
    private String greetingMessage;
    private String tone;
    private LocalTime activeHoursStart;
    private LocalTime activeHoursEnd;
    private String afterHoursMessage;
    private String language;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
