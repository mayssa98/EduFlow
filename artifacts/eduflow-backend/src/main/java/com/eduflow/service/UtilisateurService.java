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
    private final EnseignantRepository teacherRepo;
    private final PasswordEncoder encoder;

    public UtilisateurService(UtilisateurRepository u, EnseignantRepository t, PasswordEncoder e) {
        this.userRepo = u; this.teacherRepo = t; this.encoder = e;
    }

    @Transactional(readOnly = true)
    public List<UserSummary> list(Optional<Role> role, Optional<StatutCompte> status) {
        return userRepo.findAll().stream()
                .filter(u -> role.map(r -> u.getRole() == r).orElse(true))
                .filter(u -> status.map(s -> u.getStatutCompte() == s).orElse(true))
                .sorted(Comparator.comparing(Utilisateur::getDateCreation).reversed())
                .map(this::toSummary).toList();
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
        if (u.getRole() == Role.ADMIN && userRepo.countByRole(Role.ADMIN) <= 1) {
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
        return teacherRepo.findByStatutCompte(StatutCompte.PENDING_APPROVAL).stream()
                .map(this::toSummary).toList();
    }

    public UserSummary decideApproval(Long id, ApprovalRequest.Decision decision) {
        Enseignant t = teacherRepo.findById(id)
                .orElseThrow(() -> new com.eduflow.exception.NotFoundException("Teacher not found"));
        if (t.getStatutCompte() != StatutCompte.PENDING_APPROVAL)
            throw new IllegalStateException("Teacher is not awaiting approval");
        if (decision == ApprovalRequest.Decision.APPROVE) {
            t.setStatutCompte(StatutCompte.ACTIVE);
            t.setDateValidation(OffsetDateTime.now());
        } else {
            t.setStatutCompte(StatutCompte.BLOCKED);
        }
        return toSummary(teacherRepo.save(t));
    }

    private Utilisateur require(Long id) {
        return userRepo.findById(id).orElseThrow(() -> new com.eduflow.exception.NotFoundException("User not found"));
    }

    public UserSummary toSummary(Utilisateur u) {
        return new UserSummary(u.getId(), u.getEmail(), u.getNom(), u.getPrenom(),
                u.getRole(), u.getStatutCompte(), u.getDateCreation(), u.getDerniereConnexion());
    }
}
