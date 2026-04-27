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
public class LeadDto {
    private String id;
    private String name;
    private String email;
    private String phoneNumber;
    private String whatsappNumber;
    private String city;
    private String state;
    private String stage;
    private String interestedPropertyType;
    private String interestedCity;
    private String budgetMin;
    private String budgetMax;
    private String source;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime lastContactedAt;
    private Integer interactionCount;
    private String notes;
}
