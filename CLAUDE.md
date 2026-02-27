# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LUDOS is a Finnish educational examination system ("Luokkahuoneen Digitaalinen Oppimisympäristö Sovellus") for creating and managing exam content for three exam types: SUKO, LD (Lukutaito Digitaalinen), and PUHVI. The system allows teachers to create assignments (exam questions), instructions, and certificates.

**Architecture**: Full-stack web application with React frontend, Kotlin/Spring Boot backend, PostgreSQL database, and AWS infrastructure.

**Key Entities**:
- **Assignment** (koetehtävä) - Exam questions with three specialized types (suko_assignment, ld_assignment, puhvi_assignment)
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
cd web && npm run dev    # Runs at http://localhost:8000
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
npm run build          # Production build
npm run watch          # Watch mode for continuous builds
npm run lint           # TypeScript check + Biome lint
npm run lint:fix       # Auto-fix with Biome
```

### Backend

Run via IDE (recommended):
1. Create Spring Boot run configuration for `LudosApplication.kt`
2. Set working directory to `server`
3. Set active profiles: `local`
4. Set environment variables from `server/.env`

Run via CLI:
```bash
# From project root
SPRING_PROFILES_ACTIVE=local ./server/gradlew bootRun

# Backend tests
yarn test:server
# or
cd server && ./gradlew test --rerun-tasks
```

### Database

PostgreSQL runs in Docker:
```bash
docker compose up    # Port 5432, user/password: oph/oph, database: ludos
```

**Migrations**: Flyway migrations in `server/src/main/resources/db/migration/V{number}__{description}.sql`. Applied automatically on startup.

### Testing

E2E tests (Playwright) run inside Docker (base URL is hardcoded to `ludos-server:8080`).
Requires AWS SSO login (`aws --profile oph-ludos-dev sso login`) before running.

```bash
# Run all tests (builds playwright Docker image, then runs all E2E + server tests)
./run-tests.sh

