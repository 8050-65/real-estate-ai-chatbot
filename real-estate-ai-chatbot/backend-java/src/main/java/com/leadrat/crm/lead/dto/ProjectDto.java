package com.leadrat.crm.lead.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDto {
    private String id;
    private String name;
    private String description;
    private String city;
    private String state;
    private String address;
    private String developerName;
    private String projectType;
    private Integer totalUnits;
    private Integer soldUnits;
    private Integer availableUnits;
    private Double priceRangeMin;
    private Double priceRangeMax;
    private String currency;
    private LocalDateTime launchDate;
    private LocalDateTime completionDate;
    private Boolean isActive;
    private String googleMapsLink;
    private String websiteUrl;
    private String contactNumber;
}
