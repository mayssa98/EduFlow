package com.eduflow.model.entity;

import com.eduflow.model.entity.enums.StatutDemandeChangement;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "demande_changement_classe")
@Getter
@Setter
@NoArgsConstructor
public class DemandeChangementClasse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Etudiant etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classe_actuelle_id")
    private GroupeClasse classeActuelle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classe_souhaitee_id", nullable = false)
    private GroupeClasse classeSouhaitee;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutDemandeChangement statut = StatutDemandeChangement.PENDING;

    @Column(name = "date_demande", nullable = false, updatable = false)
    private OffsetDateTime dateDemande = OffsetDateTime.now();

    @Column(name = "date_decision")
    private OffsetDateTime dateDecision;
}
