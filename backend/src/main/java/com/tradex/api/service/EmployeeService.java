package com.tradex.api.service;
import com.tradex.api.mapper.UserMapper;

import com.tradex.api.dto.CreateEmployeeRequest;
import com.tradex.api.dto.UpdatePermissionsRequest;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.repository.TeamRepository;
import com.tradex.api.repository.UserRepository;
import com.tradex.api.config.audit.AdminAudited;
import com.tradex.api.enums.AdminAction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class EmployeeService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final TeamRepository teamRepository;

    @Transactional
    @AdminAudited(action = AdminAction.CREATE_EMPLOYEE, details = "'Created employee account for ' + #request.email")
    public UserDTO createEmployee(CreateEmployeeRequest request) {
        if (userRepository.findByEmail(request.email().trim().toLowerCase()).isPresent()) {
            throw new BadRequestException("An account with this email already exists.");
        }

        Set<String> permissions = parsePermissions(request.permissions());
        Set<String> validTeams = new HashSet<>();
        if (request.teams() != null) {
            for (String tName : request.teams()) {
                if (teamRepository.findByName(tName.trim()).isPresent()) {
                    validTeams.add(tName.trim());
                }
            }
        }

        User employee = User.builder()
                .email(request.email().trim().toLowerCase())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.EMPLOYEE)
                .permissions(permissions)
                .teams(validTeams)
                .build();

        User saved = userRepository.save(employee);
        log.info("Created employee account: {} with permissions: {} and teams: {}", saved.getEmail(), permissions, validTeams);
        return userMapper.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> listEmployees() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE)
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @AdminAudited(action = AdminAction.UPDATE_EMPLOYEE_PERMISSIONS, details = "'Updated permissions for employee ID ' + #employeeId + ' to ' + #request.permissions")
    public UserDTO updatePermissions(Long employeeId, UpdatePermissionsRequest request) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + employeeId));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new BadRequestException("Cannot update permissions for non-employee user.");
        }

        Set<String> permissions = parsePermissions(request.permissions());
        employee.setPermissions(permissions);
        User saved = userRepository.save(employee);
        log.info("Updated permissions for employee {}: {}", saved.getEmail(), permissions);
        return userMapper.toDTO(saved);
    }

    @Transactional
    @AdminAudited(action = AdminAction.DISABLE_EMPLOYEE, details = "'Disabled employee account for ID ' + #employeeId")
    public void deleteEmployee(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + employeeId));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new BadRequestException("Cannot delete non-employee user via this endpoint.");
        }

        employee.setEnabled(false);
        employee.setLocked(true);
        userRepository.save(employee);
        log.info("Disabled employee account: {}", employee.getEmail());
    }

    private Set<String> parsePermissions(List<String> permStrings) {
        if (permStrings == null) return new java.util.HashSet<>();
        Set<String> set = new java.util.HashSet<>();
        for (String p : permStrings) {
            if (p != null && !p.trim().isEmpty()) {
                set.add(p.trim().toUpperCase());
            }
        }
        return set;
    }
}
