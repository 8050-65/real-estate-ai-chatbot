package com.leadrat.crm.sitevisit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisit, UUID> {
    Page<SiteVisit> findByTenantId(UUID tenantId, Pageable pageable);
    Optional<SiteVisit> findByIdAndTenantId(UUID id, UUID tenantId);
    Page<SiteVisit> findByTenantIdAndStatus(UUID tenantId, String status, Pageable pageable);
}