# Results in: playwright-results/playwright-report/
```

UI mode (select and run individual tests via browser):
```bash
./run-tests.sh --ui
# Opens http://127.0.0.1:9876/ in browser
```

### Building & Docker

Local Docker build (with watch support):
```bash
yarn build:docker:local
yarn run:docker
```

Production Docker build:
```bash
yarn build:docker   # Multi-stage: Node for frontend, Gradle for backend, Corretto runtime
```

Publish to AWS ECR:
```bash
yarn ecr:login
yarn ecr:publish
```

### Dependency Updates

Backend (Gradle):
```bash
cd server
./gradlew refreshVersions   # Check for updates (adds comments to versions.properties)
# Edit versions.properties manually
./gradlew clean test --rerun-tasks
```

Frontend (npm):
```bash
cd web
npm upgrade --latest
cd .. && yarn playwright   # Run tests after updates
```

### Localization & Code Lists

Update backup data from external services (runs automatically via git push hook):
```bash
scripts/update_backups.sh
```

Manage localizations:
```bash
yarn localizations   # See help and examples
```

## Architecture & Code Organization

### Backend Structure

**Package organization** (`server/src/main/kotlin/fi/oph/ludos/`):
- `assignment/` - Assignment (exam question) CRUD, filtering, favorites
- `auth/` - CAS authentication integration
- `certificate/` - Certificate generation (PDF with QR codes)
- `instruction/` - Instructions and support materials
- `image/` - Image upload to S3 and processing
- `koodisto/` - Integration with external code list service (Koodistopalvelu)
- `localization/` - Integration with external localization service
- `repository/` - JPA repositories for database access
- `config/` - Spring configuration, security, CORS, session management

**Key patterns**:
1. **Exam type inheritance**: Database uses PostgreSQL table inheritance (assignment → suko_assignment/ld_assignment/puhvi_assignment)
2. **Bilingual content**: All content has `_fi` and `_sv` fields
3. **Publish states**: Content can be DRAFT, PUBLISHED, or ARCHIVED
4. **Content versioning**: System tracks versions with author/updater OIDs and timestamps

**Controllers** follow RESTful conventions:
- `/api/assignment/*` - Assignment endpoints
- `/api/instruction/*` - Instruction endpoints
- `/api/certificate/*` - Certificate endpoints
- `/api/koodisto/*` - Code list proxy
- `/api/localization/*` - Localization proxy

**Authentication**: CAS-based SSO with session storage in PostgreSQL (spring_session tables). Mock login available at `/api/test/mocklogin/{ROLE}` for local development.

### Frontend Structure

**Location**: `web/src/`

**Key technologies**:
- **React Router DOM 7** for routing
- **TanStack React Query** for server state management
- **React Hook Form + Zod** for forms and validation
- **Tiptap** for rich text editing
- **Tailwind CSS** for styling
- **i18next** for internationalization

**Component organization**:
- `components/` - Reusable React components organized by feature
- `contexts/` - React contexts for global state
- `hooks/` - Custom React hooks
- `utils/` - Utility functions
- `request.ts` - API client (fetch wrapper)
- `types.ts` - TypeScript type definitions

**Build**: Vite bundles the frontend, output goes to `server/src/main/resources/static/` where Spring Boot serves it.

**Important note**: When developing frontend, use port 8000 (Vite dev server) for hot reload. Port 8080 serves pre-built assets and requires manual `yarn build:web` after changes.

### Database Schema

**Core tables**:
- `assignment` (parent table)
  - `suko_assignment` (inherits from assignment)
  - `ld_assignment` (inherits from assignment)
  - `puhvi_assignment` (inherits from assignment)
- `instruction` (parent table)
  - `suko_instruction`, `ld_instruction`, `puhvi_instruction`
- `certificate` (similar inheritance pattern)
- `assignment_favorite`, `favorite_folder` - User favorites
- `spring_session*` - Session management tables

**Important**: Content tables use clock_timestamp() instead of now() for created_at/updated_at to ensure accurate timestamps even within long transactions.

### AWS Infrastructure

Managed via AWS CDK (TypeScript in `infra/`):
- **ECS Fargate** - Containerized Spring Boot application
- **RDS PostgreSQL 15** - Managed database
- **S3** - File storage for images and attachments
- **CloudFront** - CDN for static assets
- **Application Load Balancer** - Traffic routing
- **CloudWatch Logs** - Centralized logging

**Environments**:
- `local` - http://localhost:8080 (or http://localhost:8000 for Vite dev)
- `untuva` - https://ludos.untuvaopintopolku.fi/ (staging)
- `qa` - https://ludos.testiopintopolku.fi/ (QA)
- `prod` - https://ludos.opintopolku.fi/ (production)

### External Service Integrations

**Koodistopalvelu** (Code List Service):
- Provides enumeration values (exam types, grade levels, subjects, etc.)
- Backend proxies requests to avoid CORS issues
- Backup data cached in `server/src/main/resources/backup_data/`

**Lokalisointipalvelu** (Localization Service):
- Manages translations for the application
- Backup data cached similarly to koodisto data

Both services are accessed via service account credentials stored in AWS Secrets Manager.

## Development Workflow Tips

1. **Profile selection**: Always set `SPRING_PROFILES_ACTIVE=local` when running backend locally
2. **Port management**: Frontend dev (8000) vs backend (8080) - use 8000 during development
3. **Database migrations**: Never edit existing migrations; create new ones with next version number
4. **Testing**: Run playwright tests after significant changes, especially to API contracts
5. **Secrets**: Never commit `.env` files or credentials; use `scripts/fetch_secrets.sh`
6. **Git hooks**: `.githooks/` directory is configured via `postinstall` script in package.json
7. **Multi-stage builds**: Production Docker uses separate stages for web build, server build, and runtime

## AI Agent instructions

1. **Always run lint fix when you have modified source code, e.g. npm run lint:fix

## Useful Local URLs

- Frontend (dev): http://localhost:8000
- Backend API: http://localhost:8080/api
- Mock login (admin): http://localhost:8000/api/test/mocklogin/YLLAPITAJA
- PostgreSQL: localhost:5432 (user: oph, password: oph, database: ludos)

## Additional Resources

- Wiki: https://wiki.eduuni.fi/display/OPHPALV/LUDOS
- Technical docs: https://wiki.eduuni.fi/display/OPHPALV/LUDOS_tekninen+dokumentaatio
- Trivy security scans: https://trivy.util.yleiskayttoiset.opintopolku.fi/muut.html
