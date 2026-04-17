package com.eduflow.service;

import com.eduflow.model.dto.DevoirDtos.*;
import com.eduflow.model.entity.*;
import com.eduflow.model.entity.enums.NiveauDifficulte;
import com.eduflow.model.entity.enums.StatutCours;
import com.eduflow.model.entity.enums.StatutDevoir;
import com.eduflow.model.repository.*;
import com.eduflow.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@Transactional
public class DevoirService {

    private final DevoirRepository devoirRepo;
    private final CoursRepository coursRepo;
    private final SoumissionRepository soumissionRepo;
    private final EtudiantRepository etudiantRepo;
    private final InscriptionRepository inscriptionRepo;

    public DevoirService(DevoirRepository d, CoursRepository c, SoumissionRepository s,
                         EtudiantRepository e, InscriptionRepository i) {
        this.devoirRepo = d; this.coursRepo = c; this.soumissionRepo = s;
        this.etudiantRepo = e; this.inscriptionRepo = i;
    }

    @Transactional(readOnly = true)
    public List<DevoirResponse> listForCourse(Long coursId) {
        ensureCourseVisible(coursId);
        return devoirRepo.findByCoursId(coursId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DevoirResponse get(Long id) {
        Devoir d = devoirRepo.findById(id).orElseThrow(() -> new com.eduflow.exception.NotFoundException("Assignment not found"));
        ensureCourseVisible(d.getCours().getId());
        return toResponse(d);
    }

    public DevoirResponse create(DevoirCreateRequest req) {
        SecurityUtils.requireRole("ENSEIGNANT");
        Cours cours = coursRepo.findById(req.coursId())
                .orElseThrow(() -> new com.eduflow.exception.NotFoundException("Course not found"));
        if (!cours.getEnseignant().getId().equals(SecurityUtils.currentUserId()))
            throw new AccessDeniedException("Not the course owner");
        if (!req.dateDebut().isBefore(req.dateFin()))
            throw new IllegalArgumentException("dateDebut must be before dateFin");
        Devoir d = new Devoir();
        d.setCours(cours);
        d.setTitre(req.titre());
        d.setConsigne(req.consigne());
        d.setDifficulte(req.difficulte() != null ? req.difficulte() : NiveauDifficulte.MOYEN);
        d.setDateDebut(req.dateDebut());
        d.setDateFin(req.dateFin());
        if (req.noteMax() != null) d.setNoteMax(req.noteMax());
        return toResponse(devoirRepo.save(d));
    }

    public DevoirResponse update(Long id, DevoirUpdateRequest req) {
        Devoir d = devoirRepo.findById(id).orElseThrow(() -> new com.eduflow.exception.NotFoundException("Assignment not found"));
        if (!d.getCours().getEnseignant().getId().equals(SecurityUtils.currentUserId()))
            throw new AccessDeniedException("Not the course owner");
        if (req.titre() != null && !req.titre().isBlank()) d.setTitre(req.titre());
        if (req.consigne() != null) d.setConsigne(req.consigne());
        if (req.difficulte() != null) d.setDifficulte(req.difficulte());
        if (req.dateDebut() != null) d.setDateDebut(req.dateDebut());
        if (req.dateFin() != null) d.setDateFin(req.dateFin());
        if (!d.getDateDebut().isBefore(d.getDateFin()))
            throw new IllegalArgumentException("dateDebut must be before dateFin");
        if (req.noteMax() != null) d.setNoteMax(req.noteMax());
        return toResponse(devoirRepo.save(d));
    }

    public void delete(Long id) {
        Devoir d = devoirRepo.findById(id).orElseThrow(() -> new com.eduflow.exception.NotFoundException("Assignment not found"));
        if (!d.getCours().getEnseignant().getId().equals(SecurityUtils.currentUserId()))
            throw new AccessDeniedException("Not the course owner");
        // Cascade: remove submissions before the assignment to avoid FK violations.
        soumissionRepo.deleteAll(soumissionRepo.findByDevoirId(id));
        devoirRepo.delete(d);
    }

    public SoumissionResponse submit(Long devoirId, SoumissionCreateRequest req) {
        SecurityUtils.requireRole("ETUDIANT");
        Devoir devoir = devoirRepo.findById(devoirId)
                .orElseThrow(() -> new com.eduflow.exception.NotFoundException("Assignment not found"));
        // Server-side deadline enforcement (regardless of frontend state).
        if (OffsetDateTime.now().isAfter(devoir.getDateFin()))
            throw new IllegalStateException("Deadline passed — submissions are closed");
        if (OffsetDateTime.now().isBefore(devoir.getDateDebut()))
            throw new IllegalStateException("Assignment not yet open");
        if (devoir.getCours().getStatut() != StatutCours.PUBLISHED)
            throw new IllegalStateException("Course is not published");

        Long etudiantId = SecurityUtils.currentUserId();
        Etudiant etu = etudiantRepo.findById(etudiantId)
                .orElseThrow(() -> new AccessDeniedException("Student profile missing"));
        // Enrollment guard: student must be enrolled in the course before submitting.
        boolean enrolled = inscriptionRepo.findByEtudiantId(etudiantId).stream()
                .anyMatch(i -> i.getCours().getId().equals(devoir.getCours().getId()));
        if (!enrolled) throw new AccessDeniedException("You are not enrolled in this course");

        Soumission existing = soumissionRepo.findByDevoirIdAndEtudiantId(devoirId, etudiantId).orElse(null);
        if (existing != null) {
            if (existing.getStatut() == StatutDevoir.GRADED)
                throw new IllegalStateException("Submission already graded — cannot resubmit");
            existing.setContenuTexte(req.contenuTexte());
            existing.setStatut(StatutDevoir.SUBMITTED);
            existing.setDateSoumission(OffsetDateTime.now());
            return toResponse(soumissionRepo.save(existing));
        }
        Soumission s = new Soumission();
        s.setDevoir(devoir);
        s.setEtudiant(etu);
        s.setContenuTexte(req.contenuTexte());
        s.setStatut(StatutDevoir.SUBMITTED);
        return toResponse(soumissionRepo.save(s));
    }

    @Transactional(readOnly = true)
    public List<SoumissionResponse> listSubmissions(Long devoirId) {
        Devoir d = devoirRepo.findById(devoirId).orElseThrow(() -> new com.eduflow.exception.NotFoundException("Assignment not found"));
        if (!d.getCours().getEnseignant().getId().equals(SecurityUtils.currentUserId())
                && !"ADMIN".equals(SecurityUtils.currentRole()))
            throw new AccessDeniedException("Not the course owner");
        return soumissionRepo.findByDevoirId(devoirId).stream().map(this::toResponse).toList();
    }

    public SoumissionResponse grade(Long submissionId, SoumissionGradeRequest req) {
        Soumission s = soumissionRepo.findById(submissionId)
                .orElseThrow(() -> new com.eduflow.exception.NotFoundException("Submission not found"));
        if (!s.getDevoir().getCours().getEnseignant().getId().equals(SecurityUtils.currentUserId()))
            throw new AccessDeniedException("Not the course owner");
        BigDecimal max = BigDecimal.valueOf(20);
        if (req.note().compareTo(BigDecimal.ZERO) < 0 || req.note().compareTo(max) > 0)
            throw new IllegalArgumentException("Grade must be between 0 and 20");
        s.setNote(req.note());
        s.setCommentaire(req.commentaire());
        s.setStatut(StatutDevoir.GRADED);
        s.setDateNotation(OffsetDateTime.now());
        return toResponse(soumissionRepo.save(s));
    }

    @Transactional(readOnly = true)
    public List<SoumissionResponse> mySubmissions() {
        SecurityUtils.requireRole("ETUDIANT");
        return soumissionRepo.findByEtudiantId(SecurityUtils.currentUserId())
                .stream().map(this::toResponse).toList();
    }

    private void ensureCourseVisible(Long coursId) {
        Cours c = coursRepo.findById(coursId).orElseThrow(() -> new com.eduflow.exception.NotFoundException("Course not found"));
        String role = SecurityUtils.currentRole();
        if ("ADMIN".equals(role)) return;
        if ("ENSEIGNANT".equals(role)) {
            if (!c.getEnseignant().getId().equals(SecurityUtils.currentUserId()))
                throw new AccessDeniedException("Forbidden");
            return;
        }
        if (c.getStatut() != StatutCours.PUBLISHED) throw new AccessDeniedException("Forbidden");
    }

    private DevoirResponse toResponse(Devoir d) {
        return new DevoirResponse(d.getId(), d.getCours().getId(), d.getCours().getTitre(),
                d.getTitre(), d.getConsigne(), d.getDifficulte(),
                d.getDateDebut(), d.getDateFin(), d.getNoteMax(), d.getDateCreation());
    }

    private SoumissionResponse toResponse(Soumission s) {
        Etudiant e = s.getEtudiant();
        return new SoumissionResponse(s.getId(), s.getDevoir().getId(), e.getId(),
                e.getPrenom() + " " + e.getNom(), s.getContenuTexte(), s.getCheminFichier(),
                s.getStatut(), s.getNote(), s.getCommentaire(),
                s.getDateSoumission(), s.getDateNotation());
    }
}
