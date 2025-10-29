# Quickstart — Local development (Payload + Vercel Blob test)

This quickstart gets a developer running with Payload CMS, a local Postgres, and a Vercel Blob test configuration.

Prerequisites
- Node.js 18+
- Docker (for local Postgres)
- Yarn or npm

1) Start Postgres (docker)

```
docker run --rm --name gm-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=payload -p 5432:5432 -d postgres:15
```

2) Clone repo and install

```
cd c:\GitHub\GithubCatchMasterDelux2
npm install
cd client
npm install
```

3) Environment
Create `.env` files for Payload and Next dev. Example `.env.payload`:

```
PAYLOAD_SECRET=devsecret
DATABASE_URL=postgres://postgres:postgres@localhost:5432/payload
VERCEL_BLOB_TOKEN=dev-token-placeholder
VERCEL_BLOB_BUCKET=test-bucket
```

4) Run Payload locally

```
# from repo root (or the payload folder if created)
npx payload build && npx payload dev --local --env .env.payload
```

5) Test Vercel Blob integration
- Use the admin upload UI in Payload to upload a small image. Verify that the `mediaAssets` record is created and `providerUrl` points to Vercel Blob URL (or to a local mock when token is placeholder).

6) Run frontend

```
cd client
npm run dev
```

Notes
- For a real Vercel Blob test, create a Vercel service token and set `VERCEL_BLOB_TOKEN`. For CI, store secrets in the project secret store.
- To test Supabase fallback locally, optionally run a Supabase Docker or use a remote dev Supabase instance and set SUPABASE_URL/SUPABASE_ANON_KEY.
