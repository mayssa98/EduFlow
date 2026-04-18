# EduFlow — Learning Management System

Système de gestion pédagogique pour l'enseignement supérieur.

## Architecture

| Couche | Technologie | Port |
|--------|------------|------|
| **Backend** | Spring Boot 3.3.5 + Java 17 | `8081` |
| **Frontend** | Angular 19 | `4200` |
| **Base de données** | PostgreSQL 18 | `5432` |

## Prérequis

- **Java** 17+ (testée avec OpenJDK 21)
- **Maven** 3.9+
- **Node.js** 18+ et **npm**
- **PostgreSQL** 15+

## Lancement rapide

### 1. Base de données

```sql
-- Se connecter à PostgreSQL et créer la base
CREATE DATABASE eduflow OWNER postgres ENCODING 'UTF8';
```

> Les tables sont créées automatiquement par Flyway au démarrage du backend.

### 2. Backend (Spring Boot)

```bash
cd artifacts/eduflow-backend
mvn spring-boot:run
```

Le backend démarre sur `http://localhost:8081/api`

- Swagger UI : `http://localhost:8081/api/swagger-ui.html`
- Health check : `http://localhost:8081/api/health`

### 3. Frontend (Angular)

```bash
cd artifacts/eduflow-ng
npm install
npm start
```

Le frontend démarre sur `http://localhost:4200`

## Compte Admin par défaut

| Champ | Valeur |
|-------|--------|
| Email | `admin@eduflow.com` |
| Mot de passe | `Admin@EduFlow2026` |

## Configuration

La configuration principale est dans `artifacts/eduflow-backend/src/main/resources/application.yml`.

Les valeurs par défaut fonctionnent en local sans variables d'environnement. Pour la production, surcharger via variables d'environnement :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PGHOST` | Hôte PostgreSQL | `localhost` |
| `PGPORT` | Port PostgreSQL | `5432` |
| `PGDATABASE` | Nom base de données | `eduflow` |
| `PGUSER` | Utilisateur PostgreSQL | `postgres` |
| `PGPASSWORD` | Mot de passe PostgreSQL | `eduflow2026` |
| `JWT_SECRET` | Clé JWT access (≥32 bytes) | clé dev locale |
| `JWT_REFRESH_SECRET` | Clé JWT refresh (≥32 bytes) | clé dev locale |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | *(vide)* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | *(vide)* |
| `RESEND_API_KEY` | Clé API Resend (emails) | *(mode dev: log only)* |
| `GEMINI_API_KEY` | Clé API Google Gemini (IA) | *(vide)* |

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` — Inscription (ETUDIANT ou ENSEIGNANT)
- `POST /verify-otp` — Vérification du code OTP
- `POST /login` — Connexion email + mot de passe
- `POST /google` — Connexion Google OAuth
- `GET /google/config` — Config OAuth pour le frontend
- `POST /refresh` — Rafraîchir le token JWT
- `POST /logout` — Déconnexion
- `POST /forgot-password` — Demander un code de reset
- `POST /reset-password` — Réinitialiser le mot de passe
- `GET /me` — Utilisateur actuel

### Admin (`/api/admin`) — rôle ADMIN requis
- `GET /users` — Lister les utilisateurs
- `POST /users` — Créer un utilisateur
- `PATCH /users/:id/block` — Bloquer
- `PATCH /users/:id/unblock` — Débloquer
- `DELETE /users/:id` — Supprimer
- `GET /approvals` — Enseignants en attente
- `PATCH /approvals/:id` — Approuver/Rejeter
- `GET /stats/overview` — Statistiques

### Cours (`/api/cours`) — authentifié
### Devoirs (`/api/devoirs`) — authentifié
### Analyse IA (`/api/ai`) — ENSEIGNANT

## Structure du projet

```
├── artifacts/
│   ├── eduflow-backend/       ← Spring Boot (API REST)
│   │   ├── pom.xml
│   │   └── src/main/java/com/eduflow/
│   │       ├── config/        ← Configuration
│   │       ├── controller/    ← Contrôleurs REST
│   │       ├── service/       ← Logique métier
│   │       ├── security/      ← JWT, filtres, CORS
│   │       ├── model/         ← Entités, DTOs, Repositories
│   │       └── exception/     ← Exceptions custom
│   │
│   └── eduflow-ng/            ← Angular 19 (SPA)
│       ├── angular.json
│       ├── package.json
│       └── src/app/
│           ├── core/          ← Services, guards, interceptors
│           ├── features/      ← Pages (auth, admin, teacher, student)
│           ├── shared/        ← Composants réutilisables
│           └── layouts/       ← Layout authentifié
│
└── .gitignore
```
