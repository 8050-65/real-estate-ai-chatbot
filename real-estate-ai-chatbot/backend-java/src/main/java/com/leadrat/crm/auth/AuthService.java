package com.leadrat.crm.auth;

import com.leadrat.crm.auth.dto.LoginRequest;
import com.leadrat.crm.auth.dto.LoginResponse;
import com.leadrat.crm.common.UnauthorizedException;
import com.leadrat.crm.user.User;
import com.leadrat.crm.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    public LoginResponse login(LoginRequest request, UUID tenantId) {
        User user = userRepository.findByEmailAndTenantId(request.getEmail(), tenantId)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new UnauthorizedException("User account is inactive");
        }

        String token = jwtTokenProvider.generateToken(user, tenantId);

        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtExpirationMs)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .tenantId(tenantId)
                .build();
    }

    public void logout(UUID userId) {
        log.info("User {} logged out", userId);
    }
}
