package com.eduflow.service;

import com.eduflow.model.dto.CoursDtos.*;
import com.eduflow.model.entity.*;
import com.eduflow.model.entity.enums.StatutCours;
import com.eduflow.model.repository.*;
import com.eduflow.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@Transactional
public class CoursService {

    private final CoursRepository coursRepo;
    private final EnseignantRepository enseignantRepo;
    private final MatiereRepository matiereRepo;
    private final SupportPedagogiqueRepository supportRepo;
    private final FileStorageService storage;

    public CoursService(CoursRepository c, EnseignantRepository e, MatiereRepository m,
                        SupportPedagogiqueRepository s, FileStorageService st) {
        this.coursRepo = c; this.enseignantRepo = e; this.matiereRepo = m;
        this.supportRepo = s; this.storage = st;
    }

    @Transactional(readOnly = true)
    public List<CoursResponse> listVisible() {
        String role = SecurityUtils.currentRole();
        Long uid = SecurityUtils.currentUserId();
        List<Cours> list = switch (role) {
            case "ADMIN" -> coursRepo.findAll();
            case "ENSEIGNANT" -> coursRepo.findByEnseignantId(uid);
            default -> coursRepo.findByStatut(StatutCours.PUBLISHED);
        };
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CoursResponse get(Long id) {
        Cours c = coursRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Course not found"));
        ensureVisible(c);
        if ("ETUDIANT".equals(SecurityUtils.currentRole())) {
            c.setNbConsultations(c.getNbConsultations() + 1);
            coursRepo.save(c);
        }
        return toResponse(c);
    }

    public CoursResponse create(CoursCreateRequest req) {
        SecurityUtils.requireRole("ENSEIGNANT");
        Enseignant teacher = enseignantRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new AccessDeniedException("Teacher profile missing"));
        Cours c = new Cours();
        c.setTitre(req.titre());
        c.setDescription(req.description());
        c.setEnseignant(teacher);
        if (req.matiereId() != null) {
            c.setMatiere(matiereRepo.findById(req.matiereId())
                    .orElseThrow(() -> new IllegalArgumentException("Matiere not found")));
        }
        c.setStatut(StatutCours.DRAFT);
        return toResponse(coursRepo.save(c));
    }

    public CoursResponse update(Long id, CoursUpdateRequest req) {
        Cours c = ownedOrThrow(id);
        if (req.titre() != null && !req.titre().isBlank()) c.setTitre(req.titre());
        if (req.description() != null) c.setDescription(req.description());
        if (req.matiereId() != null) {
            c.setMatiere(matiereRepo.findById(req.matiereId())
                    .orElseThrow(() -> new IllegalArgumentException("Matiere not found")));
        }
        return toResponse(coursRepo.save(c));
    }

    public void delete(Long id) {
        Cours c = ownedOrThrow(id);
        // Cascade physical files
        supportRepo.findByCoursId(id).forEach(sp -> storage.delete(sp.getCheminFichier()));
        coursRepo.delete(c);
    }

    public CoursResponse publish(Long id) {
        Cours c = ownedOrThrow(id);
        if (c.getStatut() == StatutCours.PUBLISHED) return toResponse(c);
        if (c.getStatut() == StatutCours.ARCHIVED)
            throw new IllegalStateException("Cannot republish an archived course");
        c.setStatut(StatutCours.PUBLISHED);
        c.setDatePublication(OffsetDateTime.now());
        return toResponse(coursRepo.save(c));
    }

    public CoursResponse archive(Long id) {
        Cours c = ownedOrThrow(id);
        c.setStatut(StatutCours.ARCHIVED);
        return toResponse(coursRepo.save(c));
    }

    public SupportResponse uploadFile(Long coursId, MultipartFile file) throws IOException {
        Cours c = ownedOrThrow(coursId);
        FileStorageService.StoredFile stored = storage.storeCourseFile(coursId, file);
        SupportPedagogique sp = new SupportPedagogique();
        sp.setCours(c);
        String original = file.getOriginalFilename();
        sp.setTitre(original != null && !original.isBlank() ? original : ("upload." + stored.type().name().toLowerCase()));
        sp.setTypeFichier(stored.type());
        sp.setCheminFichier(stored.relativePath());
        sp.setTailleOctets(stored.sizeBytes());
        return toSupport(supportRepo.save(sp));
    }

    @Transactional(readOnly = true)
    public List<SupportResponse> listFiles(Long coursId) {
        Cours c = coursRepo.findById(coursId).orElseThrow(() -> new IllegalArgumentException("Course not found"));
        ensureVisible(c);
        return supportRepo.findByCoursId(coursId).stream().map(this::toSupport).toList();
    }

    @Transactional(readOnly = true)
    public SupportPedagogique getFileForServing(Long coursId, Long fileId) {
        Cours c = coursRepo.findById(coursId).orElseThrow(() -> new IllegalArgumentException("Course not found"));
        ensureVisible(c);
        SupportPedagogique sp = supportRepo.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));
        if (!sp.getCours().getId().equals(coursId)) throw new IllegalArgumentException("File not in course");
        return sp;
    }

    public void deleteFile(Long coursId, Long fileId) {
        Cours c = ownedOrThrow(coursId);
        SupportPedagogique sp = supportRepo.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found"));
        if (!sp.getCours().getId().equals(c.getId())) throw new IllegalArgumentException("File not in course");
        storage.delete(sp.getCheminFichier());
        supportRepo.delete(sp);
    }

    private Cours ownedOrThrow(Long id) {
        SecurityUtils.requireRole("ENSEIGNANT");
        Cours c = coursRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Course not found"));
        if (!c.getEnseignant().getId().equals(SecurityUtils.currentUserId())) {
            throw new AccessDeniedException("You do not own this course");
        }
        return c;
    }

    private void ensureVisible(Cours c) {
        String role = SecurityUtils.currentRole();
        if ("ADMIN".equals(role)) return;
        if ("ENSEIGNANT".equals(role)) {
            if (!c.getEnseignant().getId().equals(SecurityUtils.currentUserId()))
                throw new AccessDeniedException("Forbidden");
            return;
        }
        if (c.getStatut() != StatutCours.PUBLISHED)
            throw new AccessDeniedException("Course not available");
    }

    private CoursResponse toResponse(Cours c) {
        return new CoursResponse(
                c.getId(),
                c.getTitre(),
                c.getDescription(),
                c.getEnseignant().getId(),
                c.getEnseignant().getPrenom() + " " + c.getEnseignant().getNom(),
                c.getMatiere() != null ? c.getMatiere().getId() : null,
                c.getMatiere() != null ? c.getMatiere().getNom() : null,
                c.getStatut(),
                c.getDateCreation(),
                c.getDatePublication(),
                c.getNbConsultations()
        );
    }

    private SupportResponse toSupport(SupportPedagogique sp) {
        return new SupportResponse(sp.getId(), sp.getCours().getId(), sp.getTitre(),
                sp.getTypeFichier(), sp.getTailleOctets(), sp.getDateUpload());
    }
}
