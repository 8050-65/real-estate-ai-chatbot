package com.leadrat.crm.botconfig;

import com.leadrat.crm.common.ResourceNotFoundException;
import com.leadrat.crm.botconfig.dto.BotConfigDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BotConfigService {

    private final BotConfigRepository botConfigRepository;

    public BotConfigDto getBotConfig(UUID tenantId) {
        BotConfig config = botConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Bot config not found"));
        return toDto(config);
    }

    public BotConfigDto updateBotConfig(UUID tenantId, BotConfigDto dto) {
        BotConfig config = botConfigRepository.findByTenantId(tenantId)
                .orElseGet(() -> createNewConfig(tenantId));

        if (dto.getPersonaName() != null) config.setPersonaName(dto.getPersonaName());
        if (dto.getGreetingMessage() != null) config.setGreetingMessage(dto.getGreetingMessage());
        if (dto.getTone() != null) config.setTone(dto.getTone());
        if (dto.getActiveHoursStart() != null) config.setActiveHoursStart(dto.getActiveHoursStart());
        if (dto.getActiveHoursEnd() != null) config.setActiveHoursEnd(dto.getActiveHoursEnd());
        if (dto.getAfterHoursMessage() != null) config.setAfterHoursMessage(dto.getAfterHoursMessage());
        if (dto.getLanguage() != null) config.setLanguage(dto.getLanguage());
        if (dto.getIsActive() != null) config.setIsActive(dto.getIsActive());

        BotConfig updated = botConfigRepository.save(config);
        return toDto(updated);
    }

    public void deleteBotConfig(UUID tenantId) {
        BotConfig config = botConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Bot config not found"));
        botConfigRepository.delete(config);
    }

    private BotConfig createNewConfig(UUID tenantId) {
        BotConfig config = new BotConfig();
        config.setId(UUID.randomUUID());
        config.setTenantId(tenantId);
        config.setPersonaName("Assistant");
        config.setGreetingMessage("Hello! How can I help you today?");
        config.setTone("friendly");
        config.setLanguage("en");
        config.setIsActive(true);
        return config;
    }

    private BotConfigDto toDto(BotConfig config) {
        return BotConfigDto.builder()
                .id(config.getId())
                .tenantId(config.getTenantId())
                .personaName(config.getPersonaName())
                .greetingMessage(config.getGreetingMessage())
                .tone(config.getTone())
                .activeHoursStart(config.getActiveHoursStart())
                .activeHoursEnd(config.getActiveHoursEnd())
                .afterHoursMessage(config.getAfterHoursMessage())
                .language(config.getLanguage())
                .isActive(config.getIsActive())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
