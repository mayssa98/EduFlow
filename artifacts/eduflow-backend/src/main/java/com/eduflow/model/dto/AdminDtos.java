package com.eduflow.model.dto;

import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import com.eduflow.model.entity.enums.TwoFactorMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public class AdminDtos {

    public record UserSummary(
            Long id,
            String email,
            String nom,
            String prenom,
            Role role,
            StatutCompte statutCompte,
            OffsetDateTime dateCreation,
            OffsetDateTime derniereConnexion
    ) {}

    public record UserCreateRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 120) String nom,
            @NotBlank @Size(max = 120) String prenom,
            @NotNull Role role
    ) {}

    public record ApprovalRequest(
            @NotNull Decision decision
    ) {
        public enum Decision { APPROVE, REJECT }
    }

    public record StatsOverview(
            Map<Role, Long> usersByRole,
            Map<StatutCompte, Long> usersByStatus,
            Map<String, Long> coursesByStatus,
            long pendingTeachers,
            long pendingSubmissions,
            List<TopCourse> topCourses,
            List<RecentActivity> recentActivity
    ) {}

    public record RecentActivity(
            String type,
            Long id,
            String title,
            String actor,
            OffsetDateTime timestamp
    ) {}

    public record TopCourse(Long coursId, String titre, long nbInscrits, long nbConsultations) {}

    public record TeacherStats(
            long totalCourses,
            long publishedCourses,
            long totalAssignments,
            double averageGrade,
            long totalSubmissions,
            long gradedSubmissions,
            double submissionRate,
            long totalConsultations,
            List<AssignmentStat> perAssignment
    ) {}

    public record AssignmentStat(
            Long assignmentId,
            String titre,
            Long coursId,
            long expected,
            long submissions,
            long graded,
            double submissionRate,
            double averageGrade,
            long courseConsultations
    ) {}

    // ---- Profil commun à tous les rôles ----
    public record UpdateProfileRequest(
            @NotBlank @Size(max = 120) String nom,
            @NotBlank @Size(max = 120) String prenom,
            @Size(max = 500) String photoUrl
    ) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 128)
            @jakarta.validation.constraints.Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$")
            String newPassword
    ) {}

    public record ChangeEmailRequest(
            @NotBlank String currentPassword,
            @Email @NotBlank @Size(max = 180) String newEmail
    ) {}

    public record UpdateMfaRequest(
            boolean enabled,
            TwoFactorMethod method
    ) {}

    public record RequestClassChangeRequest(
            @NotNull Long targetClassId,
            @Size(max = 1000) String motif
    ) {}

    public record ClassOption(
            Long id,
            String nom,
            String niveau,
            String anneeScolaire
    ) {}

    public record PendingClassChangeSummary(
            Long id,
            String statut,
            String classeActuelleNom,
            String classeSouhaiteeNom,
            String motif,
            OffsetDateTime dateDemande
    ) {}

    public record ProfileResponse(
            Long id,
            String email,
            String nom,
            String prenom,
            String role,
            String statutCompte,
            String photoUrl,
            java.time.OffsetDateTime dateCreation,
            java.time.OffsetDateTime derniereConnexion,
            java.time.LocalDate dateNaissance,
            Integer age,
            Boolean emailChangeAllowed,
            Boolean passwordChangeAllowed,
            Boolean mfaEnabled,
            String mfaMethod,
            Long currentClassId,
            String currentClassName,
            List<ClassOption> availableClasses,
            PendingClassChangeSummary pendingClassChange
    ) {}
}
