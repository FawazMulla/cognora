# Cognora — Academic Learning OS & Visual Intelligence Platform

Cognora is an AI-powered academic operating system and learning companion tailored for higher education curricula. Grounded in authoritative university syllabi, Cognora transforms academic coursework into structured visual maps, interactive conceptual visualizers, Topper-standard model answers, spaced-repetition revision queues, and oral viva exam defense simulations.

---

## 1. High-Level Architecture

Cognora is structured as a high-performance modern monorepo separating client presentation from backend processing and intelligence services:

```mermaid
graph TD
    Client["Cognora Web Frontend (React + Vite + Tailwind)"] --> Router["API Gateway / Next.js Middleware"]
    Router --> AuthSession["Auth Session Cache (60s TTL)"]
    Router --> Endpoints["API Route Handlers"]
    Endpoints --> CIC["Cognora Intelligence Core (CIC)"]
    Endpoints --> Drizzle["Drizzle ORM (Singleton Pool, max:3)"]
    Drizzle --> Supabase[("Supabase PostgreSQL + pgvector")]
    CIC --> HybridRouter["Hybrid Router (Deterministic Cache)"]
    HybridRouter --> OCI["Oracle Cloud Infrastructure (OCI GenAI)"]
    HybridRouter --> GeminiCohere["Gemini 1.5 Flash / Cohere Command R+"]
```

### Core Architecture Components

- **Visual Learning Atlas:** Three-level hierarchical academic navigation (Subject Explorer $\to$ Visual Map $\to$ Topic Workspace) mapped to official Mumbai University Semester VII curricula, containing 58 curated video lectures, 6 concept visualizers, and interactive mastery calculations.
- **Cognora Intelligence Core (CIC):** RAG and semantic retrieval pipeline with Reciprocal Rank Fusion (RRF), factual groundedness checks, and mark-scheme compliance verification.
- **Structured Answer Studio:** Produces examination-ready model answers calibrated strictly by mark weightage (2 Marks, 5 Marks, 10 Marks, 15 Marks) with ASCII architectural schematics and LaTeX mathematical derivations.
- **Digital Academic Twin:** Continuously evolving cognitive model of student learning behaviors, retention decay curves, and exam grade predictions.
- **Smart Revision Engine:** SuperMemo-2 (SM-2) algorithm-driven spaced repetition flashcard system with subject deck organization.

---

## 2. Monorepo Organization

```
cognora/
├── apps/
│   ├── web/                     # React 18 SPA (Vite, Tailwind, React Router, React.lazy)
│   │   ├── src/
│   │   │   ├── components/      # UI components, visualizers, command palette, focus mode
│   │   │   ├── context/         # Auth, Preferences (Theme, Density, Language)
│   │   │   ├── data/            # Static syllabus catalogues (atlasCatalogue, quickPicks)
│   │   │   ├── lib/             # API client, export engine (PDF/DOCX), hybrid router
│   │   │   └── pages/           # 20 lazy-loaded page route views
│   │   └── vite.config.ts       # Code splitting, vendor chunking, Rolldown config
│   │
│   └── api/                     # Next.js 14 API Backend
│       ├── src/
│       │   ├── app/api/         # REST API route handlers
│       │   ├── db/              # Drizzle ORM schema, migrations, singleton pool
│       │   ├── lib/             # AI gateway, CIC retrieval engine, deterministic cache
│       │   ├── middleware.ts    # In-memory auth session cache, CORS, Server-Timing
│       │   └── workers/         # Background processing pipelines
│       └── vitest.config.ts     # Automated unit & integration test runner
```

---

## 3. Quick Start & Local Setup

