package com.eduflow.controller;

import com.eduflow.model.dto.AdminDtos.*;
import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import com.eduflow.service.StatsService;
import com.eduflow.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/admin")
@Tag(name = "Admin", description = "User management, approvals and stats (ADMIN role)")
@ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "400", description = "Validation error or business rule violation"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Forbidden — caller is not ADMIN"),
        @ApiResponse(responseCode = "404", description = "Resource not found")
})
public class AdminController {

    private final UtilisateurService userService;
    private final StatsService statsService;

    public AdminController(UtilisateurService u, StatsService s) {
        this.userService = u; this.statsService = s;
    }

    @GetMapping("/users")
    @Operation(summary = "List users with optional role/status filters")
    public List<UserSummary> listUsers(@RequestParam(required = false) Role role,
                                       @RequestParam(required = false) StatutCompte status) {
        return userService.list(Optional.ofNullable(role), Optional.ofNullable(status));
    }

    @PostMapping("/users")
    @Operation(summary = "Create a user (ADMIN/ENSEIGNANT/ETUDIANT)")
    public UserSummary createUser(@Valid @RequestBody UserCreateRequest req) {
        return userService.create(req);
    }

    @PatchMapping("/users/{id}/block")
    @Operation(summary = "Block a user account")
    public UserSummary block(@PathVariable Long id) { return userService.block(id); }

    @PatchMapping("/users/{id}/unblock")
    @Operation(summary = "Unblock a user account")
    public UserSummary unblock(@PathVariable Long id) { return userService.unblock(id); }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete a user (rejects deletion of the last admin)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/approvals")
    @Operation(summary = "List teachers awaiting approval")
    public List<UserSummary> approvals() { return userService.pendingTeachers(); }

    @PatchMapping("/approvals/{id}")
    @Operation(summary = "Approve or reject a pending teacher account")
    public UserSummary approve(@PathVariable Long id, @Valid @RequestBody ApprovalRequest req) {
        return userService.decideApproval(id, req.decision());
    }

    @GetMapping("/stats/overview")
    @Operation(summary = "Aggregate stats for the admin dashboard")
    public StatsOverview overview() { return statsService.overview(); }
}
