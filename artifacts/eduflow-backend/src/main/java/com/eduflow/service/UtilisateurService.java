package com.eduflow.service;

import com.eduflow.model.dto.AdminDtos.*;
import com.eduflow.model.entity.*;
import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import com.eduflow.model.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UtilisateurService {

    private final UtilisateurRepository userRepo;
    private final PasswordEncoder encoder;
    private final EmailService emailService;

    public UtilisateurService(UtilisateurRepository u, PasswordEncoder e, EmailService emailService) {
        this.userRepo = u; this.encoder = e; this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<UserSummary> list(Optional<Role> role, Optional<StatutCompte> status) {
        // Repository-level filtering — no full-table scan or in-memory predicates.
        List<Utilisateur> rows;
        if (role.isPresent() && status.isPresent()) {
            rows = userRepo.findByRoleAndStatutCompteOrderByDateCreationDesc(role.get(), status.get());
        } else if (role.isPresent()) {
            rows = userRepo.findByRoleOrderByDateCreationDesc(role.get());
        } else if (status.isPresent()) {
            rows = userRepo.findByStatutCompteOrderByDateCreationDesc(status.get());
        } else {
            rows = userRepo.findAllByOrderByDateCreationDesc();
        }
        return rows.stream().map(this::toSummary).toList();
    }

    public UserSummary create(UserCreateRequest req) {
        if (req.email().contains("+")) throw new IllegalArgumentException("Email cannot contain '+'");
        String normalized = EmailNormalizer.normalize(req.email());
        if (userRepo.existsByEmailNormalized(normalized))
            throw new IllegalArgumentException("Email already in use");
        Utilisateur user = switch (req.role()) {
            case ADMIN -> new Administrateur();
            case ENSEIGNANT -> new Enseignant();
            case ETUDIANT -> new Etudiant();
        };
        user.setEmail(req.email().toLowerCase());
        user.setEmailNormalized(normalized);
        user.setNom(req.nom().trim());
        user.setPrenom(req.prenom().trim());
        user.setRole(req.role());
        user.setStatutCompte(StatutCompte.ACTIVE);
        user.setMotDePasseHash(encoder.encode(req.password()));
        return toSummary(userRepo.save(user));
    }

    public UserSummary block(Long id) {
        Utilisateur u = require(id);
        // Refuse to block the final ACTIVE administrator — operational continuity.
        if (u.getRole() == Role.ADMIN
                && u.getStatutCompte() == StatutCompte.ACTIVE
                && userRepo.countByRoleAndStatutCompte(Role.ADMIN, StatutCompte.ACTIVE) <= 1) {
            throw new IllegalStateException("Cannot block the last active administrator");
        }
        u.setStatutCompte(StatutCompte.BLOCKED);
        return toSummary(userRepo.save(u));
    }

    public UserSummary unblock(Long id) {
        Utilisateur u = require(id);
        u.setStatutCompte(StatutCompte.ACTIVE);
        u.setNbTentativesLogin(0);
        return toSummary(userRepo.save(u));
    }

    public DeleteResult delete(Long id) {
        Utilisateur u = require(id);
        // Preserve at least one administrator at all times. Either:
        //  - the target IS the final ACTIVE admin (preferred check), or
        //  - the target is the only admin row in the system regardless of status
        //    (defence in depth — blocking can't bypass this).
        long activeAdmins = userRepo.countByRoleAndStatutCompte(Role.ADMIN, StatutCompte.ACTIVE);
        long allAdmins = userRepo.countByRole(Role.ADMIN);
        boolean isLastAdmin = u.getRole() == Role.ADMIN
                && (allAdmins <= 1
                    || (u.getStatutCompte() == StatutCompte.ACTIVE && activeAdmins <= 1));
        if (isLastAdmin) {
            // Spec: deleting the last admin must be BLOCKED rather than removed,
            // so the platform always retains at least one administrator. The
            // operation succeeds (200) and reports blocked=true in the body.
            if (u.getStatutCompte() != StatutCompte.BLOCKED) {
                u.setStatutCompte(StatutCompte.BLOCKED);
                userRepo.save(u);
            }
            return new DeleteResult(false, true,
                    "Last administrator cannot be deleted; account has been blocked instead.");
        }
        userRepo.delete(u);
        return new DeleteResult(true, false, "User deleted.");
    }

    public record DeleteResult(boolean deleted, boolean blocked, String message) {}

    @Transactional(readOnly = true)
    public List<UserSummary> pendingTeachers() {
        return userRepo.findByStatutCompteOrderByDateCreationDesc(StatutCompte.PENDING_APPROVAL).stream()
                .sorted(Comparator.comparing(Utilisateur::getDateCreation).reversed())
                .map(this::toSummary)
                .toList();
    }

    public UserSummary decideApproval(Long id, ApprovalRequest.Decision decision) {
        Utilisateur t = userRepo.findById(id)
                .orElseThrow(() -> new com.eduflow.exception.NotFoundException("User not found"));
        if (t.getStatutCompte() != StatutCompte.PENDING_APPROVAL)
            throw new IllegalStateException("User is not awaiting approval");
        if (decision == ApprovalRequest.Decision.APPROVE) {
            t.setStatutCompte(StatutCompte.ACTIVE);
            if (t instanceof Enseignant enseignant) {
                enseignant.setDateValidation(OffsetDateTime.now());
            }
            emailService.sendApprovalDecisionEmail(t.getEmail(), true);
        } else {
            t.setStatutCompte(StatutCompte.BLOCKED);
            emailService.sendApprovalDecisionEmail(t.getEmail(), false);
        }
        return toSummary(userRepo.save(t));
    }

    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest req) {
        Utilisateur u = require(userId);
        u.setNom(req.nom().trim());
        u.setPrenom(req.prenom().trim());
        return toProfile(userRepo.save(u));
    }

    public void changePassword(Long userId, ChangePasswordRequest req) {
        Utilisateur u = require(userId);
        if (u.getMotDePasseHash() == null || !encoder.matches(req.currentPassword(), u.getMotDePasseHash())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect");
        }
        u.setMotDePasseHash(encoder.encode(req.newPassword()));
        userRepo.save(u);
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        return toProfile(require(userId));
    }

    public ProfileResponse completeOnboarding(Long userId, CompleteOnboardingRequest req) {
        Utilisateur u = require(userId);
        u.setNiveau(req.niveau().trim());
        u.setSpecialiteChoisie(req.specialite().trim());
        u.setOnboardingCompleted(true);
        return toProfile(userRepo.save(u));
    }

    private Utilisateur require(Long id) {

        return userRepo.findById(id).orElseThrow(() -> new com.eduflow.exception.NotFoundException("User not found"));
    }

    public UserSummary toSummary(Utilisateur u) {
        return new UserSummary(u.getId(), u.getEmail(), u.getNom(), u.getPrenom(),
                u.getRole(), u.getStatutCompte(), u.getDateCreation(), u.getDerniereConnexion());
    }

    public ProfileResponse toProfile(Utilisateur u) {
        return new ProfileResponse(u.getId(), u.getEmail(), u.getNom(), u.getPrenom(),
                u.getAge(), u.getAdresse(), u.getNiveau(), u.getSpecialiteChoisie(), u.getOnboardingCompleted(),
                u.getRole().name(), u.getStatutCompte().name(), u.getPhotoUrl(),
                u.getDateCreation(), u.getDerniereConnexion());
    }
}
