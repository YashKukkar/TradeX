package com.tradex.api.controller;

import com.tradex.api.entity.Team;
import com.tradex.api.service.TeamService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/teams")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
public class AdminTeamController {

    private final TeamService teamService;

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @PostMapping
    public ResponseEntity<Team> createTeam(@Valid @RequestBody TeamRequest request) {
        return ResponseEntity.ok(teamService.createTeam(request.name(), request.description(), request.permissions()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Team> updateTeam(@PathVariable Long id, @Valid @RequestBody TeamRequest request) {
        return ResponseEntity.ok(teamService.updateTeam(id, request.name(), request.description(), request.permissions()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/employee/{employeeId}")
    public ResponseEntity<Void> updateEmployeeTeams(@PathVariable Long employeeId, @RequestBody EmployeeTeamsRequest request) {
        teamService.updateEmployeeTeams(employeeId, request.teams());
        return ResponseEntity.ok().build();
    }

    public record TeamRequest(
        @NotBlank(message = "Team name is required") String name,
        String description,
        List<String> permissions
    ) {}

    public record EmployeeTeamsRequest(List<String> teams) {}
}
