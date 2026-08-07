package com.tradex.api.service;

import com.tradex.api.entity.Team;
import com.tradex.api.entity.User;
import com.tradex.api.enums.Role;
import com.tradex.api.exception.AppException.BadRequestException;
import com.tradex.api.exception.AppException.ResourceNotFoundException;
import com.tradex.api.repository.TeamRepository;
import com.tradex.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j

public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "teamPermissions")
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    @Transactional
    @CacheEvict(value = "teamPermissions", allEntries = true)
    public Team createTeam(String name, String description, List<String> permissions) {
        if (teamRepository.findByName(name.trim()).isPresent()) {
            throw new BadRequestException("A team with this name already exists.");
        }
        Team team = Team.builder()
                .name(name.trim())
                .description(description)
                .permissions(permissions != null ? new HashSet<>(permissions) : new HashSet<>())
                .build();
        Team saved = teamRepository.save(team);
        log.info("Created team: {}", saved.getName());
        return saved;
    }

    @Transactional
    @CacheEvict(value = "teamPermissions", allEntries = true)
    public Team updateTeam(Long id, String name, String description, List<String> permissions) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + id));

        if (name != null && !name.trim().isEmpty()) {
            team.setName(name.trim());
        }
        if (description != null) {
            team.setDescription(description);
        }
        if (permissions != null) {
            team.setPermissions(new HashSet<>(permissions));
        }
        Team saved = teamRepository.save(team);
        log.info("Updated team: {}", saved.getName());
        return saved;
    }

    @Transactional
    @CacheEvict(value = "teamPermissions", allEntries = true)
    public void deleteTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + id));
        teamRepository.delete(team);
        log.info("Deleted team: {}", team.getName());
    }

    @Transactional
    public void updateEmployeeTeams(Long employeeId, List<String> teamNames) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + employeeId));

        if (employee.getRole() != Role.EMPLOYEE) {
            throw new BadRequestException("Cannot assign teams to non-employee user.");
        }

        Set<String> validTeams = new HashSet<>();
        if (teamNames != null) {
            for (String tName : teamNames) {
                if (teamRepository.findByName(tName).isPresent()) {
                    validTeams.add(tName);
                }
            }
        }
        employee.setTeams(validTeams);
        userRepository.save(employee);
        log.info("Updated teams for employee {}: {}", employee.getEmail(), validTeams);
    }
}
