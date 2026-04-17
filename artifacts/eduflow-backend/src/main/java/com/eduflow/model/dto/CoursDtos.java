package com.eduflow.model.dto;

import com.eduflow.model.entity.enums.StatutCours;
import com.eduflow.model.entity.enums.TypeFichier;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public class CoursDtos {

    public record CoursCreateRequest(
            @NotBlank @Size(max = 200) String titre,
            @Size(max = 5000) String description,
            Long matiereId
    ) {}

    public record CoursUpdateRequest(
            @Size(max = 200) String titre,
            @Size(max = 5000) String description,
            Long matiereId
    ) {}

    public record CoursResponse(
            Long id,
            String titre,
            String description,
            Long enseignantId,
            String enseignantNom,
            Long matiereId,
            String matiereNom,
            StatutCours statut,
            OffsetDateTime dateCreation,
            OffsetDateTime datePublication,
            Integer nbConsultations
    ) {}

    public record SupportResponse(
            Long id,
            Long coursId,
            String titre,
            TypeFichier typeFichier,
            Long tailleOctets,
            OffsetDateTime dateUpload
    ) {}
}
