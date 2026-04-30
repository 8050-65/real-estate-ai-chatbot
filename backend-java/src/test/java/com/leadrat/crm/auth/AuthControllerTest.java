package com.leadrat.crm.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leadrat.crm.auth.dto.LoginRequest;
import com.leadrat.crm.auth.dto.LoginResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@crm-cbt.com");
        loginRequest.setPassword("Admin@123!");
    }

    @Test
    void shouldLoginSuccessfully() throws Exception {
        String requestBody = objectMapper.writeValueAsString(loginRequest);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.accessToken").exists())
            .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.data.email").value("admin@crm-cbt.com"))
            .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("accessToken");
    }

    @Test
    void shouldFailLoginWithInvalidEmail() throws Exception {
        loginRequest.setEmail("invalid@email.com");
        String requestBody = objectMapper.writeValueAsString(loginRequest);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldFailLoginWithInvalidPassword() throws Exception {
        loginRequest.setPassword("WrongPassword");
        String requestBody = objectMapper.writeValueAsString(loginRequest);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void shouldFailLoginWithEmptyFields() throws Exception {
        loginRequest.setEmail("");
        String requestBody = objectMapper.writeValueAsString(loginRequest);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isBadRequest());
    }
}
