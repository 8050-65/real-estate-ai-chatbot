package com.leadrat.crm.user;

import com.leadrat.crm.common.ResourceNotFoundException;
import com.leadrat.crm.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserDto getCurrentUser(UUID userId, UUID tenantId) {
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toDto(user);
    }

    public Page<UserDto> getUsers(UUID tenantId, Pageable pageable) {
        Page<User> users = userRepository.findByTenantIdAndIsActiveTrue(tenantId, pageable);
        return new PageImpl<>(
                users.getContent().stream().map(this::toDto).collect(Collectors.toList()),
                pageable,
                users.getTotalElements()
        );
    }

    public UserDto getUserById(UUID userId, UUID tenantId) {
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toDto(user);
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .tenantId(user.getTenantId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .whatsappNumber(user.getWhatsappNumber())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
