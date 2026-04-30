package com.leadrat.crm.leadrat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leadrat.crm.lead.dto.LeadDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class LeadratClient {

    private final WebClient webClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${leadrat.base-url:https://connect.leadrat.com/api/v1}")
    private String baseUrlConfig;

    @Value("${leadrat.auth-url:https://connect.leadrat.com/api/v1/authentication/token}")
    private String authUrl;

    @Value("${leadrat.api-key}")
    private String apiKey;

    @Value("${leadrat.secret-key}")
    private String secretKey;

    @Value("${leadrat.tenant:dubait11}")
    private String tenant;

    @Value("${leadrat.request-timeout:30}")
    private int requestTimeout;

    // Tenant-aware base URL routing
    private String getBaseUrl() {
        // Production tenants use .com, QA tenants use .info
        if (tenant != null && (tenant.equals("dubait11") || tenant.contains("production"))) {
            return "https://connect.leadrat.com/api/v1";
        }
        return baseUrlConfig; // fallback to configured URL
    }

    // Use tenant-specific cache key to support multi-tenancy
    private String getTokenCacheKey() {
        return "leadrat:" + (tenant != null ? tenant : "default") + ":token";
    }

    public String getAccessToken() {
        try {
            log.debug("Fetching fresh token from Leadrat auth API");
            String token = fetchAndCacheToken();
            if (token != null) {
                log.info("Leadrat token fetched successfully for tenant {}", tenant);
                return token;
            }
            log.error("Token fetch returned null");
            return null;
        } catch (Exception e) {
            log.error("Error fetching fresh token", e);
            String cachedToken = (String) redisTemplate.opsForValue().get(getTokenCacheKey());
            if (cachedToken != null) {
                log.warn("Using cached token as fallback");
                return cachedToken;
            }
            log.error("No cached token available and failed to fetch fresh token");
            return null;
        }
    }

    private String fetchAndCacheToken() {
        try {
            log.debug("Auth URL: {}", authUrl);
            log.debug("Tenant: {}", tenant);

            // CRITICAL: Leadrat API requires direct format - apiKey and secretKey (camelCase)
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("apiKey", apiKey);
            requestBody.put("secretKey", secretKey);

            String jsonPayload = objectMapper.writeValueAsString(requestBody);
            log.debug("Request Payload: {}", jsonPayload);

            String response = webClient.post()
                    .uri(authUrl)
                    .header("tenant", tenant)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .doOnNext(resp -> log.debug("Auth API Raw Response: {}", resp))
                    .block();

            if (response != null) {
                JsonNode jsonNode = objectMapper.readTree(response);

                // Check if succeeded
                boolean succeeded = jsonNode.path("succeeded").asBoolean(false);
                log.debug("Response succeeded: {}", succeeded);

                if (!succeeded) {
                    String message = jsonNode.path("message").asText("Unknown error");
                    log.error("Token fetch failed: {}", message);
                    log.error("Full response: {}", response);
                    return null;
                }

                // Extract token from data.accessToken
                String token = jsonNode.path("data").path("accessToken").asText();
                if (token == null || token.isEmpty()) {
                    token = jsonNode.path("data").path("token").asText();
                }
                if (token == null || token.isEmpty()) {
                    token = jsonNode.path("token").asText();
                }

                if (token == null || token.isEmpty()) {
                    log.error("No token found in auth response. Full response: {}", response);
                    return null;
                }

                log.info("Leadrat token fetched successfully for tenant {}", tenant);

                try {
                    redisTemplate.opsForValue().set(getTokenCacheKey(), token, 55, TimeUnit.MINUTES);
                    log.debug("Token cached in Redis for 55 minutes with key: {}", getTokenCacheKey());
                } catch (Exception e) {
                    log.warn("Could not cache token in Redis: {}", e.getMessage());
                }
                return token;
            } else {
                log.error("Auth API returned null response");
            }
        } catch (Exception e) {
            log.error("Failed to fetch Leadrat access token", e);
        }
        return null;
    }

    public JsonNode searchLeads(String query, int pageSize) {
        try {
            String token = getAccessToken();
            if (token == null) {
                log.error("Cannot search leads: no access token");
                return null;
            }

            String uri = getBaseUrl() + "/lead?PageNumber=1&PageSize=" + pageSize;
            if (query != null && !query.isEmpty()) {
                uri += "&SearchByNameOrNumber=" + query;
            }
            log.info("[Leadrat] Searching leads: tenant={}, url={}, query={}", tenant, uri, query);

            String response = webClient.get()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                return objectMapper.readTree(response);
            }
        } catch (Exception e) {
            log.error("Failed to search leads in Leadrat API", e);
        }
        return null;
    }

    public JsonNode createLead(LeadDto leadDto) {
        try {
            String token = getAccessToken();
            if (token == null) {
                log.error("Failed to get access token for lead creation");
                return null;
            }

            log.info("Creating lead with name: {}, phone: {}", leadDto.getName(), leadDto.getPhone());

            Map<String, Object> payload = new HashMap<>();
            payload.put("name", leadDto.getName());
            payload.put("contactNo", leadDto.getPhone());
            // Only include alternateContactNo if whatsappNumber is provided
            if (leadDto.getWhatsappNumber() != null && !leadDto.getWhatsappNumber().isEmpty()) {
                payload.put("alternateContactNo", leadDto.getWhatsappNumber());
            }
            // Assign lead to default user to allow status updates
            payload.put("assignTo", "45abfce5-2746-42e6-bf66-ac7e00e75085");

            log.debug("Lead creation payload: {}", objectMapper.writeValueAsString(payload));

            String response = webClient.post()
                    .uri(getBaseUrl() + "/lead")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                log.info("Leadrat create lead response: {}", response);
                return objectMapper.readTree(response);
            } else {
                log.error("Leadrat API returned null response for lead creation");
            }
        } catch (Exception e) {
            log.error("Failed to create lead in Leadrat API", e);
        }
        return null;
    }

    public List<Map<String, Object>> getLeadStatuses() {
        try {
            String token = getAccessToken();
            if (token == null) {
                return new ArrayList<>();
            }

            String response = webClient.get()
                    .uri(getBaseUrl() + "/lead/status?PageNumber=1&PageSize=50")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                JsonNode jsonNode = objectMapper.readTree(response);
                List<Map<String, Object>> statuses = new ArrayList<>();

                boolean succeeded = jsonNode.path("succeeded").asBoolean(false);
                if (!succeeded) {
                    log.warn("Failed to fetch statuses: {}", jsonNode.path("message").asText());
                    return new ArrayList<>();
                }

                // Leadrat returns statuses in "items" field
                JsonNode itemsNode = jsonNode.path("items");
                if (itemsNode.isArray()) {
                    itemsNode.forEach(status -> {
                        Map<String, Object> statusMap = new HashMap<>();
                        statusMap.put("id", status.path("id").asText());
                        statusMap.put("name", status.path("displayName").asText());
                        statusMap.put("status", status.path("status").asText());
                        statusMap.put("baseId", status.path("baseId").asText());
                        statuses.add(statusMap);
                    });
                }
                return statuses;
            }
        } catch (Exception e) {
            log.error("Failed to fetch lead statuses from Leadrat API", e);
        }
        return new ArrayList<>();
    }

    public JsonNode updateLeadStatus(String leadId, Map<String, Object> statusUpdate) {
        try {
            String token = getAccessToken();
            if (token == null) {
                log.error("Cannot update lead status: no access token");
                return null;
            }

            // Map parent status IDs to child status IDs
            // Leadrat requires child status IDs for statuses with children
            String leadStatusId = (String) statusUpdate.get("leadStatusId");
            leadStatusId = mapStatusIdToChildStatus(leadStatusId);

            // Build complete payload as per Leadrat API contract
            // Start with defaults, then merge in provided values
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", leadId);
            payload.put("leadStatusId", leadStatusId);
            payload.put("rating", statusUpdate.getOrDefault("rating", null));
            payload.put("notes", statusUpdate.getOrDefault("notes", null));
            payload.put("IsNotesUpdated", statusUpdate.getOrDefault("IsNotesUpdated", false));
            payload.put("bookedUnderName", statusUpdate.getOrDefault("bookedUnderName", null));
            payload.put("agreementValue", statusUpdate.getOrDefault("agreementValue", null));
            payload.put("purchasedFrom", statusUpdate.getOrDefault("purchasedFrom", null));
            payload.put("propertiesList", statusUpdate.getOrDefault("propertiesList", new ArrayList<>()));
            payload.put("projectsList", statusUpdate.getOrDefault("projectsList", new ArrayList<>()));
            payload.put("projectIds", statusUpdate.getOrDefault("projectIds", null));
            payload.put("unitTypeId", statusUpdate.getOrDefault("unitTypeId", null));
            payload.put("propertyIds", statusUpdate.getOrDefault("propertyIds", null));
            payload.put("currency", statusUpdate.getOrDefault("currency", "INR"));
            payload.put("buyer", statusUpdate.getOrDefault("buyer", null));
            payload.put("paymentPlans", statusUpdate.getOrDefault("paymentPlans", null));
            payload.put("lowerBudget", statusUpdate.getOrDefault("lowerBudget", null));
            payload.put("upperBudget", statusUpdate.getOrDefault("upperBudget", null));
            payload.put("purpose", statusUpdate.getOrDefault("purpose", null));
            payload.put("addresses", statusUpdate.getOrDefault("addresses", new ArrayList<>()));
            payload.put("assignTo", statusUpdate.getOrDefault("assignTo", "45abfce5-2746-42e6-bf66-ac7e00e75085"));
            payload.put("secondaryUserId", statusUpdate.getOrDefault("secondaryUserId", "00000000-0000-0000-0000-000000000000"));

            // Include appointment scheduling fields if provided by chatbot
            if (statusUpdate.containsKey("scheduledDate")) {
                payload.put("scheduledDate", statusUpdate.get("scheduledDate"));
                log.debug("Scheduled date set to: {}", statusUpdate.get("scheduledDate"));
            }
            if (statusUpdate.containsKey("meetingOrSiteVisit")) {
                payload.put("meetingOrSiteVisit", statusUpdate.get("meetingOrSiteVisit"));
                log.debug("Meeting or site visit flag: {}", statusUpdate.get("meetingOrSiteVisit"));
            }

            log.info("Updating lead status for leadId: {}, statusId: {}", leadId, statusUpdate.get("leadStatusId"));
            log.debug("Lead status update payload: {}", objectMapper.writeValueAsString(payload));

            String response = webClient.put()
                    .uri(getBaseUrl() + "/lead/status/" + leadId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                JsonNode jsonNode = objectMapper.readTree(response);
                boolean succeeded = jsonNode.path("succeeded").asBoolean(false);
                log.debug("Leadrat response succeeded: {}", succeeded);

                if (!succeeded) {
                    String errorMsg = jsonNode.path("message").asText("Unknown error");
                    log.error("Failed to update status: {}", errorMsg);
                    return null;
                }
                log.info("Lead status updated successfully for leadId: {}", leadId);
                return jsonNode;
            } else {
                log.error("Leadrat API returned null response");
            }
        } catch (Exception e) {
            log.error("Failed to update lead status in Leadrat API", e);
        }
        return null;
    }

    public JsonNode searchProperties(String query, int pageSize) {
        try {
            String token = getAccessToken();
            if (token == null) {
                return null;
            }

            String uri = getBaseUrl() + "/property?PageNumber=1&PageSize=" + pageSize;
            if (query != null && !query.isEmpty()) {
                uri += "&Search=" + query;
            }
            log.info("[Leadrat] Searching properties: tenant={}, url={}", tenant, uri);

            String response = webClient.get()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                return objectMapper.readTree(response);
            }
        } catch (Exception e) {
            log.error("Failed to search properties in Leadrat API", e);
        }
        return null;
    }

    public JsonNode searchProjects(String query, int pageSize) {
        try {
            String token = getAccessToken();
            if (token == null) {
                return null;
            }

            String uri = getBaseUrl() + "/project/all?PageNumber=1&PageSize=" + pageSize;
            if (query != null && !query.isEmpty()) {
                uri += "&Search=" + query;
            }
            log.info("[Leadrat] Searching projects: tenant={}, url={}", tenant, uri);

            String response = webClient.get()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                return objectMapper.readTree(response);
            }
        } catch (Exception e) {
            log.error("Failed to search projects in Leadrat API", e);
        }
        return null;
    }

    public JsonNode fetchLeadDetails(String leadId) {
        try {
            String token = getAccessToken();
            if (token == null) {
                log.error("Cannot fetch lead: no access token");
                return null;
            }

            log.debug("Fetching lead details from Leadrat for verification: {}", leadId);

            String response = webClient.get()
                    .uri(getBaseUrl() + "/lead/" + leadId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                log.debug("Lead details response: {}", response);
                JsonNode jsonNode = objectMapper.readTree(response);

                JsonNode statusNode = jsonNode.path("data").path("status");
                if (!statusNode.isMissingNode()) {
                    String statusId = statusNode.path("id").asText();
                    String statusName = statusNode.path("displayName").asText();
                    log.debug("Current status: {} ({})", statusId, statusName);
                    JsonNode childType = statusNode.path("childType");
                    if (!childType.isMissingNode()) {
                        log.debug("  Child status available: {} ({})",
                            childType.path("id").asText(),
                            childType.path("displayName").asText());
                    }
                }

                return jsonNode;
            }
        } catch (Exception e) {
            log.error("Failed to fetch lead details", e);
        }
        return null;
    }

    public void clearTokenCache() {
        redisTemplate.delete(getTokenCacheKey());
        log.info("Cleared token cache for tenant: {}", tenant);
    }

    private String mapStatusIdToChildStatus(String parentStatusId) {
        if (parentStatusId == null) {
            return null;
        }

        // Map parent status IDs to their child status IDs
        // Leadrat requires child status IDs for status updates
        switch (parentStatusId) {
            // Callback -> To Schedule A Meeting (child)
            case "54bd52ee-914f-4a78-b919-cd99be9dee88":
                log.debug("Mapping Callback parent to child: To Schedule A Meeting");
                return "f6f2683f-526f-42cd-a1b6-dd132e9e0f16";

            // Meeting Scheduled -> In Person (child)
            // Could also use: Online, On Call, Others
            case "1c204d66-0f0e-4718-af99-563dad02a39b":
                log.debug("Mapping Meeting Scheduled parent to child: In Person");
                return "d465463a-cfb8-413f-b1f3-46430c01f2bd";

            // Site Visit Scheduled - keep as is (no child status)
            case "ba8fbec4-9322-438f-a745-5dfae2ee078d":
                log.debug("Site Visit Scheduled has no child status, using parent");
                return parentStatusId;

            default:
                // For any other status, return as-is
                return parentStatusId;
        }
    }
}
