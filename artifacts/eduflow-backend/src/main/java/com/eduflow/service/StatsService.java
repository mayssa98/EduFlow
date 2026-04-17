package com.eduflow.service;

import com.eduflow.model.dto.AdminDtos.*;
import com.eduflow.model.entity.Cours;
import com.eduflow.model.entity.Soumission;
import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import com.eduflow.model.entity.enums.StatutCours;
import com.eduflow.model.entity.enums.StatutDevoir;
import com.eduflow.model.repository.*;
import com.eduflow.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

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
        Map<Role, Long> byRole = new EnumMap<>(Role.class);
        for (Role r : Role.values()) byRole.put(r, userRepo.countByRole(r));

        Map<StatutCompte, Long> byStatus = new EnumMap<>(StatutCompte.class);
        for (StatutCompte s : StatutCompte.values()) byStatus.put(s, userRepo.countByStatutCompte(s));

        Map<String, Long> byCourse = new LinkedHashMap<>();
        for (StatutCours sc : StatutCours.values()) byCourse.put(sc.name(), coursRepo.countByStatut(sc));

        long pendingTeachers = teacherRepo.findByStatutCompte(StatutCompte.PENDING_APPROVAL).size();
        long pendingSubs = soumissionRepo.findAll().stream()
                .filter(s -> s.getStatut() == StatutDevoir.SUBMITTED).count();

        List<TopCourse> top = coursRepo.findAll().stream()
                .map(c -> new TopCourse(c.getId(), c.getTitre(),
                        inscriptionRepo.findByCoursId(c.getId()).size(),
                        c.getNbConsultations() == null ? 0L : c.getNbConsultations().longValue()))
                .sorted(Comparator.comparingLong(TopCourse::nbInscrits).reversed())
                .limit(5).toList();

        return new StatsOverview(byRole, byStatus, byCourse, pendingTeachers, pendingSubs, top);
    }

    public TeacherStats teacherStats() {
        SecurityUtils.requireRole("ENSEIGNANT");
        Long uid = SecurityUtils.currentUserId();
        List<Cours> mine = coursRepo.findByEnseignantId(uid);
        long total = mine.size();
        long published = mine.stream().filter(c -> c.getStatut() == StatutCours.PUBLISHED).count();

        long totalAssign = 0, totalSubs = 0, gradedSubs = 0;
        BigDecimal sumGrade = BigDecimal.ZERO;
        long count = 0;
        long expectedSubs = 0;
        for (Cours c : mine) {
            var assignments = devoirRepo.findByCoursId(c.getId());
            totalAssign += assignments.size();
            long enrolled = inscriptionRepo.findByCoursId(c.getId()).size();
            for (var a : assignments) {
                expectedSubs += enrolled;
                List<Soumission> subs = soumissionRepo.findByDevoirId(a.getId());
                totalSubs += subs.size();
                for (Soumission s : subs) {
                    if (s.getStatut() == StatutDevoir.GRADED && s.getNote() != null) {
                        gradedSubs++;
                        sumGrade = sumGrade.add(s.getNote());
                        count++;
                    }
                }
            }
        }
        double avg = count == 0 ? 0.0 : sumGrade.doubleValue() / count;
        double rate = expectedSubs == 0 ? 0.0 : (double) totalSubs / expectedSubs;
        return new TeacherStats(total, published, totalAssign, avg, totalSubs, gradedSubs, rate);
    }
}
