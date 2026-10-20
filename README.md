# Bizdir Admin

An authenticated TanStack Start workspace for the Bizdir PostgreSQL/PostGIS directory, with a live overview and searchable management screens. The `bizdir/` folder remains a separate reference client. This admin owns its Prisma schema, client, and server code.

## Local setup

Requires Node.js 22.12 or newer.

```sh
npm install --legacy-peer-deps
npm run db:generate
npm run dev
```

Open **http://localhost:3001**. Sign in with `ADMIN_PASSWORD` from `.env.local`. For a fresh checkout, copy `.env.example` to `.env.local`, set a strong administrator password and a persistent session signing secret, and configure the database URL.

The server loads `.env.local`, `.env`, `bizdir/.env.local`, and `bizdir/.env`, without replacing existing environment variables. This checkout can therefore use the reference client's existing database URL. Environment files are ignored by Git, and database access stays on the server. Restart the server after changing environment values.

## Directory management

| Area                    | Functionality                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Overview                | Live counts, recent places, pending listings/reviews, listing status, top cities, searches, and interactions                    |
| Places                  | Contact and address details, verification and publication status, city/locality, coordinates, primary category, and local names |
| Locations               | State → district → city → locality/landmark hierarchy, coordinates, aliases, and search radius                                  |
| Categories and services | Parent categories, service tags, aliases, category attributes, and local names                                                  |
| Attributes              | Yes/no, number, and choice attributes, options, aliases, and category assignments                                               |
| Place details           | Category tags, typed attribute values, media URLs, weekly opening hours, aliases, and date-specific closures                    |
| Community               | Users, review moderation, leads, creators, and ownership claims                                                                 |
| Commerce                | Business subscriptions and creator payouts                                                                                      |
| Activity                | Read-only search logs, clicks, search impressions, and lead status history                                                      |

All 22 editable application models support creation, updates, and confirmed deletion. Four audit/activity models remain read only. Lists provide search, status filtering where applicable, pagination, refresh, and readable references. Relationship selectors support name search and filter locality/option choices by their parent city/attribute.

Create reference locations and categories before adding places. New places require valid coordinates and a primary category. The place editor handles PostGIS coordinates and category assignments in one transaction. Use the Place details sections to add services, attributes, hours, media, and closures. Media entries accept hosted URLs; file upload/storage is not configured. Location boundary polygons and database views are not editable in this interface.

Review changes recalculate approved-review ratings. Approved ownership claims assign the claimant as the place owner. Booked leads require a booking value; commissions/payouts require the matching booking and guest confirmation. The database records lead status changes automatically. Subscriptions cannot overlap according to the existing database exclusion constraint.

Updates load the current database record before checking dependent values. Parent edits reject cycles and invalid geographic levels. Generated IDs, timestamps, and place rating aggregates are protected. Existing foreign keys and database cascade rules govern deletions; the confirmation explains that linked records may also be removed.

## Schema maintenance

The checked-in schema was introspected from the configured database because the reference client's schema omitted application tables and fields. No database migrations, schema pushes, or seeds run automatically.

After an intentional schema change, introspect and regenerate locally:

```sh
npx prisma db pull
npm run db:generate
```

`db:generate` also regenerates the admin field catalog. New resource labels and navigation entries must be added explicitly when introducing tables. PostGIS system metadata and derived database views are excluded from management.

## Verification

```sh
npm test
npm run typecheck
npm run db:check
npm run test:db
npm run build
```

`db:check` reads directory counts. `test:db` creates isolated fixtures for every editable model, exercises updates/deletions and integrity rules, then rolls back the transaction. Test rows do not persist; PostgreSQL identity sequences can advance.

For HTTP verification, start the built app with `PORT=3011 npm start`, then run `npm run check:smoke` in another terminal. Set `ADMIN_TEST_URL` to test another local port. The smoke suite signs in, reads all 26 resources, checks filters and invalid requests, and signs out without saving database records. It reads the local password without printing it.

## Access and deployment

Authentication uses a shared administrator password, separate from public Bizdir user authentication. Signed HTTP-only same-site sessions expire after eight hours. Sign-in and mutations check the request origin, and sign-in attempts are limited in process.

Deploy to Node.js with access to PostgreSQL/PostGIS. Configure HTTPS, a strong `ADMIN_PASSWORD`, and a persistent `ADMIN_SESSION_SECRET`. Multiple instances should use infrastructure-level rate limiting. Build with `npm run build` and serve with `npm start`; set `PORT` as appropriate for the host.

The starter has an older Zod adapter peer declaration; `--legacy-peer-deps` accommodates that existing dependency conflict during installation.
