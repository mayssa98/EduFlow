package com.eduflow.model.dto;

import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
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
            List<TopCourse> topCourses
    ) {}

    public record TopCourse(Long coursId, String titre, long nbInscrits, long nbConsultations) {}

    public record TeacherStats(
            long totalCourses,
            long publishedCourses,
            long totalAssignments,
            double averageGrade,
            long totalSubmissions,
            long gradedSubmissions,
            double submissionRate
    ) {}
}
