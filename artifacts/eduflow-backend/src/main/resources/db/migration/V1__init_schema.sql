-- EduFlow initial schema
-- Postgres uses CHECK constraints for the enum-style columns so that JPA can map them
-- to Java enums via @Enumerated(EnumType.STRING) without registering custom Hibernate types.

CREATE TABLE groupe_classe (
    id              BIGSERIAL PRIMARY KEY,
    nom             VARCHAR(120) NOT NULL UNIQUE,
    niveau          VARCHAR(80),
    annee_scolaire  VARCHAR(20),
    description     TEXT,
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matiere (
    id              BIGSERIAL PRIMARY KEY,
    nom             VARCHAR(120) NOT NULL UNIQUE,
    code            VARCHAR(40) UNIQUE,
    description     TEXT,
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE utilisateur (
    id                  BIGSERIAL PRIMARY KEY,
    email               VARCHAR(180) NOT NULL UNIQUE,
    email_normalized    VARCHAR(180) NOT NULL UNIQUE,
    mot_de_passe_hash   VARCHAR(255),
    nom                 VARCHAR(120) NOT NULL,
    prenom              VARCHAR(120) NOT NULL,
    telephone           VARCHAR(40),
    role                VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','ENSEIGNANT','ETUDIANT')),
    statut_compte       VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (statut_compte IN ('PENDING','ACTIVE','BLOCKED','PENDING_APPROVAL')),
    google_subject      VARCHAR(120) UNIQUE,
    photo_url           VARCHAR(500),
    locale              VARCHAR(10) DEFAULT 'fr',
    nb_tentatives_login INT NOT NULL DEFAULT 0,
    derniere_connexion  TIMESTAMPTZ,
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_modification   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_utilisateur_role ON utilisateur(role);
CREATE INDEX idx_utilisateur_statut ON utilisateur(statut_compte);

CREATE TABLE administrateur (
    id          BIGINT PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    fonction    VARCHAR(120)
);

CREATE TABLE enseignant (
    id              BIGINT PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    specialite      VARCHAR(160),
    bio             TEXT,
    date_validation TIMESTAMPTZ
);

CREATE TABLE etudiant (
    id                  BIGINT PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    groupe_classe_id    BIGINT REFERENCES groupe_classe(id) ON DELETE SET NULL,
    matricule           VARCHAR(40) UNIQUE,
    date_naissance      DATE
);

CREATE TABLE cours (
    id                BIGSERIAL PRIMARY KEY,
    titre             VARCHAR(200) NOT NULL,
    description       TEXT,
    enseignant_id     BIGINT NOT NULL REFERENCES enseignant(id) ON DELETE CASCADE,
    matiere_id        BIGINT REFERENCES matiere(id) ON DELETE SET NULL,
    statut            VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (statut IN ('DRAFT','PUBLISHED','ARCHIVED')),
    date_creation     TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_publication  TIMESTAMPTZ,
    nb_consultations  INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_cours_enseignant ON cours(enseignant_id);
CREATE INDEX idx_cours_statut ON cours(statut);

CREATE TABLE support_pedagogique (
    id              BIGSERIAL PRIMARY KEY,
    cours_id        BIGINT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
    titre           VARCHAR(200) NOT NULL,
    type_fichier    VARCHAR(20) NOT NULL CHECK (type_fichier IN ('PDF','MP4')),
    chemin_fichier  VARCHAR(500) NOT NULL,
    taille_octets   BIGINT NOT NULL,
    date_upload     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devoir (
    id                BIGSERIAL PRIMARY KEY,
    cours_id          BIGINT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
    titre             VARCHAR(200) NOT NULL,
    consigne          TEXT,
    difficulte        VARCHAR(20) NOT NULL DEFAULT 'MOYEN' CHECK (difficulte IN ('FACILE','MOYEN','DIFFICILE')),
    date_debut        TIMESTAMPTZ NOT NULL,
    date_fin          TIMESTAMPTZ NOT NULL,
    fichier_consigne  VARCHAR(500),
    note_max          NUMERIC(4,2) NOT NULL DEFAULT 20.00,
    date_creation     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_devoir_cours ON devoir(cours_id);
CREATE INDEX idx_devoir_dates ON devoir(date_debut, date_fin);

CREATE TABLE soumission (
    id              BIGSERIAL PRIMARY KEY,
    devoir_id       BIGINT NOT NULL REFERENCES devoir(id) ON DELETE CASCADE,
    etudiant_id     BIGINT NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE,
    contenu_texte   TEXT,
    chemin_fichier  VARCHAR(500),
    statut          VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (statut IN ('DRAFT','SUBMITTED','GRADED','LATE')),
    note            NUMERIC(4,2),
    commentaire     TEXT,
    date_soumission TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_notation   TIMESTAMPTZ,
    UNIQUE (devoir_id, etudiant_id)
);
CREATE INDEX idx_soumission_etudiant ON soumission(etudiant_id);
CREATE INDEX idx_soumission_statut ON soumission(statut);

CREATE TABLE inscription (
    id              BIGSERIAL PRIMARY KEY,
    etudiant_id     BIGINT NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE,
    cours_id        BIGINT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
    date_inscription TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (etudiant_id, cours_id)
);

CREATE TABLE affectation_cours (
    id              BIGSERIAL PRIMARY KEY,
    cours_id        BIGINT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
    groupe_classe_id BIGINT NOT NULL REFERENCES groupe_classe(id) ON DELETE CASCADE,
    date_affectation TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cours_id, groupe_classe_id)
);

CREATE TABLE analyse_ia (
    id              BIGSERIAL PRIMARY KEY,
    cours_id        BIGINT NOT NULL REFERENCES cours(id) ON DELETE CASCADE,
    enseignant_id   BIGINT NOT NULL REFERENCES enseignant(id) ON DELETE CASCADE,
    date_analyse    TIMESTAMPTZ NOT NULL DEFAULT now(),
    fallback_used   BOOLEAN NOT NULL DEFAULT FALSE,
    raw_response    TEXT,
    summary         TEXT
);
CREATE INDEX idx_analyse_cours ON analyse_ia(cours_id);

CREATE TABLE prediction_risque (
    id              BIGSERIAL PRIMARY KEY,
    analyse_id      BIGINT NOT NULL REFERENCES analyse_ia(id) ON DELETE CASCADE,
    etudiant_id     BIGINT NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE,
    niveau_risque   VARCHAR(20) NOT NULL CHECK (niveau_risque IN ('FAIBLE','MODERE','ELEVE')),
    score           NUMERIC(5,2),
    justification   TEXT
);

CREATE TABLE recommandation (
    id              BIGSERIAL PRIMARY KEY,
    prediction_id   BIGINT NOT NULL REFERENCES prediction_risque(id) ON DELETE CASCADE,
    contenu         TEXT NOT NULL,
    ordre           INT NOT NULL DEFAULT 0
);

CREATE TABLE notification (
    id              BIGSERIAL PRIMARY KEY,
    utilisateur_id  BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    titre           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    lu              BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_user ON notification(utilisateur_id);

CREATE TABLE demande_changement_classe (
    id                  BIGSERIAL PRIMARY KEY,
    etudiant_id         BIGINT NOT NULL REFERENCES etudiant(id) ON DELETE CASCADE,
    classe_actuelle_id  BIGINT REFERENCES groupe_classe(id) ON DELETE SET NULL,
    classe_souhaitee_id BIGINT NOT NULL REFERENCES groupe_classe(id) ON DELETE CASCADE,
    motif               TEXT,
    statut              VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (statut IN ('PENDING','APPROVED','REJECTED')),
    date_demande        TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_decision       TIMESTAMPTZ
);

-- Auth supporting tables
CREATE TABLE otp_code (
    id              BIGSERIAL PRIMARY KEY,
    utilisateur_id  BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    code_hash       VARCHAR(255) NOT NULL,
    purpose         VARCHAR(30) NOT NULL CHECK (purpose IN ('ACCOUNT_VERIFY','PASSWORD_RESET')),
    attempts        INT NOT NULL DEFAULT 0,
    max_attempts    INT NOT NULL DEFAULT 5,
    expires_at      TIMESTAMPTZ NOT NULL,
    consumed_at     TIMESTAMPTZ,
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_user_purpose ON otp_code(utilisateur_id, purpose);

CREATE TABLE refresh_token (
    id              BIGSERIAL PRIMARY KEY,
    utilisateur_id  BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_user ON refresh_token(utilisateur_id);
