package com.leadrat.crm.lead;

import com.fasterxml.jackson.databind.JsonNode;
import com.leadrat.crm.leadrat.LeadratClient;
import com.leadrat.crm.lead.dto.LeadDto;
import com.leadrat.crm.lead.dto.PropertyDto;
import com.leadrat.crm.lead.dto.ProjectDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeadService {

    private final LeadratClient leadratClient;

    public LeadDto getLead(String leadId) {
        JsonNode leadData = leadratClient.getLead(leadId);
        if (leadData == null) {
            return null;
        }
        return parseLeadDto(leadData);
    }

    public List<PropertyDto> searchProperties(String query) {
        JsonNode propertiesData = leadratClient.searchProperties(query, 10);
        if (propertiesData == null) {
            return new ArrayList<>();
        }

        List<PropertyDto> properties = new ArrayList<>();
        if (propertiesData.isArray()) {
            propertiesData.forEach(property -> {
                PropertyDto dto = parsePropertyDto(property);
                if (dto != null) {
                    properties.add(dto);
                }
            });
        }
        return properties;
    }

    public ProjectDto getProject(String projectId) {
        JsonNode projectData = leadratClient.getProject(projectId);
        if (projectData == null) {
            return null;
        }
        return parseProjectDto(projectData);
    }

    private LeadDto parseLeadDto(JsonNode node) {
        return LeadDto.builder()
                .id(node.path("id").asText())
                .name(node.path("name").asText())
                .email(node.path("email").asText())
                .phoneNumber(node.path("phone").asText())
                .whatsappNumber(node.path("whatsapp_number").asText())
                .city(node.path("city").asText())
                .state(node.path("state").asText())
                .stage(node.path("stage").asText())
                .interestedPropertyType(node.path("interested_property_type").asText())
                .interestedCity(node.path("interested_city").asText())
                .budgetMin(node.path("budget_min").asText())
                .budgetMax(node.path("budget_max").asText())
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
                .areaSquareFeet(node.path("area_sqft").asDouble())
                .propertyType(node.path("property_type").asText())
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
                .developerName(node.path("developer_name").asText())
                .projectType(node.path("project_type").asText())
                .totalUnits(node.path("total_units").asInt())
                .soldUnits(node.path("sold_units").asInt())
                .availableUnits(node.path("available_units").asInt())
                .priceRangeMin(node.path("price_min").asDouble())
                .priceRangeMax(node.path("price_max").asDouble())
                .currency(node.path("currency").asText("INR"))
                .googleMapsLink(node.path("google_maps_link").asText())
                .websiteUrl(node.path("website_url").asText())
                .contactNumber(node.path("contact_number").asText())
                .build();
    }
}
