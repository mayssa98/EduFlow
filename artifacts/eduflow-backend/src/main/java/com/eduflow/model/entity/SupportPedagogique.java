package com.eduflow.model.entity;

import com.eduflow.model.entity.enums.TypeFichier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "support_pedagogique")
@Getter
@Setter
@NoArgsConstructor
public class SupportPedagogique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cours_id", nullable = false)
    private Cours cours;

    @Column(nullable = false, length = 200)
    private String titre;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_fichier", nullable = false, length = 20)
    private TypeFichier typeFichier;

    @Column(name = "chemin_fichier", nullable = false, length = 500)
    private String cheminFichier;

    @Column(name = "taille_octets", nullable = false)
    private Long tailleOctets;

    @Column(name = "date_upload", nullable = false, updatable = false)
    private OffsetDateTime dateUpload = OffsetDateTime.now();
}
