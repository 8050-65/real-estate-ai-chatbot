package com.leadrat.crm.conversation;

import com.leadrat.crm.common.ResourceNotFoundException;
import com.leadrat.crm.conversation.dto.ConversationDto;
import com.leadrat.crm.conversation.dto.ConversationMessageDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    public List<ConversationMessageDto> getConversationHistory(UUID tenantId, String sessionId) {
        return new ArrayList<>();
    }

    public ConversationDto startConversation(UUID tenantId, String whatsappNumber, String leadratLeadId) {
        return ConversationDto.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .sessionId(UUID.randomUUID().toString())
                .whatsappNumber(whatsappNumber)
                .leadratLeadId(leadratLeadId)
                .status("active")
                .messageCount(0)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public void addMessage(UUID tenantId, String sessionId, ConversationMessageDto message) {
    }

    public void endConversation(UUID tenantId, String sessionId) {
    }

    public Page<ConversationDto> getConversationsByTenant(UUID tenantId, Pageable pageable) {
        return new PageImpl<>(new ArrayList<>(), pageable, 0);
    }

    public ConversationDto getConversationBySessionId(UUID tenantId, String sessionId) {
        return ConversationDto.builder()
                .sessionId(sessionId)
                .tenantId(tenantId)
                .status("closed")
                .build();
    }
}
