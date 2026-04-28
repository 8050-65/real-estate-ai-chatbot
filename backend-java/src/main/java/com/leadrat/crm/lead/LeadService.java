package com.leadrat.crm.lead;

import com.fasterxml.jackson.databind.JsonNode;
import com.leadrat.crm.leadrat.LeadratClient;
import com.leadrat.crm.lead.dto.LeadDto;
import com.leadrat.crm.lead.dto.PropertyDto;
import com.leadrat.crm.lead.dto.ProjectDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeadService {

    private final LeadratClient leadratClient;

    public LeadDto createLead(LeadDto leadDto) {
        JsonNode response = leadratClient.createLead(leadDto);
        if (response == null) {
            throw new RuntimeException("Failed to create lead");
        }

        // Check if the response indicates success
        boolean succeeded = response.path("succeeded").asBoolean(false);
        if (!succeeded) {
            String errorMessage = response.path("message").asText("Unknown error");
            throw new RuntimeException("Failed to create lead: " + errorMessage);
        }

        // Extract the lead ID from the data field
        String leadId = response.path("data").asText();
        if (leadId == null || leadId.isEmpty()) {
            throw new RuntimeException("No lead ID returned from Leadrat");
        }

        // Return the created lead with ID
        return LeadDto.builder()
                .id(leadId)
                .name(leadDto.getName())
                .phone(leadDto.getPhone())
                .source(leadDto.getSource())
                .build();
    }

    public Page<LeadDto> searchLeads(String search, Pageable pageable) {
        JsonNode leadsData = leadratClient.searchLeads(search, pageable.getPageSize());
        if (leadsData == null) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        List<LeadDto> leads = new ArrayList<>();

        // Handle Leadrat response format: { "succeeded": true, "items": [...] }
        boolean succeeded = leadsData.path("succeeded").asBoolean(false);
        if (!succeeded) {
            log.warn("Search leads failed: {}", leadsData.path("message").asText());
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        // Try "items" field first (Leadrat search response), then "data" (other responses)
        JsonNode itemsNode = leadsData.path("items");
        JsonNode itemsToProcess = itemsNode.isArray() ? itemsNode : leadsData.path("data");

        if (itemsToProcess.isArray()) {
            itemsToProcess.forEach(lead -> {
                LeadDto dto = parseLeadDto(lead);
                if (dto != null) {
                    leads.add(dto);
                }
            });
        }
        return new PageImpl<>(leads, pageable, leads.size());
    }

    public List<Map<String, Object>> getLeadStatuses() {
        return leadratClient.getLeadStatuses();
    }

    public LeadDto getLeadById(String leadId) {
        JsonNode leadData = leadratClient.fetchLeadDetails(leadId);
        if (leadData == null || !leadData.path("succeeded").asBoolean(false)) {
            throw new RuntimeException("Lead not found: " + leadId);
        }
        JsonNode d = leadData.path("data");
        JsonNode st = d.path("status");
        return LeadDto.builder()
                .id(d.path("id").asText())
                .name(d.path("name").asText())
                .phone(d.path("contactNo").asText())
                .status(st.path("displayName").asText())
                .statusId(st.path("id").asText())
                .statusCode(st.path("status").asText())
                .assignTo(d.path("assignTo").asText())
                .secondaryUserId(d.path("secondaryUserId").asText())
                .build();
    }

    public LeadDto updateLeadStatus(String leadId, Map<String, Object> statusUpdate) {
        JsonNode response = leadratClient.updateLeadStatus(leadId, statusUpdate);
        if (response == null) {
            throw new RuntimeException("Failed to update lead status");
        }

        boolean succeeded = response.path("succeeded").asBoolean(false);
        if (!succeeded) {
            throw new RuntimeException("Leadrat API returned failure: " +
                response.path("message").asText("Unknown error"));
        }

        // CRITICAL: Verify status actually changed in Leadrat
        log.info("\n========== STATUS VERIFICATION ==========");
        String requestedStatusId = (String) statusUpdate.get("leadStatusId");
        log.info("Requested status ID: {}", requestedStatusId);

        if (requestedStatusId != null) {
            try {
                String expectedStatusId = mapStatusIdToChildStatus(requestedStatusId);
                log.info("Mapped to child status ID: {}", expectedStatusId);
                log.info("Fetching lead details from Leadrat for verification...");

                JsonNode leadData = leadratClient.fetchLeadDetails(leadId);
                log.info("Lead data received: {}", leadData != null ? "Yes" : "No");

                if (leadData != null) {
                    String actualStatusId = leadData.path("status").path("id").asText();
                    log.info("Actual status ID in Leadrat: {}", actualStatusId);

                    if (!expectedStatusId.equals(actualStatusId)) {
                        log.error("VERIFICATION FAILED!");
                        log.error("  Expected: {}", expectedStatusId);
                        log.error("  Actual: {}", actualStatusId);
                        throw new RuntimeException(
                            "Status verification failed! " +
                            "Expected: " + expectedStatusId +
                            ", Actual: " + actualStatusId
                        );
                    }
                    log.info("VERIFICATION PASSED! Status correctly updated in Leadrat");
                } else {
                    log.warn("Could not fetch lead for verification - proceeding anyway");
                }
                log.info("==========================================\n");
            } catch (Exception e) {
                log.error("Verification error: {}", e.getMessage(), e);
                log.info("==========================================\n");
                throw new RuntimeException("Status verification failed: " + e.getMessage());
            }
        }

        String returnedId = response.path("data").asText(leadId);
        return LeadDto.builder()
                .id(returnedId)
                .build();
    }

    private String mapStatusIdToChildStatus(String parentStatusId) {
        if (parentStatusId == null) return null;
        switch (parentStatusId) {
            case "54bd52ee-914f-4a78-b919-cd99be9dee88":
                return "f6f2683f-526f-42cd-a1b6-dd132e9e0f16";
            case "1c204d66-0f0e-4718-af99-563dad02a39b":
                return "d465463a-cfb8-413f-b1f3-46430c01f2bd";
            case "ba8fbec4-9322-438f-a745-5dfae2ee078d":
                return parentStatusId;
            default:
                return parentStatusId;
        }
    }

    public List<PropertyDto> searchProperties(String query) {
        JsonNode propertiesData = leadratClient.searchProperties(query, 10);
        if (propertiesData == null) {
            return new ArrayList<>();
        }

        List<PropertyDto> properties = new ArrayList<>();
        JsonNode dataNode = propertiesData.path("data");
        JsonNode itemsToProcess = dataNode.isArray() ? dataNode : propertiesData;

        if (itemsToProcess.isArray()) {
            itemsToProcess.forEach(property -> {
                PropertyDto dto = parsePropertyDto(property);
                if (dto != null) {
                    properties.add(dto);
                }
            });
        }
        return properties;
    }

    public List<ProjectDto> searchProjects(String query) {
        JsonNode projectsData = leadratClient.searchProjects(query, 10);
        if (projectsData == null) {
            return new ArrayList<>();
        }

        List<ProjectDto> projects = new ArrayList<>();
        JsonNode dataNode = projectsData.path("data");
        JsonNode itemsToProcess = dataNode.isArray() ? dataNode : projectsData;

        if (itemsToProcess.isArray()) {
            itemsToProcess.forEach(project -> {
                ProjectDto dto = parseProjectDto(project);
                if (dto != null) {
                    projects.add(dto);
                }
            });
        }
        return projects;
    }

    private LeadDto parseLeadDto(JsonNode node) {
        return LeadDto.builder()
                .id(node.path("id").asText())
                .name(node.path("name").asText())
                .email(node.path("email").asText())
                .phone(node.path("contactNo").asText())
                .whatsappNumber(node.path("whatsapp_number").asText())
                .city(node.path("city").asText())
                .state(node.path("state").asText())
                .stage(node.path("stage").asText())
                .interestedPropertyType(node.path("interestedPropertyType").asText())
                .interestedCity(node.path("interestedCity").asText())
                .budgetMin(node.path("budgetMin").asText())
                .budgetMax(node.path("budgetMax").asText())
                .source(node.path("source").asText())
                .status(node.path("status").asText())
                .notes(node.path("notes").asText())
                .build();
    }

    private PropertyDto parsePropertyDto(JsonNode node) {
        return PropertyDto.builder()
                .id(node.path("id").asText())
                .name(node.path("name").asText())
                .address(node.path("address").asText())
                .city(node.path("city").asText())
                .state(node.path("state").asText())
                .zipCode(node.path("zip_code").asText())
                .latitude(node.path("latitude").asDouble())
                .longitude(node.path("longitude").asDouble())
                .googleMapsLink(node.path("google_maps_link").asText())
                .description(node.path("description").asText())
                .price(node.path("price").asDouble())
                .currency(node.path("currency").asText("INR"))
                .bedrooms(node.path("bedrooms").asInt())
                .bathrooms(node.path("bathrooms").asInt())
                .areaSquareFeet(node.path("areaSquareFeet").asDouble())
                .propertyType(node.path("propertyType").asText())
                .status(node.path("status").asText())
                .build();
    }

    private ProjectDto parseProjectDto(JsonNode node) {
        return ProjectDto.builder()
                .id(node.path("id").asText())
                .name(node.path("name").asText())
                .description(node.path("description").asText())
                .city(node.path("city").asText())
                .state(node.path("state").asText())
                .address(node.path("address").asText())
                .developerName(node.path("developerName").asText())
                .projectType(node.path("projectType").asText())
                .totalUnits(node.path("totalUnits").asInt())
                .soldUnits(node.path("soldUnits").asInt())
                .availableUnits(node.path("availableUnits").asInt())
                .priceRangeMin(node.path("priceRangeMin").asDouble())
                .priceRangeMax(node.path("priceRangeMax").asDouble())
                .currency(node.path("currency").asText("INR"))
                .googleMapsLink(node.path("googleMapsLink").asText())
                .websiteUrl(node.path("websiteUrl").asText())
                .contactNumber(node.path("contactNumber").asText())
                .build();
    }
}
