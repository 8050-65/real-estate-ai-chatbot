package com.leadrat.crm.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailAndTenantId(String email, UUID tenantId);
    List<User> findByTenantIdAndIsActiveTrue(UUID tenantId);
    Optional<User> findByIdAndTenantId(UUID id, UUID tenantId);
    Page<User> findByTenantIdAndIsActiveTrue(UUID tenantId, Pageable pageable);
}
