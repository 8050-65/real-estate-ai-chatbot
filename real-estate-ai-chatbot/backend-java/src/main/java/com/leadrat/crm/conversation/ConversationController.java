package com.leadrat.crm.conversation;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.common.PageResponse;
import com.leadrat.crm.common.TenantContext;
import com.leadrat.crm.conversation.dto.ConversationDto;
import com.leadrat.crm.conversation.dto.ConversationMessageDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
@Tag(name = "Conversations", description = "Chat history and conversation management")
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    @Operation(summary = "List conversations", description = "List all conversations for tenant")
    public ResponseEntity<ApiResponse<PageResponse<ConversationDto>>> getConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UUID tenantId = TenantContext.get();
        Pageable pageable = PageRequest.of(page, size);
        var pageResponse = PageResponse.from(conversationService.getConversationsByTenant(tenantId, pageable));
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @GetMapping("/{sessionId}")
    @Operation(summary = "Get conversation", description = "Get conversation details by session ID")
    public ResponseEntity<ApiResponse<ConversationDto>> getConversation(@PathVariable String sessionId) {
        UUID tenantId = TenantContext.get();
        ConversationDto conversation = conversationService.getConversationBySessionId(tenantId, sessionId);
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    @GetMapping("/{sessionId}/messages")
    @Operation(summary = "Get conversation history", description = "Get all messages in a conversation")
    public ResponseEntity<ApiResponse<List<ConversationMessageDto>>> getConversationHistory(
            @PathVariable String sessionId) {
        UUID tenantId = TenantContext.get();
        List<ConversationMessageDto> messages = conversationService.getConversationHistory(tenantId, sessionId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping
    @Operation(summary = "Start conversation", description = "Start new conversation")
    public ResponseEntity<ApiResponse<ConversationDto>> startConversation(
            @RequestBody ConversationDto request) {
        UUID tenantId = TenantContext.get();
        ConversationDto conversation = conversationService.startConversation(
                tenantId,
                request.getWhatsappNumber(),
                request.getLeadratLeadId()
        );
        return ResponseEntity.ok(ApiResponse.success("Conversation started", conversation));
    }

    @PostMapping("/{sessionId}/messages")
    @Operation(summary = "Add message", description = "Add message to conversation")
    public ResponseEntity<ApiResponse<Void>> addMessage(
            @PathVariable String sessionId,
            @RequestBody ConversationMessageDto message) {
        UUID tenantId = TenantContext.get();
        conversationService.addMessage(tenantId, sessionId, message);
        return ResponseEntity.ok(ApiResponse.success("Message added", null));
    }

    @PutMapping("/{sessionId}/end")
    @Operation(summary = "End conversation", description = "Mark conversation as ended")
    public ResponseEntity<ApiResponse<Void>> endConversation(@PathVariable String sessionId) {
        UUID tenantId = TenantContext.get();
        conversationService.endConversation(tenantId, sessionId);
        return ResponseEntity.ok(ApiResponse.success("Conversation ended", null));
    }
}
