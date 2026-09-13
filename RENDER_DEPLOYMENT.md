# Deploying Cognora on Render

This project is configured as a monorepo containing:
1. **Frontend**: Vite + React 19 SPA (`apps/web`) &rarr; Deployed as a **Static Site** on Render.
2. **Backend API**: Next.js 14 API (`apps/api`) &rarr; Deployed as a **Web Service** on Render.

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
6. Click **Apply**. Render will build and deploy both the backend API and frontend static site.

---

## Option 2: Manual Deployment via Render Dashboard

If you prefer to configure the services manually in the Render dashboard:

### Service 1: Backend API (`cognora-api`)

1. In Render Dashboard, click **New +** &rarr; **Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `cognora-api`
   - **Language / Runtime**: `Node`
   - **Root Directory**: leave blank (monorepo root)
   - **Build Command**:
     ```bash
     pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api run build
     ```
   - **Start Command**:
     ```bash
     pnpm --filter @workspace/api run start
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
5. Click **Create Web Service**. Note your API service URL (e.g. `https://cognora-api.onrender.com`).

---

### Service 2: Frontend Web App (`cognora-web`)

1. In Render Dashboard, click **New +** &rarr; **Static Site**.
2. Connect your Git repository.
3. Configure the following settings:
   - **Name**: `cognora-web`
   - **Root Directory**: leave blank (monorepo root)
   - **Build Command**:
     ```bash
     pnpm install --no-frozen-lockfile && pnpm --filter web run build
     ```
   - **Publish Directory**:
     ```bash
     apps/web/dist
     ```
4. **SPA Redirects / Rewrites** (under **Redirects/Rewrites** tab):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Add the following **Environment Variables**:
   - `VITE_API_URL` = `https://cognora-api.onrender.com` (your backend URL from step 1)
   - `VITE_SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-supabase-anon-key>`
   - `VITE_AI_PROVIDER` = `cohere`
   - `VITE_COHERE_API_KEY` = `<your-cohere-api-key>`
6. Click **Create Static Site**.

---

## Verification
Both `apps/api` (Next.js) and `apps/web` (Vite) build cleanly with **0 errors**.
