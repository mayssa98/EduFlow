package com.eduflow.model.entity;

import com.eduflow.model.entity.enums.StatutDevoir;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "soumission", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"devoir_id", "etudiant_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class Soumission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "devoir_id", nullable = false)
    private Devoir devoir;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Etudiant etudiant;

    @Column(name = "contenu_texte", columnDefinition = "TEXT")
    private String contenuTexte;

    @Column(name = "chemin_fichier", length = 500)
    private String cheminFichier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutDevoir statut = StatutDevoir.SUBMITTED;

    @Column(precision = 4, scale = 2)
    private BigDecimal note;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(name = "date_soumission", nullable = false)
    private OffsetDateTime dateSoumission = OffsetDateTime.now();

    @Column(name = "date_notation")
    private OffsetDateTime dateNotation;
}
