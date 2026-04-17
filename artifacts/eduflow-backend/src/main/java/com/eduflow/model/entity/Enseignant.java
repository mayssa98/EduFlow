package com.eduflow.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "enseignant")
@PrimaryKeyJoinColumn(name = "id")
@Getter
@Setter
@NoArgsConstructor
public class Enseignant extends Utilisateur {

    @Column(length = 160)
    private String specialite;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "date_validation")
    private OffsetDateTime dateValidation;
}
