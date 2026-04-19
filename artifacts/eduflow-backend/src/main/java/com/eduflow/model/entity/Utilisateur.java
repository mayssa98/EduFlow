package com.eduflow.model.entity;

import com.eduflow.model.entity.enums.Role;
import com.eduflow.model.entity.enums.StatutCompte;
import com.eduflow.model.entity.enums.TwoFactorMethod;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "utilisateur")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
public abstract class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "email_normalized", nullable = false, unique = true, length = 180)
    private String emailNormalized;

    @Column(name = "mot_de_passe_hash")
    private String motDePasseHash;

    @Column(nullable = false, length = 120)
    private String nom;

    @Column(nullable = false, length = 120)
    private String prenom;

    @Column(length = 40)
    private String telephone;

    @Column(name = "age")
    private Integer age;

    @Column(name = "adresse", length = 255)
    private String adresse;

    @Column(name = "niveau", length = 120)
    private String niveau;

    @Column(name = "specialite_choisie", length = 160)
    private String specialiteChoisie;

    @Column(name = "onboarding_completed", nullable = false)
    private Boolean onboardingCompleted = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_compte", nullable = false, length = 20)
    private StatutCompte statutCompte = StatutCompte.PENDING;

    @Column(name = "google_subject", length = 120, unique = true)
    private String googleSubject;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(length = 10)
    private String locale = "fr";

    @Column(name = "nb_tentatives_login", nullable = false)
    private Integer nbTentativesLogin = 0;

    @Column(name = "derniere_connexion")
    private OffsetDateTime derniereConnexion;

    @Column(name = "mfa_enabled", nullable = false)
    private Boolean mfaEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "mfa_method", length = 20)
    private TwoFactorMethod mfaMethod;

    @Column(name = "mfa_secret")
    private String mfaSecret;

    @Column(name = "mfa_failed_attempts", nullable = false)
    private Integer mfaFailedAttempts = 0;

    @Column(name = "mfa_lockout_until")
    private OffsetDateTime mfaLockoutUntil;

    @Column(name = "date_creation", nullable = false, updatable = false)
    private OffsetDateTime dateCreation = OffsetDateTime.now();

    @Column(name = "date_modification", nullable = false)
    private OffsetDateTime dateModification = OffsetDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.dateModification = OffsetDateTime.now();
    }
}
