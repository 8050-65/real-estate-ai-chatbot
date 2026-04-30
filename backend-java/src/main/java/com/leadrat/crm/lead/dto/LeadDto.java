package com.leadrat.crm.lead.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
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
    @JsonAlias("contactNo")
    private String phone;
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
    private String statusId;
    private String statusCode;
    private String assignTo;
    private String secondaryUserId;
    private LocalDateTime createdAt;
    private LocalDateTime lastContactedAt;
    private Integer interactionCount;
    private String notes;
}
