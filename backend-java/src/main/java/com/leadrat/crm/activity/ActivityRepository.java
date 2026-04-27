package com.leadrat.crm.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<CrmActivity, UUID> {
    Page<CrmActivity> findByTenantId(UUID tenantId, Pageable pageable);
    Optional<CrmActivity> findByIdAndTenantId(UUID id, UUID tenantId);
    Page<CrmActivity> findByTenantIdAndLeadratLeadId(UUID tenantId, String leadratLeadId, Pageable pageable);
    List<CrmActivity> findByTenantIdAndLeadratLeadId(UUID tenantId, String leadratLeadId);
    List<CrmActivity> findByTenantIdAndStatus(UUID tenantId, String status);
    Page<CrmActivity> findByTenantIdAndStatus(UUID tenantId, String status, Pageable pageable);
    List<CrmActivity> findByLeadratSyncedFalse();
}
