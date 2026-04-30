package com.leadrat.crm.botconfig;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.common.TenantContext;
import com.leadrat.crm.botconfig.dto.BotConfigDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/settings/bot-config")
@RequiredArgsConstructor
@Tag(name = "Bot Configuration", description = "WhatsApp bot configuration")
public class BotConfigController {

    private final BotConfigService botConfigService;

    @GetMapping
    @Operation(summary = "Get bot config", description = "Get current bot configuration for tenant")
    public ResponseEntity<ApiResponse<BotConfigDto>> getBotConfig() {
        UUID tenantId = TenantContext.get();
        BotConfigDto config = botConfigService.getBotConfig(tenantId);
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @PutMapping
    @Operation(summary = "Update bot config", description = "Update bot configuration")
    public ResponseEntity<ApiResponse<BotConfigDto>> updateBotConfig(
            @Valid @RequestBody BotConfigDto request) {
        UUID tenantId = TenantContext.get();
        BotConfigDto config = botConfigService.updateBotConfig(tenantId, request);
        return ResponseEntity.ok(ApiResponse.success("Bot config updated", config));
    }

    @DeleteMapping
    @Operation(summary = "Delete bot config", description = "Delete bot configuration")
    public ResponseEntity<ApiResponse<Void>> deleteBotConfig() {
        UUID tenantId = TenantContext.get();
        botConfigService.deleteBotConfig(tenantId);
        return ResponseEntity.ok(ApiResponse.success("Bot config deleted", null));
    }
}
