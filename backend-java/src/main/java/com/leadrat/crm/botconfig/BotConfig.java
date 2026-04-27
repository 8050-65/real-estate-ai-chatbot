package com.leadrat.crm.botconfig;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "bot_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BotConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID tenantId;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String personaName = "Aria";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String greetingMessage;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String tone = "friendly";

    @Column(nullable = false)
    private LocalTime activeHoursStart;

    @Column(nullable = false)
    private LocalTime activeHoursEnd;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String afterHoursMessage;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String language = "en";

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
