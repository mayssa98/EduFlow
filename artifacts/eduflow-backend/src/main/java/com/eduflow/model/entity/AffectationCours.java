package com.eduflow.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "affectation_cours", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"cours_id", "groupe_classe_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class AffectationCours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cours_id", nullable = false)
    private Cours cours;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "groupe_classe_id", nullable = false)
    private GroupeClasse groupeClasse;

    @Column(name = "date_affectation", nullable = false, updatable = false)
    private OffsetDateTime dateAffectation = OffsetDateTime.now();
}