### Prerequisites
- **Node.js:** `>= 20.0.0` (LTS recommended)
- **Package Manager:** `pnpm >= 9.0.0`
- **PostgreSQL Database:** Supabase or compatible PostgreSQL with `pgvector` extension

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/FawazMulla/cognora.git
   cd cognora
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure Environment Variables (see [Environment Variables](#4-environment-variables-reference)).

4. Start development servers:
   ```bash
   # Start API server (port 3001)
   pnpm --filter api dev

   # In a separate terminal, start Web server (port 3002)
   pnpm --filter web dev
   ```

5. Open [http://localhost:3002](http://localhost:3002) in your browser.

---

## 4. Environment Variables Reference

Create `.env` in `apps/api/` and `apps/web/.env`:

### `apps/api/.env`
```ini
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database Connection (Postgres singleton pool)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# AI Provider Configurations (Optional / BYOK)
GEMINI_API_KEY=your-gemini-api-key
COHERE_API_KEY=your-cohere-api-key

# Oracle Cloud Infrastructure (OCI GenAI)
OCI_REGION=us-chicago-1
OCI_TENANCY_ID=ocid1.tenancy.oc1..your-tenancy-id
OCI_USER_ID=ocid1.user.oc1..your-user-id
OCI_FINGERPRINT=your-fingerprint
OCI_PRIVATE_KEY_PATH=/path/to/oci_api_key.pem
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-compartment-id
```

### `apps/web/.env`
```ini
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Security Note:** Never commit `.env` files, private keys, or credentials to version control.

---

## 5. API Architecture & Performance

### Authenticated Request Flow
1. **Middleware Fast-Path:** Validates JWT access token. Verified tokens and their database user ID mappings are cached in memory for 60 seconds (`authSessionCache`), skipping remote auth and database roundtrips on concurrent calls.
2. **Server-Timing Header:** Emits `Server-Timing: total;dur={ms}` for distributed tracing.
3. **Connection Safety:** The backend communicates via a Drizzle ORM singleton connection pool (`max: 3`, `idle_timeout: 10`) to respect Supabase transaction limits.

### Core Endpoints

| Endpoint | Method | Description | Cache Policy |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | System uptime, Node memory usage (RSS, heap) | No cache |
| `/api/atlas/subjects` | `GET` | Full Mumbai University syllabus metadata | `public, max-age=3600` |
| `/api/atlas/topic?id={id}` | `GET` | Module topic details, videos, visualizers | `public, max-age=3600` |
| `/api/answers/generate` | `POST` | Generates 2M/5M/10M/15M topper answers | Hybrid router |
| `/api/intelligence/ask` | `POST` | Grounded CIC answer with citations & verification | Deterministic cache |
| `/api/bookmarks` | `GET/POST`| Personal academic vault and annotations | User private |
| `/api/student-twin/full-profile` | `GET` | Cognitive readiness radar & grade predictions | User private |

---

## 6. Frontend Performance & Code Splitting

- **Initial Entry Size:** **152.20 kB** (89.4% reduction from monolithic 1.43 MB bundle).
- **Route-Level Splitting:** All 20 application routes are dynamically imported via `React.lazy()` with `<PageLoader>` fallback.
- **Vendor Splitting:** Third-party packages (`vendor-react`, `vendor-supabase`) are isolated into independent, long-term cached bundles.
- **In-Flight Deduplication:** The client-side `fetchApi` utility merges concurrent identical GET requests into a single in-flight Promise.
- **Export Engine On-Demand:** The heavy document export suite (docx, pdf) is only loaded when an export action is triggered.

---

## 7. Testing & Quality Verification

```bash
# Run unit tests (Vitest)
pnpm --filter api test

# Run TypeScript typecheck
pnpm --filter api typecheck

# Run linter (oxlint)
pnpm --filter web lint

# Build production assets
pnpm --filter web build
pnpm --filter api build
```

---

## 8. Deployment Guidelines

### Frontend (Render, Vercel, Netlify)
- **Root Directory:** `apps/web`
- **Build Command:** `pnpm build`
- **Output Directory:** `dist`
- **SPA Rewrites:** Ensure all routes redirect to `/index.html`.

### Backend (Render, Railway, Cloud Run)
- **Root Directory:** `apps/api`
- **Build Command:** `pnpm build`
- **Start Command:** `pnpm start`
- **Environment Variables:** Provide all required variables listed above.

---

## 9. Troubleshooting & FAQ

- **Model 404 Error:** Ensure `GEMINI_API_KEY` targets `gemini-1.5-flash` or `gemini-2.0-flash` (do not use experimental unreleased model tags).
- **Connection Timeout on Local Dev:** Verify the API dev server is running on port 3001. The web Vite proxy forwards all `/api/*` calls from port 3002 to 3001.
- **Database Connection Exhaustion:** The backend is configured with `max: 3` connections. Do not instantiate multiple `postgres()` connection pools in route handlers; always import `db` from `@/db`.
