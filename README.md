# URL Shortener

A small project to learn backend scaling from start to finish, one idea per step.

```
POST /shorten  { "url": "https://example.com/very/long/link" }  →  { "code": "aB3x9" }
GET  /aB3x9    →  redirects to the long URL
```

## Roadmap

**Progress: 3 / 11** `███░░░░░░░░` — ✅ done · 🚧 in progress · ⬜ not started

Think of the app as a **coat check**: you hand in a long link (the coat), get a short code (the ticket), and the ticket gets you the coat back.

| # | Status | Build | New idea | Coat check version | Done when |
|---|---|---|---|---|---|
| 1 | ✅ | Express + TypeScript, `POST /shorten`, `GET /:code`, data in a JS object, Next.js frontend | The basic API | One worker remembering tickets in his head | You can shorten a link and open it in the browser |
| 2 | ✅ | Swap the object for Postgres (Prisma, one `Link` table) | Data survives restarts | A filing cabinet | Restart the server and the link still works |
| 3 | ✅ | Docker Compose (app + Postgres) | Containers | The whole shop packed in boxes | `docker compose up` runs everything |
| 4 | 🚧 | Redis cache for `GET /:code` | Cache-aside | Sticky notes on the desk | The second open of a link doesn't touch Postgres |
| 5 | ⬜ | Rate limit on `/shorten`, stored in Redis | Shared limits | A bouncer | The 11th request in a minute gets 429 |
| 6 | ⬜ | 2 copies of the app + nginx | Horizontal scaling | More workers + a receptionist | Responses show different instance names |
| 7 | ⬜ | Count clicks with a queue + worker | Background jobs | A slip box emptied by a helper | Clicks reach the DB a moment later, redirects stay fast |
| 8 | ⬜ | `/health` + graceful shutdown | Production basics | "You okay?" + finish the customer before leaving | `docker compose stop` exits cleanly |
| 9 | ⬜ | `/metrics` + Prometheus + Grafana | Observability | A scoreboard on the wall | Requests/sec on a graph |
| 10 | ⬜ | Load test with k6 | Measuring | A fake crowd | You know the app's limit |
| 11 | ⬜ | Kubernetes | Desired state | A manager who rehires anyone who quits | Kill a pod, it comes back |

> **The big secret:** workers must remember nothing themselves (*stateless*). Steps 2, 4 and 5 move every bit of memory out of the app, so step 6 can just add more copies.

## Run

First time only:

```
cd backend
cp .env.example .env    # database connection string
npm install             # also generates the Prisma client
npm run db:up           # start Postgres in Docker (port 5433)
npm run db:migrate      # create the Link table
```

Then two terminals (run `npm run db:up` first if Docker was restarted):

```
cd backend
npm run dev      # API on http://localhost:4000, restarts on save
```

```
cd frontend
npm run dev      # Next.js on http://localhost:3000 — open this one
```

Next.js proxies `/api/*` and unknown paths like `/aB3x9k2` to the backend
(see `frontend/next.config.ts`), so the browser only ever talks to port 3000.

| Variable | Where | Default | Meaning |
|---|---|---|---|
| `PORT` | backend | `4000` | Port the API listens on |
| `DATABASE_URL` | backend `.env` | see `.env.example` | Where Postgres is |
| `BACKEND_URL` | frontend | `http://localhost:4000` | Where Next.js forwards API calls |

Handy: `npm run db:studio` opens Prisma Studio, a web page where you can see the rows in the `Link` table.
