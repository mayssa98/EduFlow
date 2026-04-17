# EduFlow

Learning Management System (LMS) for higher education built as a pnpm monorepo with multiple artifacts.

## Architecture

- **Backend** (`artifacts/eduflow-backend/`) — Spring Boot 3.3.5 + Java 17 (compiled), running on Java 19 (GraalVM 22.3.1). PostgreSQL + Flyway. JWT auth via HttpOnly Secure SameSite=Strict cookies (15 min access / 7 day refresh). Roles: ADMIN / ENSEIGNANT / ETUDIANT. Served at `/api` on port 8082.
- **Canvas** (`artifacts/mockup-sandbox/`) — Vite component preview server (port 8081, path `/__mockup`).
- **Legacy** (`artifacts/api-server/`) — TypeScript Express artifact retained as the registration slot (its `.replit-artifact/artifact.toml` now launches the Spring Boot backend from `artifacts/eduflow-backend/`). The TS source is no longer used at runtime.

## Backend (Spring Boot)

- **Package**: `com.eduflow` with strict MVC layout (`controller`, `service`, `model.entity`, `model.repository`, `model.dto`, `security`, `config`).
- **Schema**: Flyway migration `V1__init_schema.sql` (17 domain tables + `otp_code` + `refresh_token`). Enum-style columns mapped via `@Enumerated(STRING)` + Postgres CHECK constraints (no native enum types).
- **Inheritance**: `Utilisateur` is `JOINED` abstract (no discriminator) with `Administrateur` / `Enseignant` / `Etudiant` subtype tables.
- **Auth endpoints**: `/api/auth/{register, verify-otp, login, google, refresh, logout, forgot-password, reset-password, me}`. OTP is BCrypt-hashed, single-active per user/purpose, 10-min expiry, 5-attempt cap. Passwords are BCrypt with the policy *≥8 chars, 1 uppercase, 1 digit, 1 special, no `+` in email*. After 5 failed logins the account is set to `BLOCKED`.
- **JWT secrets**: must be ≥32 bytes; the app fails to start otherwise (no silent padding).
- **Email**: Resend HTTP API. When `RESEND_API_KEY` is unset, the service logs delivery metadata only (never the OTP itself).
- **Google OAuth**: Authorization-code flow via `GoogleOAuthService` (server-side token exchange + userinfo). New OAuth users default to `ETUDIANT/ACTIVE`.
- **Admin seed**: `AdminSeeder` (CommandLineRunner) creates `admin@eduflow.com` (password from `ADMIN_DEFAULT_PASSWORD`, default `Admin@EduFlow2026`) on first boot if absent.

## Required environment variables

`PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE` (Replit Postgres), `JWT_SECRET` and `JWT_REFRESH_SECRET` (≥32 bytes each, auto-generated), `APP_BACKEND_PORT` (defaults to 8082), `APP_FRONTEND_ORIGIN` (CORS allowed origin). Optional: `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

## Workflows

- `artifacts/api-server: EduFlow Backend` — runs `mvn -q spring-boot:run` from `artifacts/eduflow-backend/`.
- `artifacts/mockup-sandbox: Component Preview Server` — Vite dev for the canvas.

## Tasks status

- **Task 1 — Backend foundation & auth**: ✅ DONE (this session).
- **Task 2 — Backend CRUD + AI**: pending.
- **Task 3 — Angular landing/auth**: pending.
- **Task 4 — Angular dashboards**: pending.
- **Task 5 — i18n + theme**: pending.
