package com.eduflow.controller;

import com.eduflow.model.dto.AdminDtos.*;
import com.eduflow.security.JwtAuthFilter;
import com.eduflow.service.UtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

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

    @GetMapping("/avatar/{userId}")
    @Operation(summary = "Servir la photo de profil d'un utilisateur")
    public ResponseEntity<Resource> serveAvatar(@PathVariable Long userId) throws IOException {
        Resource avatar = userService.loadAvatar(userId);
        MediaType mediaType = MediaTypeFactory.getMediaType(avatar).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(avatar.contentLength())
                .body(avatar);
    }

    @PutMapping("/me/profile")
    @Operation(summary = "Modifier son nom et prénom")
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest req) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userService.updateProfile(principal.userId(), req));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importer une nouvelle photo de profil")
    public ResponseEntity<ProfileResponse> uploadAvatar(
            @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal,
            @RequestPart("file") MultipartFile file) throws IOException {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userService.uploadAvatar(principal.userId(), file));
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

    @PatchMapping("/me/email")
    @Operation(summary = "Changer son adresse email (necessite le mot de passe actuel)")
    public ResponseEntity<ProfileResponse> changeEmail(
            @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal,
            @Valid @RequestBody ChangeEmailRequest req) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userService.changeEmail(principal.userId(), req));
    }

    @PatchMapping("/me/mfa")
    @Operation(summary = "Configurer l'authentification renforcee")
    public ResponseEntity<ProfileResponse> updateMfa(
            @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal,
            @Valid @RequestBody UpdateMfaRequest req) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userService.updateMfa(principal.userId(), req));
    }

    @PostMapping("/me/class-change")
    @Operation(summary = "Envoyer une demande de changement de classe")
    public ResponseEntity<ProfileResponse> requestClassChange(
            @AuthenticationPrincipal JwtAuthFilter.AuthPrincipal principal,
            @Valid @RequestBody RequestClassChangeRequest req) {
        if (principal == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(userService.requestClassChange(principal.userId(), req));
    }
}
