package com.eduflow.service;

import com.eduflow.config.AppProperties;
import com.eduflow.model.dto.AiDtos.*;
import com.eduflow.model.entity.*;
import com.eduflow.model.entity.enums.NiveauRisque;
import com.eduflow.model.entity.enums.StatutDevoir;
import com.eduflow.model.repository.*;
import com.eduflow.security.SecurityUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;

@Service
@Transactional
public class AnalyseIAService {

    private static final Logger log = LoggerFactory.getLogger(AnalyseIAService.class);

    private final AppProperties props;
    private final CoursRepository coursRepo;
    private final InscriptionRepository inscriptionRepo;
    private final EtudiantRepository etudiantRepo;
    private final DevoirRepository devoirRepo;
    private final SoumissionRepository soumissionRepo;
    private final AnalyseIARepository analyseRepo;
    private final PredictionRisqueRepository predictionRepo;
    private final RecommandationRepository recoRepo;
    private final EnseignantRepository enseignantRepo;
    private final ObjectMapper mapper = new ObjectMapper();
    private final RestTemplate http;

    public AnalyseIAService(AppProperties props, CoursRepository c, InscriptionRepository i,
                            EtudiantRepository e, DevoirRepository d, SoumissionRepository s,
                            AnalyseIARepository ar, PredictionRisqueRepository pr,
                            RecommandationRepository rr, EnseignantRepository er,
                            org.springframework.boot.web.client.RestTemplateBuilder builder) {
        this.props = props; this.coursRepo = c; this.inscriptionRepo = i;
        this.etudiantRepo = e; this.devoirRepo = d; this.soumissionRepo = s;
        this.analyseRepo = ar; this.predictionRepo = pr; this.recoRepo = rr; this.enseignantRepo = er;
        this.http = builder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(props.getAi().getTimeoutSeconds()))
                .build();
    }

    public AnalyseResponse analyze(Long coursId) {
        SecurityUtils.requireRole("ENSEIGNANT");
        Cours cours = coursRepo.findById(coursId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        if (!cours.getEnseignant().getId().equals(SecurityUtils.currentUserId()))
            throw new AccessDeniedException("Not the course owner");

        List<StudentSnapshot> snapshots = collectSnapshots(coursId);
        if (snapshots.isEmpty()) throw new IllegalStateException("No enrolled students with data");

        AnalyseIA analyse = new AnalyseIA();
        analyse.setCours(cours);
        analyse.setEnseignant(enseignantRepo.findById(SecurityUtils.currentUserId()).orElseThrow());
        analyse.setFallbackUsed(false);

        List<StudentRisk> risks;
        String summary;
        String fournisseur;
        boolean usedFallback = false;
        String apiKey = props.getAi().getGeminiApiKey();

        if (apiKey == null || apiKey.isBlank()) {
            log.info("[AI] GEMINI_API_KEY missing — using heuristic fallback");
            risks = heuristic(snapshots);
            summary = "Analyse heuristique (clé Gemini absente).";
            fournisseur = "heuristic";
            usedFallback = true;
        } else {
            try {
                GeminiResult r = callGeminiWithRetry(snapshots);
                risks = r.risks;
                summary = r.summary;
                fournisseur = "gemini:" + props.getAi().getGeminiModel();
                analyse.setRawResponse(r.raw);
            } catch (Exception ex) {
                log.warn("[AI] Gemini call failed ({}); using heuristic fallback", ex.getClass().getSimpleName());
                risks = heuristic(snapshots);
                summary = "Fallback heuristique : Gemini indisponible (" + ex.getClass().getSimpleName() + ")";
                fournisseur = "heuristic";
                usedFallback = true;
            }
        }

        analyse.setFallbackUsed(usedFallback);
        analyse.setSummary(summary);
        analyseRepo.save(analyse);

        for (StudentRisk r : risks) {
            PredictionRisque pr = new PredictionRisque();
            pr.setAnalyse(analyse);
            pr.setEtudiant(etudiantRepo.findById(r.etudiantId()).orElseThrow());
            pr.setNiveauRisque(r.niveauRisque());
            pr.setScore(r.score());
            pr.setJustification(r.justification());
            predictionRepo.save(pr);
            int order = 0;
            for (String reco : r.recommandations()) {
                Recommandation rec = new Recommandation();
                rec.setPrediction(pr);
                rec.setContenu(reco);
                rec.setOrdre(order++);
                recoRepo.save(rec);
            }
        }

        return new AnalyseResponse(analyse.getId(), coursId, analyse.getDateAnalyse(),
                usedFallback, fournisseur, summary, risks);
    }

    private record StudentSnapshot(Long etudiantId, String nom, String prenom,
                                   double moyenne, int nbSoumissions, int nbAttendu, int retards) {}

    private List<StudentSnapshot> collectSnapshots(Long coursId) {
        List<Devoir> devoirs = devoirRepo.findByCoursId(coursId);
        List<Inscription> insc = inscriptionRepo.findByCoursId(coursId);
        List<StudentSnapshot> out = new ArrayList<>();
        for (Inscription i : insc) {
            Etudiant e = i.getEtudiant();
            int graded = 0, late = 0, total = devoirs.size();
            BigDecimal sum = BigDecimal.ZERO;
            for (Devoir d : devoirs) {
                Optional<Soumission> s = soumissionRepo.findByDevoirIdAndEtudiantId(d.getId(), e.getId());
                if (s.isPresent()) {
                    Soumission sub = s.get();
                    if (sub.getStatut() == StatutDevoir.GRADED && sub.getNote() != null) {
                        sum = sum.add(sub.getNote());
                        graded++;
                    }
                    if (sub.getDateSoumission() != null && sub.getDateSoumission().isAfter(d.getDateFin())) late++;
                }
            }
            double avg = graded == 0 ? 0.0 : sum.doubleValue() / graded;
            out.add(new StudentSnapshot(e.getId(), e.getNom(), e.getPrenom(),
                    avg, graded, total, late));
        }
        return out;
    }

    private List<StudentRisk> heuristic(List<StudentSnapshot> snaps) {
        double threshold = props.getAi().getFallbackThreshold();
        List<StudentRisk> out = new ArrayList<>();
        for (StudentSnapshot s : snaps) {
            NiveauRisque level;
            if (s.moyenne() < threshold) level = NiveauRisque.ELEVE;
            else if (s.moyenne() < threshold + 3) level = NiveauRisque.MODERE;
            else level = NiveauRisque.FAIBLE;
            String just = String.format(Locale.ROOT,
                    "Moyenne %.2f / soumissions %d/%d / retards %d",
                    s.moyenne(), s.nbSoumissions(), s.nbAttendu(), s.retards());
            List<String> recos = switch (level) {
                case ELEVE -> List.of("Programmer une rencontre individuelle.",
                        "Proposer un plan de remédiation et des exercices guidés.",
                        "Suivre la prochaine soumission de près.");
                case MODERE -> List.of("Encourager la participation et offrir du tutorat ciblé.",
                        "Proposer des ressources complémentaires.");
                case FAIBLE -> List.of("Maintenir l'engagement par des défis avancés.");
            };
            out.add(new StudentRisk(s.etudiantId(), s.nom(), s.prenom(), level,
                    BigDecimal.valueOf(Math.round(s.moyenne() * 100.0) / 100.0), just, recos));
        }
        return out;
    }

    private record GeminiResult(List<StudentRisk> risks, String summary, String raw) {}

    private GeminiResult callGeminiWithRetry(List<StudentSnapshot> snaps) throws Exception {
        String prompt = buildPrompt(snaps);
        Exception last = null;
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                String raw = callGemini(prompt);
                return parseGemini(raw, snaps);
            } catch (Exception e) {
                log.debug("[AI] Gemini attempt {} failed ({})", attempt, e.getClass().getSimpleName());
                last = e;
            }
        }
        throw last != null ? last : new IllegalStateException("Gemini failed");
    }

    private String buildPrompt(List<StudentSnapshot> snaps) {
        StringBuilder sb = new StringBuilder();
        sb.append("Tu es un conseiller pédagogique. Pour chaque étudiant ci-dessous, retourne un JSON STRICT ");
        sb.append("au format suivant et RIEN d'autre : ");
        sb.append("{\"summary\":\"...\",\"students\":[{\"etudiantId\":<long>,\"niveauRisque\":\"FAIBLE|MODERE|ELEVE\",");
        sb.append("\"score\":<0-20>,\"justification\":\"...\",\"recommandations\":[\"...\",\"...\"]}]}.\n");
        sb.append("Données :\n");
        for (StudentSnapshot s : snaps) {
            sb.append(String.format(Locale.ROOT,
                    "- id=%d, nom=%s %s, moyenne=%.2f, soumissions=%d/%d, retards=%d%n",
                    s.etudiantId(), s.prenom(), s.nom(),
                    s.moyenne(), s.nbSoumissions(), s.nbAttendu(), s.retards()));
        }
        return sb.toString();
    }

    private String callGemini(String prompt) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + props.getAi().getGeminiModel() + ":generateContent?key=" + props.getAi().getGeminiApiKey();
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("temperature", 0.2, "responseMimeType", "application/json"));
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        try {
            ResponseEntity<String> resp = http.postForEntity(url, new HttpEntity<>(body, h), String.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null)
                throw new IllegalStateException("Gemini HTTP " + resp.getStatusCode());
            return resp.getBody();
        } catch (RestClientException e) {
            throw new IllegalStateException("Gemini call failed: " + e.getMessage(), e);
        }
    }

    private GeminiResult parseGemini(String raw, List<StudentSnapshot> snaps) throws Exception {
        JsonNode root = mapper.readTree(raw);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) throw new IllegalStateException("No candidates");
        String text = candidates.get(0).path("content").path("parts").path(0).path("text").asText();
        JsonNode payload = mapper.readTree(text);
        String summary = payload.path("summary").asText("");
        JsonNode students = payload.path("students");
        if (!students.isArray()) throw new IllegalStateException("Invalid JSON: students missing");
        Map<Long, StudentSnapshot> byId = new HashMap<>();
        for (StudentSnapshot s : snaps) byId.put(s.etudiantId(), s);
        List<StudentRisk> out = new ArrayList<>();
        for (JsonNode n : students) {
            long id = n.path("etudiantId").asLong();
            StudentSnapshot ref = byId.get(id);
            if (ref == null) continue;
            NiveauRisque level = NiveauRisque.valueOf(n.path("niveauRisque").asText("MODERE").toUpperCase());
            BigDecimal score = BigDecimal.valueOf(n.path("score").asDouble(ref.moyenne()));
            List<String> recos = new ArrayList<>();
            n.path("recommandations").forEach(r -> recos.add(r.asText()));
            out.add(new StudentRisk(id, ref.nom(), ref.prenom(), level, score,
                    n.path("justification").asText(""), recos));
        }
        if (out.isEmpty()) throw new IllegalStateException("Empty risks list from Gemini");
        return new GeminiResult(out, summary, raw);
    }
}
