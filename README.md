# Dev Hub

A personal, private dashboard for organizing all your dev tools, repos, docs, and links — organized in tiles and categories.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, Prisma 7, NextAuth.js, and Cloudflare R2.

---

## Setup Guide

### 1. Neon (PostgreSQL) 🔑 Action required

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project (pick the region closest to your Vercel deployment region)
3. Go to **Dashboard → Connection Details**
4. Copy:
   - **Pooled connection** string → `DATABASE_URL` (used by the app at runtime via pgBouncer)
   - **Direct connection** string → `DIRECT_URL` (used by Prisma migrations)

> The pooled connection string has `?pgbouncer=true` appended — this is important for Prisma to work correctly with serverless environments.

### 2. Cloudflare R2 🔑 Action required

1. Create a free account at [cloudflare.com](https://cloudflare.com)
2. Go to **R2 Object Storage → Create bucket** (name it e.g. `dev-hub-tiles`)
3. On the bucket, click **Settings → Public access → Allow Access** to get a `r2.dev` public URL
4. Go to **R2 → Manage R2 API Tokens → Create API Token**:
   - Permissions: **Object Read & Write**
   - Scope: the specific bucket you created
5. Copy:
   - `R2_ACCOUNT_ID` → Cloudflare dashboard right sidebar "Account ID"
   - `R2_ACCESS_KEY_ID` and `R2_SECRET_KEY` → from the API token
   - `R2_PUBLIC_URL` → the `r2.dev` URL shown on the bucket's public access settings page

### 3. Generate a NextAuth secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET`.

### 4. Local development

```bash
cp .env.example .env
# Fill in all values in .env

# Run DB migrations
npx prisma migrate dev --name init

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an account.

---

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env` in the Vercel project settings:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your production URL, e.g. `https://devhub.yourdomain.com`)
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL`
4. Deploy

After first deploy, run migrations against the production DB:

```bash
DATABASE_URL="your-direct-connection-string" npx prisma migrate deploy
```

Or add this as a Vercel build command: `prisma migrate deploy && next build`

---

## Project structure

```
dev-hub/
├── app/
│   ├── (auth)/          # Login & signup pages
│   ├── (dashboard)/     # Dashboard & account pages (auth-protected)
│   └── api/             # API routes (auth, categories, tiles, upload, account)
├── components/
│   ├── auth/            # LoginForm, SignupForm
│   ├── dashboard/       # Dashboard, Navbar, CategorySection, TileCard, modals
│   └── ui/              # Button, FormField, Modal, ThemeProvider, SessionProvider
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client (Neon adapter)
│   ├── r2.ts            # Cloudflare R2 helpers
│   ├── rate-limit.ts    # In-memory rate limiter
│   └── validations.ts   # Zod schemas
├── prisma/
│   └── schema.prisma    # Database schema
├── types/               # Shared TypeScript types
└── proxy.ts             # Route protection middleware
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon free tier) |
| ORM | Prisma 7 with Neon adapter |
| Auth | NextAuth.js (Credentials provider, JWT sessions) |
| Image storage | Cloudflare R2 (free tier) |
| Drag & drop | @dnd-kit |
| Deployment | Vercel (Hobby free tier) |
