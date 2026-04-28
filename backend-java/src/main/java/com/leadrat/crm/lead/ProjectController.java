package com.leadrat.crm.lead;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.lead.dto.ProjectDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project search and management")
public class ProjectController {
    private final LeadService leadService;

    @GetMapping
    @Operation(summary = "Search projects", description = "Search projects from Leadrat")
    public ResponseEntity<ApiResponse<List<ProjectDto>>> searchProjects(
            @RequestParam(required = false) String search) {
        List<ProjectDto> projects = leadService.searchProjects(search);
        return ResponseEntity.ok(ApiResponse.success(projects));
    }
}
