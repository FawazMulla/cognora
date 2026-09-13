# Deploying Cognora on Render (Unified Monolith Service)

Cognora is configured to deploy as a **single unified monolith service** on Render:
- **1 Web Service**: Next.js API server handles all backend routes (`/api/*`) and serves the Vite React frontend SPA (`apps/web/dist`) for all pages (`/`, `/viva`, `/smart-revision`, etc.).
- **1 Port & 1 URL**: Zero CORS issues, instant same-origin routing, simplified environment variable management, and cost-effective single-service hosting.

---

## Option 1: One-Click Blueprint Deployment (Recommended)

1. Push your repository to **GitHub** or **GitLab**.
2. Go to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** &rarr; **Blueprint**.
4. Connect your repository. Render will automatically detect [`render.yaml`](./render.yaml).
5. Fill in the environment variable values when prompted:
   - `DATABASE_URL`: Your PostgreSQL / Supabase connection string
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `REDIS_URL`: Your Upstash / Redis connection string
   - `COHERE_API_KEY`: Your Cohere API key
   - `GOOGLE_AI_API_KEY`: (Optional) Your Google Gemini API key
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `VITE_COHERE_API_KEY`: (Optional) Your Cohere API key
   - `VITE_GEMINI_API_KEY`: (Optional) Your Google Gemini API key
6. Click **Apply**. Render will build the Vite SPA, bundle it into the Next.js static directory, and launch the unified monolith service.

---

## Option 2: Manual Deployment via Render Dashboard

If you prefer to configure the service manually in the Render dashboard:

### Unified Monolith Web Service (`cognora`)

1. In Render Dashboard, click **New +** &rarr; **Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `cognora`
   - **Language / Runtime**: `Node`
   - **Root Directory**: leave blank (monorepo root)
   - **Build Command**:
     ```bash
     pnpm install --no-frozen-lockfile && pnpm run build
     ```
   - **Start Command**:
     ```bash
     pnpm start
     ```
4. Add the following **Environment Variables**:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `postgresql://postgres:...@...supabase.co:5432/postgres`
   - `SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `SUPABASE_ANON_KEY` = `<your-supabase-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<your-supabase-service-role-key>`
   - `REDIS_URL` = `redis://...` (or Upstash Redis URL)
   - `NEXTAUTH_SECRET` = `<32+ character random string>`
   - `COHERE_API_KEY` = `<your-cohere-api-key>`
   - `GOOGLE_AI_API_KEY` = `<your-gemini-api-key>` (optional)
   - `VITE_SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-supabase-anon-key>`
   - `VITE_COHERE_API_KEY` = `<your-cohere-api-key>`
   - `VITE_GEMINI_API_KEY` = `<your-gemini-api-key>` (optional)
5. Click **Create Web Service**. Your unified app will be live at `https://cognora.onrender.com`.

---

## Verification
Running `pnpm run build` runs:
1. `pnpm --filter web run build` (Builds Vite React frontend into `apps/web/dist`)
2. `node scripts/copy-web-dist.mjs` (Copies frontend build into Next.js `apps/api/public`)
3. `pnpm --filter @workspace/api run build` (Builds Next.js API & catch-all static server)
