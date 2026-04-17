package com.eduflow.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "etudiant")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
public class Etudiant extends Utilisateur {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_classe_id")
    private GroupeClasse groupeClasse;

    @Column(length = 40, unique = true)
    private String matricule;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;
}
