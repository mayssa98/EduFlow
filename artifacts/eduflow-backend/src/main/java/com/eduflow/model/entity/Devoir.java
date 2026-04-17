package com.eduflow.model.entity;

import com.eduflow.model.entity.enums.NiveauDifficulte;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "devoir")
@Getter
@Setter
@NoArgsConstructor
public class Devoir {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cours_id", nullable = false)
    private Cours cours;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String consigne;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NiveauDifficulte difficulte = NiveauDifficulte.MOYEN;

    @Column(name = "date_debut", nullable = false)
    private OffsetDateTime dateDebut;

    @Column(name = "date_fin", nullable = false)
    private OffsetDateTime dateFin;

    @Column(name = "fichier_consigne", length = 500)
    private String fichierConsigne;

    @Column(name = "note_max", nullable = false, precision = 4, scale = 2)
    private BigDecimal noteMax = new BigDecimal("20.00");

    @Column(name = "date_creation", nullable = false, updatable = false)
    private OffsetDateTime dateCreation = OffsetDateTime.now();
}
