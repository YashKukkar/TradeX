package com.tradex.api.service;

import com.tradex.api.enums.Role;
import com.tradex.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserAnalyticsService {

    private final UserRepository userRepository;

    public record UserAnalytics(long totalUsers, long newRegistrations) {}

    @Transactional(readOnly = true)
    @Cacheable(value = "userStats", key = "{#start, #end}")
    public UserAnalytics getUserAnalytics(LocalDateTime start, LocalDateTime end) {
        return new UserAnalytics(
            userRepository.countByRole(Role.USER),
            userRepository.countByRoleAndCreatedAtBetween(Role.USER, start, end)
        );
    }
}
