package com.leadrat.crm.lead;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.lead.dto.LeadDto;
import com.leadrat.crm.lead.dto.PropertyDto;
import com.leadrat.crm.lead.dto.ProjectDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Leads", description = "Lead management and Leadrat integration")
public class LeadController {

    private final LeadService leadService;
    private final ObjectMapper objectMapper;

    @PostMapping
    @Operation(summary = "Create lead", description = "Create a new lead in Leadrat")
    public ResponseEntity<ApiResponse<LeadDto>> createLead(@RequestBody LeadDto leadDto) {
        try {
            LeadDto created = leadService.createLead(leadDto);
            return ResponseEntity.ok(ApiResponse.success(created));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(
                ApiResponse.error("Failed to create lead: " + e.getMessage())
            );
        }
    }

    @GetMapping
    @Operation(summary = "Search leads", description = "Search leads by name or phone number")
    public ResponseEntity<ApiResponse<Page<LeadDto>>> searchLeads(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<LeadDto> results = leadService.searchLeads(search, pageable);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/statuses")
    @Operation(summary = "Get lead statuses", description = "Fetch available lead statuses from Leadrat")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStatuses() {
        List<Map<String, Object>> statuses = leadService.getLeadStatuses();
        return ResponseEntity.ok(ApiResponse.success(statuses));
    }

    @GetMapping("/{leadId}")
    @Operation(summary = "Get lead by ID", description = "Fetch single lead from Leadrat with status details")
    public ResponseEntity<ApiResponse<LeadDto>> getLeadById(@PathVariable String leadId) {
        try {
            LeadDto lead = leadService.getLeadById(leadId);
            return ResponseEntity.ok(ApiResponse.success(lead));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{leadId}/status")
    @Operation(summary = "Update lead status", description = "Update lead status in Leadrat")
    public ResponseEntity<ApiResponse<LeadDto>> updateLeadStatus(
            @PathVariable String leadId,
            @RequestBody Map<String, Object> statusUpdate) {
        try {
            log.info("\n\n========== UI STATUS UPDATE REQUEST ==========");
            log.info("Lead ID: {}", leadId);
            log.info("Full UI Request Payload: {}", objectMapper.writeValueAsString(statusUpdate));
            log.info("leadStatusId: {}", statusUpdate.get("leadStatusId"));
            log.info("scheduledDate: {}", statusUpdate.get("scheduledDate"));
            log.info("meetingOrSiteVisit: {}", statusUpdate.get("meetingOrSiteVisit"));
            log.info("assignTo: {}", statusUpdate.get("assignTo"));
            log.info("Notes: {}", statusUpdate.get("notes"));
            log.info("=============================================\n");

            LeadDto updated = leadService.updateLeadStatus(leadId, statusUpdate);
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            log.error("Error updating lead status", e);

            // Status verification failure should return 200 with success=false (not 500)
            // This allows frontend to handle it gracefully
            if (errorMsg != null && errorMsg.contains("Status verification failed")) {
                return ResponseEntity.ok(ApiResponse.error(errorMsg));
            }

            // Other errors return 500
            return ResponseEntity.status(500).body(
                ApiResponse.error("Failed to update lead status: " + errorMsg)
            );
        }
    }
}
