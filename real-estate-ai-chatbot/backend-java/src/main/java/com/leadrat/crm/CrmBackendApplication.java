package com.leadrat.crm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 * Spring Boot application entry point for Real Estate CRM Backend.
 *
 * Features:
 * - PostgreSQL database with Flyway migrations
 * - Redis caching
 * - JWT authentication (via Spring Security)
 * - REST API endpoints
 * - Actuator health checks
 * - Structured logging
 */
@SpringBootApplication
@ComponentScan(basePackages = "com.leadrat.crm")
public class CrmBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CrmBackendApplication.class, args);
    }
}
