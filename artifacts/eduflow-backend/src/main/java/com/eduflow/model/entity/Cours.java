package com.eduflow.model.entity;

import com.eduflow.model.entity.enums.StatutCours;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "cours")
@Getter
@Setter
@NoArgsConstructor
public class Cours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enseignant_id", nullable = false)
    private Enseignant enseignant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matiere_id")
    private Matiere matiere;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutCours statut = StatutCours.DRAFT;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private OffsetDateTime dateCreation = OffsetDateTime.now();

    @Column(name = "date_publication")
    private OffsetDateTime datePublication;

    @Column(name = "nb_consultations", nullable = false)
    private Integer nbConsultations = 0;
}
