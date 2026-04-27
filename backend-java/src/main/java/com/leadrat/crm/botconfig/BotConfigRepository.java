package com.leadrat.crm.botconfig;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BotConfigRepository extends JpaRepository<BotConfig, UUID> {
    Optional<BotConfig> findByTenantId(UUID tenantId);
    Optional<BotConfig> findByTenantIdAndIsActiveTrue(UUID tenantId);
}
