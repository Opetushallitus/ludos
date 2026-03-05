# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LUDOS is a Finnish educational examination system ("Luokkahuoneen Digitaalinen Oppimisympäristö Sovellus") for creating and managing exam content for three exam types: SUKO, LD (Lukutaito Digitaalinen), and PUHVI. The system allows teachers to create assignments (exam questions), instructions, and certificates.

**Architecture**: Full-stack web application with React frontend, Kotlin/Spring Boot backend, PostgreSQL database, and AWS infrastructure.

**Key Entities**:
- **Assignment** (koetehtava) - Exam questions with three specialized types (suko_assignment, ld_assignment, puhvi_assignment)
- **Instruction** (ohje) - Support materials and instructions, also specialized by exam type
- **Certificate** (todistus) - Exam certificates
- All content is bilingual (Finnish/Swedish) and supports versioning

## Common Commands

### Local Development Setup

Quick start (requires tmux):
```bash
./start-local.sh   # Launches 4 panes: PostgreSQL, frontend dev, backend, frontend watch
```

Or manually:
```bash
# Terminal 1: Start PostgreSQL
docker compose up

# Terminal 2: Start backend (requires server/.env)
SPRING_PROFILES_ACTIVE=local ./server/gradlew bootRun

# Terminal 3: Start frontend dev server
cd web && npm run dev
```

### Environment Variables & Secrets

Before running locally, fetch secrets from AWS:
```bash
aws --profile oph-ludos-dev sso login
aws --profile oph-ludos-utility sso login
scripts/fetch_secrets.sh   # Creates server/.env and playwright/.env
```

### Frontend

```bash
cd web
npm ci                  # Install dependencies
npm run dev            # Dev server at http://localhost:8000
npm run lint           # TypeScript check + Biome lint
npm run lint:fix       # Auto-fix with Biome
```

### Backend Tests

```bash
yarn test:server
# or
cd server && ./gradlew test --rerun-tasks
```

### E2E Testing

Playwright tests run inside Docker (base URL is hardcoded to `ludos-server:8080`).
Requires AWS SSO login (`aws --profile oph-ludos-dev sso login`) before running.

```bash
./run-tests.sh          # Run all E2E + server tests
./run-tests.sh --ui     # UI mode at http://127.0.0.1:9876/
```

### Localization & Code Lists

```bash
scripts/update_backups.sh   # Update backup data (also runs via git push hook)
yarn localizations          # Manage localizations (see help for examples)
```

## Key Architectural Decisions

1. **Exam type inheritance**: Database uses PostgreSQL table inheritance (assignment -> suko_assignment/ld_assignment/puhvi_assignment). Same pattern for instructions and certificates.
2. **Bilingual content**: All content has `_fi` and `_sv` fields.
3. **Publish states**: Content can be DRAFT, PUBLISHED, or ARCHIVED.
4. **clock_timestamp()**: Content tables use clock_timestamp() instead of now() for created_at/updated_at to ensure accurate timestamps even within long transactions.
5. **Flyway migrations**: In `server/src/main/resources/db/migration/`. Never edit existing migrations; create new ones with next version number.
6. **Frontend build output**: Vite bundles to `server/src/main/resources/static/` where Spring Boot serves it. Use port 8000 (Vite dev server) during development for hot reload.

## External Service Integrations

**Koodistopalvelu** (Code List Service): Provides enumeration values (exam types, grade levels, subjects). Backend proxies requests to avoid CORS. Backup data in `server/src/main/resources/backup_data/`.

**Lokalisointipalvelu** (Localization Service): Manages translations. Backup data cached similarly.

Both accessed via service account credentials in AWS Secrets Manager.

## Development Workflow Tips

1. **Never commit `.env` files** or credentials; use `scripts/fetch_secrets.sh`
2. **Git hooks**: `.githooks/` directory configured via `postinstall` script in package.json

## AI Agent Instructions

1. Always run lint fix when you have modified source code: `cd web && npm run lint:fix`

## Environment URLs

- `local` - http://localhost:8000 (Vite dev) / http://localhost:8080 (backend)
- `untuva` - https://ludos.untuvaopintopolku.fi/ (staging)
- `qa` - https://ludos.testiopintopolku.fi/ (QA)
- `prod` - https://ludos.opintopolku.fi/ (production)
- Mock login (local): http://localhost:8000/api/test/mocklogin/YLLAPITAJA

## Additional Resources

- Wiki: https://wiki.eduuni.fi/display/OPHPALV/LUDOS
- Technical docs: https://wiki.eduuni.fi/display/OPHPALV/LUDOS_tekninen+dokumentaatio
- Trivy security scans: https://trivy.util.yleiskayttoiset.opintopolku.fi/muut.html
