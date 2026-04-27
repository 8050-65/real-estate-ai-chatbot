package com.leadrat.crm.leadrat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class LeadratClient {

    private final WebClient webClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${leadrat.base-url}")
    private String baseUrl;

    @Value("${leadrat.auth-url}")
    private String authUrl;

    @Value("${leadrat.api-key}")
    private String apiKey;

    @Value("${leadrat.secret-key}")
    private String secretKey;

    @Value("${leadrat.request-timeout:30}")
    private int requestTimeout;

    private static final String TOKEN_CACHE_KEY = "leadrat:token";
    private static final String CACHE_TTL = "5"; // 5 minutes in minutes

    public String getAccessToken() {
        String cachedToken = (String) redisTemplate.opsForValue().get(TOKEN_CACHE_KEY);
        if (cachedToken != null) {
            return cachedToken;
        }

        return fetchAndCacheToken();
    }

    private String fetchAndCacheToken() {
        try {
            String response = webClient.post()
                    .uri(authUrl)
                    .header("X-API-Key", apiKey)
                    .header("X-Secret-Key", secretKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                JsonNode jsonNode = objectMapper.readTree(response);
                String token = jsonNode.path("access_token").asText();
                if (!token.isEmpty()) {
                    redisTemplate.opsForValue().set(TOKEN_CACHE_KEY, token, 5, TimeUnit.MINUTES);
                    return token;
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch Leadrat access token", e);
        }

        return null;
    }

    public JsonNode getLead(String leadId) {
        String cacheKey = "leadrat:lead:" + leadId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof String) {
            try {
                return objectMapper.readTree((String) cached);
            } catch (Exception e) {
                log.warn("Failed to parse cached lead", e);
            }
        }

        try {
            String token = getAccessToken();
            if (token == null) {
                return null;
            }

            String response = webClient.get()
                    .uri(baseUrl + "/leads/" + leadId)
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                JsonNode jsonNode = objectMapper.readTree(response);
                redisTemplate.opsForValue().set(cacheKey, response, 5, TimeUnit.MINUTES);
                return jsonNode;
            }
        } catch (Exception e) {
            log.error("Failed to fetch lead from Leadrat API", e);
        }

        return null;
    }

    public JsonNode getProject(String projectId) {
        String cacheKey = "leadrat:project:" + projectId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof String) {
            try {
                return objectMapper.readTree((String) cached);
            } catch (Exception e) {
                log.warn("Failed to parse cached project", e);
            }
        }

        try {
            String token = getAccessToken();
            if (token == null) {
                return null;
            }

            String response = webClient.get()
                    .uri(baseUrl + "/projects/" + projectId)
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            if (response != null) {
                JsonNode jsonNode = objectMapper.readTree(response);
                redisTemplate.opsForValue().set(cacheKey, response, 5, TimeUnit.MINUTES);
                return jsonNode;
            }
        } catch (Exception e) {
            log.error("Failed to fetch project from Leadrat API", e);
        }

        return null;
    }

    public JsonNode searchProperties(String query, int limit) {
        try {
            String token = getAccessToken();
            if (token == null) {
                return null;
            }

            String response = webClient.get()
                    .uri(baseUrl + "/properties/search?q=" + query + "&limit=" + limit)
                    .header("Authorization", "Bearer " + token)
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

    public void syncActivity(String activityId, String status) {
        try {
            String token = getAccessToken();
            if (token == null) {
                return;
            }

            webClient.put()
                    .uri(baseUrl + "/activities/" + activityId)
                    .header("Authorization", "Bearer " + token)
                    .bodyValue("{\"status\": \"" + status + "\"}")
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(Duration.ofSeconds(requestTimeout))
                    .block();

            log.info("Synced activity {} with status {}", activityId, status);
        } catch (Exception e) {
            log.error("Failed to sync activity to Leadrat API", e);
        }
    }

    public void clearTokenCache() {
        redisTemplate.delete(TOKEN_CACHE_KEY);
    }
}
