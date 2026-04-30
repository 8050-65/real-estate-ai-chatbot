package com.leadrat.crm.lead;

import com.leadrat.crm.common.ApiResponse;
import com.leadrat.crm.lead.dto.PropertyDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
@Tag(name = "Properties", description = "Property search and management")
public class PropertyController {
    private final LeadService leadService;

    @GetMapping
    @Operation(summary = "Search properties", description = "Search properties from Leadrat")
    public ResponseEntity<ApiResponse<List<PropertyDto>>> searchProperties(
            @RequestParam(required = false) String search) {
        List<PropertyDto> properties = leadService.searchProperties(search);
        return ResponseEntity.ok(ApiResponse.success(properties));
    }
}
