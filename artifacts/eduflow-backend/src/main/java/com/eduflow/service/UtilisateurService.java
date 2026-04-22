package com.eduflow.service;

import com.eduflow.model.dto.AdminDtos.*;
import com.eduflow.model.entity.*;
import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import com.eduflow.model.entity.enums.StatutDemandeChangement;
import com.eduflow.model.entity.enums.TwoFactorMethod;
import com.eduflow.model.repository.*;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UtilisateurService {

    private final UtilisateurRepository userRepo;
    private final EnseignantRepository teacherRepo;
    private final EtudiantRepository studentRepo;
    private final GroupeClasseRepository classRepo;
    private final DemandeChangementClasseRepository classChangeRepo;
    private final PasswordEncoder encoder;
    private final FileStorageService storage;

    public UtilisateurService(UtilisateurRepository u,
                              EnseignantRepository t,
                              EtudiantRepository s,
                              GroupeClasseRepository c,
                              DemandeChangementClasseRepository d,
                              PasswordEncoder e,
                              FileStorageService storage) {
        this.userRepo = u;
        this.teacherRepo = t;
        this.studentRepo = s;
        this.classRepo = c;
        this.classChangeRepo = d;
        this.encoder = e;
        this.storage = storage;
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

    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest req) {
        Utilisateur u = require(userId);
        u.setNom(req.nom().trim());
        u.setPrenom(req.prenom().trim());
        if (req.photoUrl() != null) {
            u.setPhotoUrl(normalizeOptional(req.photoUrl()));
        }
        return toProfile(userRepo.save(u));
    }

    public ProfileResponse uploadAvatar(Long userId, MultipartFile file) throws IOException {
        Utilisateur u = require(userId);
        String previousPhoto = normalizeOptional(u.getPhotoUrl());
        String storedPath = storage.storeAvatarFile(userId, file);

        if (isManagedPhotoPath(previousPhoto)) {
            storage.delete(previousPhoto);
        }

        u.setPhotoUrl(storedPath);
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

    public ProfileResponse changeEmail(Long userId, ChangeEmailRequest req) {
        Utilisateur u = require(userId);
        if (u.getMotDePasseHash() == null || !encoder.matches(req.currentPassword(), u.getMotDePasseHash())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect");
        }
        if (req.newEmail().contains("+")) {
            throw new IllegalArgumentException("Email cannot contain '+'");
        }

        String normalized = EmailNormalizer.normalize(req.newEmail());
        boolean sameEmail = normalized.equals(u.getEmailNormalized());
        if (!sameEmail && userRepo.existsByEmailNormalized(normalized)) {
            throw new IllegalArgumentException("Email already in use");
        }

        u.setEmail(req.newEmail().trim().toLowerCase());
        u.setEmailNormalized(normalized);
        return toProfile(userRepo.save(u));
    }

    public ProfileResponse updateMfa(Long userId, UpdateMfaRequest req) {
        Utilisateur u = require(userId);

        if (!req.enabled()) {
            u.setMfaEnabled(false);
            u.setMfaMethod(null);
            u.setMfaSecret(null);
            u.setMfaFailedAttempts(0);
            u.setMfaLockoutUntil(null);
            return toProfile(userRepo.save(u));
        }

        if (req.method() == null) {
            throw new IllegalArgumentException("Choisissez une methode de securite.");
        }
        if (req.method() != TwoFactorMethod.EMAIL) {
            throw new IllegalArgumentException("Cette methode n'est pas encore disponible. Utilisez OTP par email pour le moment.");
        }

        u.setMfaEnabled(true);
        u.setMfaMethod(TwoFactorMethod.EMAIL);
        u.setMfaFailedAttempts(0);
        u.setMfaLockoutUntil(null);
        return toProfile(userRepo.save(u));
    }

    public ProfileResponse requestClassChange(Long userId, RequestClassChangeRequest req) {
        Etudiant student = requireStudent(userId);
        GroupeClasse target = classRepo.findById(req.targetClassId())
                .orElseThrow(() -> new com.eduflow.exception.NotFoundException("Classe introuvable"));

        if (student.getGroupeClasse() != null && student.getGroupeClasse().getId().equals(target.getId())) {
            throw new IllegalArgumentException("Vous etes deja dans cette classe.");
        }

        boolean hasPendingRequest = classChangeRepo.findByEtudiantId(student.getId()).stream()
                .anyMatch(d -> d.getStatut() == StatutDemandeChangement.PENDING);
        if (hasPendingRequest) {
            throw new IllegalStateException("Une demande de changement est deja en attente.");
        }

        DemandeChangementClasse request = new DemandeChangementClasse();
        request.setEtudiant(student);
        request.setClasseActuelle(student.getGroupeClasse());
        request.setClasseSouhaitee(target);
        request.setMotif(normalizeOptional(req.motif()));
        classChangeRepo.save(request);

        return toProfile(require(userId));
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        return toProfile(require(userId));
    }

    @Transactional(readOnly = true)
    public Resource loadAvatar(Long userId) throws IOException {
        Utilisateur user = require(userId);
        String photoPath = normalizeOptional(user.getPhotoUrl());
        if (!isManagedPhotoPath(photoPath)) {
            throw new com.eduflow.exception.NotFoundException("Avatar not found");
        }
        return storage.loadAsResource(photoPath);
    }

    private Etudiant requireStudent(Long id) {
        Utilisateur user = require(id);
        if (!(user instanceof Etudiant)) {
            throw new IllegalStateException("Cette action est reservee aux etudiants.");
        }
        return studentRepo.findById(id)
                .orElseThrow(() -> new com.eduflow.exception.NotFoundException("Student not found"));
    }

    private Utilisateur require(Long id) {

        return userRepo.findById(id).orElseThrow(() -> new com.eduflow.exception.NotFoundException("User not found"));
    }

    public UserSummary toSummary(Utilisateur u) {
        return new UserSummary(u.getId(), u.getEmail(), u.getNom(), u.getPrenom(),
                u.getRole(), u.getStatutCompte(), u.getDateCreation(), u.getDerniereConnexion());
    }

    public ProfileResponse toProfile(Utilisateur u) {
        Etudiant student = u instanceof Etudiant ? studentRepo.findById(u.getId()).orElse(null) : null;
        LocalDate birthDate = student != null ? student.getDateNaissance() : null;
        Integer age = birthDate != null ? (int) ChronoUnit.YEARS.between(birthDate, LocalDate.now()) : null;
        GroupeClasse currentClass = student != null ? student.getGroupeClasse() : null;
        List<ClassOption> availableClasses = student != null
                ? classRepo.findAll().stream()
                    .sorted(Comparator.comparing(GroupeClasse::getNom, String.CASE_INSENSITIVE_ORDER))
                    .map(gc -> new ClassOption(gc.getId(), gc.getNom(), gc.getNiveau(), gc.getAnneeScolaire()))
                    .toList()
                : List.of();
        PendingClassChangeSummary pendingClassChange = student != null
                ? classChangeRepo.findByEtudiantId(student.getId()).stream()
                    .max(Comparator.comparing(DemandeChangementClasse::getDateDemande))
                    .map(this::toPendingClassChange)
                    .orElse(null)
                : null;

        return new ProfileResponse(u.getId(), u.getEmail(), u.getNom(), u.getPrenom(),
                u.getRole().name(), u.getStatutCompte().name(), resolvePublicPhotoUrl(u),
                u.getDateCreation(), u.getDerniereConnexion(),
                birthDate, age,
                u.getMotDePasseHash() != null, u.getMotDePasseHash() != null,
                Boolean.TRUE.equals(u.getMfaEnabled()),
                u.getMfaMethod() != null ? u.getMfaMethod().name() : null,
                currentClass != null ? currentClass.getId() : null,
                currentClass != null ? currentClass.getNom() : null,
                availableClasses,
                pendingClassChange);
    }

    private PendingClassChangeSummary toPendingClassChange(DemandeChangementClasse d) {
        return new PendingClassChangeSummary(
                d.getId(),
                d.getStatut().name(),
                d.getClasseActuelle() != null ? d.getClasseActuelle().getNom() : null,
                d.getClasseSouhaitee() != null ? d.getClasseSouhaitee().getNom() : null,
                d.getMotif(),
                d.getDateDemande()
        );
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String resolvePublicPhotoUrl(Utilisateur user) {
        String photoValue = normalizeOptional(user.getPhotoUrl());
        if (photoValue == null) return null;
        if (photoValue.startsWith("http://") || photoValue.startsWith("https://") || photoValue.startsWith("/api/")) {
            return photoValue;
        }
        if (isManagedPhotoPath(photoValue)) {
            return "/api/users/avatar/" + user.getId() + "?v=" + user.getDateModification().toInstant().toEpochMilli();
        }
        return photoValue;
    }

    private boolean isManagedPhotoPath(String photoValue) {
        return photoValue != null
                && !photoValue.startsWith("http://")
                && !photoValue.startsWith("https://")
                && !photoValue.startsWith("/api/")
                && !photoValue.startsWith("/users/");
    }
}
