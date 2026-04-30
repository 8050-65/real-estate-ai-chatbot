package com.leadrat.crm.activity;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private ActivityDto activityDto;

    @BeforeEach
    void setUp() {
        activityDto = new ActivityDto();
        activityDto.setLeadratLeadId("lead-123");
        activityDto.setCustomerName("John Doe");
        activityDto.setWhatsappNumber("+919876543210");
        activityDto.setScheduledAt(OffsetDateTime.now().plusDays(1));
        activityDto.setStatus("scheduled");
    }

    @Test
    void shouldReturnUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/activities"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldGetAllActivities() throws Exception {
        mockMvc.perform(get("/api/v1/activities")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldCreateActivity() throws Exception {
        String requestBody = objectMapper.writeValueAsString(activityDto);

        mockMvc.perform(post("/api/v1/activities")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldUpdateActivityStatus() throws Exception {
        String updatePayload = "{\"status\": \"completed\"}";
        UUID activityId = UUID.randomUUID();

        mockMvc.perform(put("/api/v1/activities/" + activityId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(updatePayload))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldFilterByStatus() throws Exception {
        mockMvc.perform(get("/api/v1/activities?status=scheduled")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldSupportPagination() throws Exception {
        mockMvc.perform(get("/api/v1/activities?page=0&size=20")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.page").exists())
            .andExpect(jsonPath("$.data.totalElements").exists());
    }
}
