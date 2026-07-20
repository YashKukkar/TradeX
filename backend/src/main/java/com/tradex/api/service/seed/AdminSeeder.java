package com.tradex.api.service.seed;

import com.tradex.api.entity.User;
import com.tradex.api.enums.Permission;
import com.tradex.api.enums.Role;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.config.AppProperties;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Transactional
    public void seedAdmin() {
        String adminEmail = appProperties.getSeed().getAdminEmail();
        String adminPassword = appProperties.getSeed().getAdminPassword();

        if (!userRepository.existsByEmail(adminEmail)) {
            log.info("Seeding default admin user: {}", adminEmail);
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.SUPER_ADMIN);
            admin.setEmailVerified(true);
            admin.setPhoneVerified(true);

            userRepository.save(admin);
        } else {
            userRepository.findByEmail(adminEmail).ifPresent(admin -> {
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRole(Role.SUPER_ADMIN);
                admin.setEmailVerified(true);
                admin.setPhoneVerified(true);
                userRepository.save(admin);
                log.info("Updated existing admin role to SUPER_ADMIN, password, and verification status");
            });
        }

        // Seed default employees e1@tradex.com, e2@tradex.com, e3@tradex.com
        seedEmployee("e1@tradex.com", adminPassword, new HashSet<>(List.of(
                Permission.MANAGE_USERS,
                Permission.MANAGE_POINTS
        )));

        seedEmployee("e2@tradex.com", adminPassword, new HashSet<>(List.of(
                Permission.MANAGE_DEPOSITS,
                Permission.MANAGE_WITHDRAWALS
        )));

        seedEmployee("e3@tradex.com", adminPassword, new HashSet<>(List.of(
                Permission.MANAGE_SETTINGS
        )));
    }

    private void seedEmployee(String email, String password, Set<Permission> permissions) {
        if (!userRepository.existsByEmail(email)) {
            log.info("Seeding default employee user: {}", email);
            User emp = new User();
            emp.setEmail(email);
            emp.setPassword(passwordEncoder.encode(password));
            emp.setRole(Role.EMPLOYEE);
            emp.setEmailVerified(true);
            emp.setPhoneVerified(true);
            emp.setPermissions(permissions);

            userRepository.save(emp);
        } else {
            userRepository.findByEmail(email).ifPresent(emp -> {
                emp.setPassword(passwordEncoder.encode(password));
                emp.setRole(Role.EMPLOYEE);
                emp.setEmailVerified(true);
                emp.setPhoneVerified(true);
                emp.setPermissions(permissions);
                userRepository.save(emp);
                log.info("Updated existing employee user: {}", email);
            });
        }
    }
}
