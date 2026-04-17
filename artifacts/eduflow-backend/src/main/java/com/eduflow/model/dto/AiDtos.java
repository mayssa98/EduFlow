package com.eduflow.model.dto;

import com.eduflow.model.entity.enums.NiveauRisque;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class AiDtos {

    public record AnalyseRequest(@NotNull Long coursId) {}

    public record StudentRisk(
            Long etudiantId,
            String nom,
            String prenom,
            NiveauRisque niveauRisque,
            BigDecimal score,
            String justification,
            List<String> recommandations
    ) {}

    public record AnalyseResponse(
            Long analyseId,
            Long coursId,
            OffsetDateTime dateAnalyse,
            boolean utiliseFallback,
            String fournisseur,
            String summary,
            List<StudentRisk> risques
    ) {}
}
