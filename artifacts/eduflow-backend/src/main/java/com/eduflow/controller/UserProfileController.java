package com.eduflow.controller;

import com.eduflow.model.dto.AdminDtos.*;
import com.eduflow.security.JwtAuthFilter;
import com.eduflow.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints communs à tous les rôles pour la gestion du profil personnel.
 * /users/me — GET, PUT, PATCH password
 */
@RestController
@RequestMapping("/users")
@Tag(name = "Profil", description = "Gestion du profil personnel (nom, prénom, mot de passe) — tous rôles")
public class UserProfileController {

    private final UtilisateurService userService;

    public UserProfileController(UtilisateurService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Récupérer son propre profil")
    public ResponseEntity<ProfileResponse> getMyProfile(
            @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userService.getProfile(principal.userId()));
    }

    @PutMapping("/me/profile")
    @Operation(summary = "Modifier son nom et prénom")
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest req) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userService.updateProfile(principal.userId(), req));
    }

    @PatchMapping("/me/password")
    @Operation(summary = "Changer son mot de passe (nécessite le mot de passe actuel)")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest req) {
        if (principal == null) return ResponseEntity.status(401).build();
        userService.changePassword(principal.userId(), req);
        return ResponseEntity.noContent().build();
    }
}
