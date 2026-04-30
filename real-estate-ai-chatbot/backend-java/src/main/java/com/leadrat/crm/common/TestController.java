package com.leadrat.crm.common;

import com.leadrat.crm.leadrat.LeadratClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestController {

    private final LeadratClient leadratClient;

    @GetMapping("/leadrat-token")
    public ApiResponse<String> testLeadratToken() {
        try {
            log.info("TEST: Attempting to fetch Leadrat token...");
            String token = leadratClient.getAccessToken();
            if (token != null) {
                log.info("TEST: Token fetched successfully!");
                return ApiResponse.success("Token fetched: " + token.substring(0, Math.min(50, token.length())) + "...");
            } else {
                log.error("TEST: Token fetch returned null");
                return ApiResponse.error("Token fetch returned null");
            }
        } catch (Exception e) {
            log.error("TEST: Exception during token fetch", e);
            return ApiResponse.error("Exception: " + e.getMessage());
        }
    }
}
