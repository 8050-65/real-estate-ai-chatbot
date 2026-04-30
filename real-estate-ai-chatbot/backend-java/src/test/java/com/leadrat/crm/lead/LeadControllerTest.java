package com.leadrat.crm.lead;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
class LeadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
    }

    @Test
    void shouldReturnUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/leads"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldReturnLeadsForAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/leads")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @WithMockUser(roles = "SALES_MANAGER")
    void shouldReturnLeadsForSalesManager() throws Exception {
        mockMvc.perform(get("/api/v1/leads")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "RM")
    void shouldReturnLeadsForRM() throws Exception {
        mockMvc.perform(get("/api/v1/leads")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldSupportPagination() throws Exception {
        mockMvc.perform(get("/api/v1/leads?page=0&size=10")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.page").exists())
            .andExpect(jsonPath("$.data.totalElements").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldFilterByStatus() throws Exception {
        mockMvc.perform(get("/api/v1/leads?status=new")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }
}
