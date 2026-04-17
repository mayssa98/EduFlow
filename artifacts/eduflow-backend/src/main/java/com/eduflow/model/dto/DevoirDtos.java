package com.eduflow.model.dto;

import com.eduflow.model.entity.enums.NiveauDifficulte;
import com.eduflow.model.entity.enums.StatutDevoir;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class DevoirDtos {

    public record DevoirCreateRequest(
            @NotNull Long coursId,
            @NotBlank @Size(max = 200) String titre,
            @Size(max = 10000) String consigne,
            NiveauDifficulte difficulte,
            @NotNull OffsetDateTime dateDebut,
            @NotNull OffsetDateTime dateFin,
            @DecimalMin("0.01") @DecimalMax("100.00") BigDecimal noteMax
    ) {}

    public record DevoirUpdateRequest(
            @Size(max = 200) String titre,
            @Size(max = 10000) String consigne,
            NiveauDifficulte difficulte,
            OffsetDateTime dateDebut,
            OffsetDateTime dateFin,
            @DecimalMin("0.01") @DecimalMax("100.00") BigDecimal noteMax
    ) {}

    public record DevoirResponse(
            Long id,
            Long coursId,
            String coursTitre,
            String titre,
            String consigne,
            NiveauDifficulte difficulte,
            OffsetDateTime dateDebut,
            OffsetDateTime dateFin,
            BigDecimal noteMax,
            OffsetDateTime dateCreation
    ) {}

    public record SoumissionCreateRequest(
            @Size(max = 50000) String contenuTexte
    ) {}

    public record SoumissionGradeRequest(
            @NotNull @DecimalMin("0.00") @DecimalMax("20.00") BigDecimal note,
            @Size(max = 5000) String commentaire
    ) {}

    public record SoumissionResponse(
            Long id,
            Long devoirId,
            Long etudiantId,
            String etudiantNom,
            String contenuTexte,
            String cheminFichier,
            StatutDevoir statut,
            BigDecimal note,
            String commentaire,
            OffsetDateTime dateSoumission,
            OffsetDateTime dateNotation
    ) {}
}
