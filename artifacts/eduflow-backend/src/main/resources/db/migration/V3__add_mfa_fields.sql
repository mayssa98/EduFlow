-- Ajout des champs pour la Double Authentification (2FA) sur la table utilisateur

ALTER TABLE utilisateur
ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN mfa_method VARCHAR(20),       -- 'TOTP', 'EMAIL', 'WEBAUTHN'
ADD COLUMN mfa_secret VARCHAR(255),      -- Secret pour TOTP ou clé publique
ADD COLUMN mfa_failed_attempts INT DEFAULT 0,
ADD COLUMN mfa_lockout_until TIMESTAMP WITH TIME ZONE;
