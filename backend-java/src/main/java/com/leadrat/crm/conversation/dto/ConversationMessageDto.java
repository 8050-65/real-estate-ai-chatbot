package com.leadrat.crm.conversation.dto;

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
public class ConversationMessageDto {
    private UUID id;
    private String sessionId;
    private String role;
    private String message;
    private String intent;
    private Double confidence;
    private Boolean mediaShared;
    private Long processingMs;
    private String llmProvider;
    private LocalDateTime createdAt;
}
