package com.eduflow.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "groupe_classe")
@Getter
@Setter
@NoArgsConstructor
public class GroupeClasse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String nom;

    @Column(length = 80)
    private String niveau;

    @Column(name = "annee_scolaire", length = 20)
    private String anneeScolaire;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private OffsetDateTime dateCreation = OffsetDateTime.now();
}
