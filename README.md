# URL Shortener

A small project to learn backend scaling from start to finish, one idea per step.

```
POST /shorten  { "url": "https://example.com/very/long/link" }  →  { "code": "aB3x9" }
GET  /aB3x9    →  redirects to the long URL
```

## Roadmap

**Progress: 6 / 11** `██████░░░░░` — ✅ done · 🚧 in progress · ⬜ not started

Think of the app as a **coat check**: you hand in a long link (the coat), get a short code (the ticket), and the ticket gets you the coat back.

| # | Status | Build | New idea | Coat check version | Done when |
|---|---|---|---|---|---|
| 1 | ✅ | Express + TypeScript, `POST /shorten`, `GET /:code`, data in a JS object, Next.js frontend | The basic API | One worker remembering tickets in his head | You can shorten a link and open it in the browser |
| 2 | ✅ | Swap the object for Postgres (Prisma, one `Link` table) | Data survives restarts | A filing cabinet | Restart the server and the link still works |
| 3 | ✅ | Docker Compose (app + Postgres) | Containers | The whole shop packed in boxes | `docker compose up` runs everything |
| 4 | ✅ | Redis cache for `GET /:code` | Cache-aside | Sticky notes on the desk | The second open of a link doesn't touch Postgres |
| 5 | ✅ | Rate limit on `/shorten`, stored in Redis | Shared limits | A bouncer | The 11th request in a minute gets 429 |
| 6 | ✅ | 2 copies of the app + nginx | Horizontal scaling | More workers + a receptionist | Responses show different instance names; rate limit sees each user's real IP |
| 7 | 🚧 | Count clicks with a queue + worker | Background jobs | A slip box emptied by a helper | Clicks reach the DB a moment later, redirects stay fast |
| 8 | ⬜ | `/health` + graceful shutdown | Production basics | "You okay?" + finish the customer before leaving | `docker compose stop` exits cleanly |
| 9 | ⬜ | `/metrics` + Prometheus + Grafana | Observability | A scoreboard on the wall | Requests/sec on a graph |
| 10 | ⬜ | Load test with k6 | Measuring | A fake crowd | You know the app's limit |
| 11 | ⬜ | Kubernetes | Desired state | A manager who rehires anyone who quits | Kill a pod, it comes back |

> **The big secret:** workers must remember nothing themselves (*stateless*). Steps 2, 4 and 5 move every bit of memory out of the app, so step 6 can just add more copies.

### Fixed in step 6
- ~~Rate limit can't see real user IPs~~: nginx now sets `X-Forwarded-For` and sends API traffic straight to the api (not through Next.js).
- ~~Port 4000 open, IP can be faked~~: only nginx (port 8080) is reachable; the api trusts just the last `X-Forwarded-For` entry, which nginx writes.
- On Windows/Docker Desktop, nginx still sees Docker's address (`172.x.x.1`) for every request from your laptop. On a real Linux server it sees each user's real IP.

## Run

```
docker compose up -d --build     # postgres, redis, migrate, 2× api, nginx
cd frontend
npm run dev                      # Next.js on :3000 (nginx forwards to it)
```

Open **http://localhost:8080**. nginx is the only way in:

```
localhost:8080 ─┬─ /aB3x9k2, /api/*  → api (2 copies, taking turns)
                └─ everything else   → Next.js on your laptop (:3000)
```

After rebuilding the api, if you get `502 Bad Gateway`: `docker compose restart nginx`.

| Variable | Where | Value | Meaning |
|---|---|---|---|
| `PORT` | api (compose) | `4000` | Port the API listens on inside Docker |
| `DATABASE_URL` | compose / `backend/.env` | `postgres:5432` in Docker, `localhost:5433` from your laptop | Where Postgres is |
| `REDIS_URL` | compose / `backend/.env` | `redis:6379` in Docker, `localhost:6379` from your laptop | Where Redis is |

`backend/.env` is only for running tools from your laptop, like `npm run db:migrate` or `npm run db:studio` (a web page showing the rows in the `Link` table).
