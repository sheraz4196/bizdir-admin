# Bizdir Admin

Authenticated admin workspace for the Bizdir PostgreSQL/PostGIS directory. This release includes the live overview and **read-only** places, locations, categories/services, attributes, users, reviews, leads, and search/click activity. Lists include search, pagination, status filters, refresh, and record details. No record creation, editing, or deletion endpoints are exposed.

## Local setup

Requires Node.js 22.12 or newer.

```sh
npm install --legacy-peer-deps
npm run db:generate
npm run dev
```

Open http://localhost:3001. Configure `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `.env.local` using `.env.example`. If this checkout already has generated local credentials, retrieve the password from `.env.local`. Environment files are ignored by Git.

Database configuration loads from `.env.local`, `.env`, `bizdir/.env.local`, and `bizdir/.env`, without replacing existing environment variables. The reference client remains separate; the admin owns its Prisma schema and generated client. Database credentials stay on the server. No migrations or seed writes run automatically.

Authentication uses a shared administrator password, eight-hour signed HTTP-only same-site cookies, origin checks for sign-in/sign-out, and in-process login throttling. For deployment, configure HTTPS, a strong password, a persistent signing secret, and infrastructure rate limiting when running multiple instances.

## Verification and production

```sh
npm run typecheck
npm run db:check
npm run build
npm start
```

`db:check` only reads directory counts. Deploy to Node.js with access to the existing PostgreSQL/PostGIS database. The starter's pre-existing Zod peer declaration requires `--legacy-peer-deps` during npm installation.
