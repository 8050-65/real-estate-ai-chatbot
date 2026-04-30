package com.leadrat.crm.lead.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyDto {
    private String id;
    private String name;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private Double latitude;
    private Double longitude;
    private String googleMapsLink;
    private String description;
    private List<String> amenities;
    private Double price;
    private String currency;
    private Integer bedrooms;
    private Integer bathrooms;
    private Double areaSquareFeet;
    private String propertyType;
    private String status;
}
