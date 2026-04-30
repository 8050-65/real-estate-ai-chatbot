package com.leadrat.crm.tenant;

import com.leadrat.crm.common.ResourceNotFoundException;
import com.leadrat.crm.tenant.dto.TenantDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantDto createTenant(TenantDto dto) {
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName(dto.getName());
        tenant.setSlug(dto.getSlug());
        tenant.setPlan(dto.getPlan());
        tenant.setIsActive(true);

        Tenant saved = tenantRepository.save(tenant);
        return toDto(saved);
    }

    public TenantDto getTenantById(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        return toDto(tenant);
    }

    public TenantDto getTenantBySlug(String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        return toDto(tenant);
    }

    public Page<TenantDto> getAllTenants(Pageable pageable) {
        Page<Tenant> tenants = tenantRepository.findAll(pageable);
        return new PageImpl<>(
                tenants.getContent().stream().map(this::toDto).collect(Collectors.toList()),
                pageable,
                tenants.getTotalElements()
        );
    }

    public TenantDto updateTenant(UUID tenantId, TenantDto dto) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));

        if (dto.getName() != null) tenant.setName(dto.getName());
        if (dto.getPlan() != null) tenant.setPlan(dto.getPlan());
        if (dto.getIsActive() != null) tenant.setIsActive(dto.getIsActive());

        Tenant updated = tenantRepository.save(tenant);
        return toDto(updated);
    }

    public void deleteTenant(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        tenantRepository.delete(tenant);
    }

    private TenantDto toDto(Tenant tenant) {
        return TenantDto.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .slug(tenant.getSlug())
                .plan(tenant.getPlan())
                .isActive(tenant.getIsActive())
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .build();
    }
}
