package com.leadrat.crm.lead;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.lead.dto.LeadDto;
import com.leadrat.crm.lead.dto.PropertyDto;
import com.leadrat.crm.lead.dto.ProjectDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
@Tag(name = "Leads", description = "Lead management and Leadrat integration")
public class LeadController {

    private final LeadService leadService;

    @GetMapping("/{leadId}")
    @Operation(summary = "Get lead from Leadrat", description = "Fetch lead details from Leadrat API")
    public ResponseEntity<ApiResponse<LeadDto>> getLead(@PathVariable String leadId) {
        LeadDto lead = leadService.getLead(leadId);
        if (lead == null) {
            return ResponseEntity.ok(ApiResponse.error("Lead not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @GetMapping("/search/properties")
    @Operation(summary = "Search properties", description = "Search properties from Leadrat")
    public ResponseEntity<ApiResponse<List<PropertyDto>>> searchProperties(
            @RequestParam String query) {
        List<PropertyDto> properties = leadService.searchProperties(query);
        return ResponseEntity.ok(ApiResponse.success(properties));
    }

    @GetMapping("/projects/{projectId}")
    @Operation(summary = "Get project", description = "Get project details from Leadrat")
    public ResponseEntity<ApiResponse<ProjectDto>> getProject(@PathVariable String projectId) {
        ProjectDto project = leadService.getProject(projectId);
        if (project == null) {
            return ResponseEntity.ok(ApiResponse.error("Project not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(project));
    }
}
