package com.eduflow.service;

import com.eduflow.model.dto.AdminDtos.*;
import com.eduflow.model.entity.Cours;
import com.eduflow.model.entity.Devoir;
import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import com.eduflow.model.entity.enums.StatutCours;
import com.eduflow.model.entity.enums.StatutDevoir;
import com.eduflow.model.repository.*;
import com.eduflow.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class StatsService {

    private final UtilisateurRepository userRepo;
    private final CoursRepository coursRepo;
    private final InscriptionRepository inscriptionRepo;
    private final DevoirRepository devoirRepo;
    private final SoumissionRepository soumissionRepo;
    private final EnseignantRepository teacherRepo;

    public StatsService(UtilisateurRepository u, CoursRepository c, InscriptionRepository i,
                        DevoirRepository d, SoumissionRepository s, EnseignantRepository t) {
        this.userRepo = u; this.coursRepo = c; this.inscriptionRepo = i;
        this.devoirRepo = d; this.soumissionRepo = s; this.teacherRepo = t;
    }

    public StatsOverview overview() {
        // Pure repository-level COUNT aggregates (no full-table scans).
        Map<Role, Long> byRole = new EnumMap<>(Role.class);
        for (Role r : Role.values()) byRole.put(r, userRepo.countByRole(r));

        Map<StatutCompte, Long> byStatus = new EnumMap<>(StatutCompte.class);
        for (StatutCompte s : StatutCompte.values()) byStatus.put(s, userRepo.countByStatutCompte(s));

        Map<String, Long> byCourse = new LinkedHashMap<>();
        for (StatutCours sc : StatutCours.values()) byCourse.put(sc.name(), coursRepo.countByStatut(sc));

        long pendingTeachers = userRepo.countByRoleAndStatutCompte(Role.ENSEIGNANT, StatutCompte.PENDING_APPROVAL);
        long pendingSubs = soumissionRepo.countByStatut(StatutDevoir.SUBMITTED);

        // Top courses: still iterates published courses, but uses count queries
        // per course (no in-memory aggregation over submissions).
        List<TopCourse> top = coursRepo.findByStatut(StatutCours.PUBLISHED).stream()
                .map(c -> new TopCourse(
                        c.getId(),
                        c.getTitre(),
                        inscriptionRepo.countByCoursId(c.getId()),
                        c.getNbConsultations() == null ? 0L : c.getNbConsultations().longValue()))
                .sorted(Comparator.comparingLong(TopCourse::nbInscrits).reversed())
                .limit(5).toList();

        return new StatsOverview(byRole, byStatus, byCourse, pendingTeachers, pendingSubs, top);
    }

    public TeacherStats teacherStats() {
        SecurityUtils.requireRole("ENSEIGNANT");
        Long uid = SecurityUtils.currentUserId();

        long total = coursRepo.countByEnseignantId(uid);
        long published = coursRepo.countByEnseignantIdAndStatut(uid, StatutCours.PUBLISHED);
        long totalAssign = devoirRepo.countByTeacherId(uid);
        Long sumConsult = coursRepo.sumConsultationsForTeacher(uid);
        long consultations = sumConsult == null ? 0L : sumConsult;
        Double avgGradeNullable = soumissionRepo.averageGradeForTeacher(uid);
        double avg = avgGradeNullable == null ? 0.0 : avgGradeNullable;

        long totalSubs = 0, gradedSubs = 0, expectedSubs = 0;
        List<AssignmentStat> perAssignment = new ArrayList<>();
        List<Devoir> assignments = devoirRepo.findByTeacherId(uid);
        Map<Long, Long> enrollCache = new HashMap<>();
        for (Devoir a : assignments) {
            Cours c = a.getCours();
            long enrolled = enrollCache.computeIfAbsent(c.getId(), inscriptionRepo::countByCoursId);
            long subs = soumissionRepo.countByDevoirId(a.getId());
            long graded = soumissionRepo.countByDevoirIdAndStatut(a.getId(), StatutDevoir.GRADED);
            Double avgA = soumissionRepo.averageGradeForAssignment(a.getId());
            double rate = enrolled == 0 ? 0.0 : (double) subs / enrolled;
            totalSubs += subs;
            gradedSubs += graded;
            expectedSubs += enrolled;
            perAssignment.add(new AssignmentStat(
                    a.getId(), a.getTitre(), c.getId(),
                    enrolled, subs, graded, rate,
                    avgA == null ? 0.0 : avgA,
                    c.getNbConsultations() == null ? 0L : c.getNbConsultations().longValue()
            ));
        }
        double overallRate = expectedSubs == 0 ? 0.0 : (double) totalSubs / expectedSubs;
        return new TeacherStats(total, published, totalAssign, avg, totalSubs, gradedSubs,
                overallRate, consultations, perAssignment);
    }
}
