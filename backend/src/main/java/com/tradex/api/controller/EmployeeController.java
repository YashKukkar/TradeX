package com.tradex.api.controller;

import com.tradex.api.dto.CreateEmployeeRequest;
import com.tradex.api.dto.UpdatePermissionsRequest;
import com.tradex.api.dto.UserDTO;
import com.tradex.api.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/employees")
@RequiredArgsConstructor
@Slf4j
public class EmployeeController {

    private final EmployeeService employeeService;

    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    @PostMapping
    public ResponseEntity<UserDTO> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        log.info("Creating employee account for: {}", request.email());
        return ResponseEntity.ok(employeeService.createEmployee(request));
    }

    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserDTO>> listEmployees() {
        return ResponseEntity.ok(employeeService.listEmployees());
    }

    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    @PutMapping("/{id}/permissions")
    public ResponseEntity<UserDTO> updatePermissions(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePermissionsRequest request) {
        log.info("Updating permissions for employee ID: {}", id);
        return ResponseEntity.ok(employeeService.updatePermissions(id, request));
    }

    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        log.info("Deleting employee ID: {}", id);
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok().build();
    }
}
