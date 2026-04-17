package com.eduflow.model.entity;

import com.eduflow.model.entity.enums.NiveauRisque;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "prediction_risque")
@Getter
@Setter
@NoArgsConstructor
public class PredictionRisque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analyse_id", nullable = false)
    private AnalyseIA analyse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Etudiant etudiant;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_risque", nullable = false, length = 20)
    private NiveauRisque niveauRisque;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(columnDefinition = "TEXT")
    private String justification;
}
