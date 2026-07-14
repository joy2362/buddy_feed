# BuddyFeed — Full Stack Engineer Selection Task

A social feed app (auth + posts + comments/replies + likes + public/private
visibility) built from the provided `Selection Task` HTML/CSS design, with a
Laravel API backend and a React (Vite) frontend.

## Stack

- **Backend:** Laravel 13 (PHP 8.3), PostgreSQL 16, Laravel Sanctum (bearer tokens)
- **Frontend:** React 19 + Vite, react-router-dom, axios
- **Database:** PostgreSQL, run locally via Docker Compose

## Project layout

```
Selection Task/   the original provided design (unmodified reference)
backend/          Laravel API
frontend/          React SPA
docker-compose.yml  Postgres for local dev
```

## Running it locally

### 1. Database

```bash
docker compose up -d
```

Starts Postgres on `localhost:54329` (mapped to avoid clashing with any
locally-installed Postgres), database `buddyfeed`.

### 2. Backend

```bash
cd backend
composer install
cp .env.example .env   # then edit DB_* to match docker-compose.yml if needed
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --port=8000
```

`.env` already in this repo (for local dev convenience) points at the Docker
Postgres instance and `http://localhost:5173` as the allowed CORS origin.

**Seeded accounts** (password for all: `password`):
- `demo@example.com` — convenient account for a walkthrough
- `karim@example.com`, `radovan@example.com`, `jane@example.com`, `ryan@example.com`

The seeder creates a realistic mix of public/private posts, comments, one
level of replies, and likes across these users so the feed isn't empty on
first run.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. `.env` sets `VITE_API_URL=http://localhost:8000/api`.

## What was built

### Auth & authorization
- Register (first name, last name, email, password) and login issue a
  Sanctum **personal access token** (bearer token), returned once and stored
  client-side; every subsequent request sends `Authorization: Bearer <token>`.
- Logout revokes the current token server-side (`currentAccessToken()->delete()`).
- The feed route is a protected client-side route (`ProtectedRoute`) that
  redirects to `/login` when there's no valid session, and the API
  independently enforces `auth:sanctum` on every non-auth route — the
  frontend guard is a UX convenience, not the security boundary.
- Passwords are hashed with bcrypt (Laravel default). Login/register are rate
  limited (`throttle:auth`, 10/min/IP) to blunt credential stuffing; all other
  API routes are rate limited too (`throttle:api`, 120/min/user-or-IP).

### Feed
- **Posts**: text and/or image, `public` or `private` visibility. Private
  posts are only ever returned to their author — enforced in the query
  (`Post::visibleTo($user)`) *and* in a `PostPolicy` for direct-by-ID access,
  so there's no way to reach a private post's comments/likes by guessing an
  ID.
- **Feed ordering**: newest first, via cursor pagination (`cursorPaginate`)
  rather than offset pagination — see "Scaling to millions of posts" below.
- **Likes**: a single polymorphic `likes` table (`likeable_type`/`likeable_id`)
  backs likes on posts, comments, *and* replies (a reply is just a comment
  with a `parent_id`), with a unique constraint on `(user_id, likeable_type,
  likeable_id)` so a user can't double-like. Toggling is idempotent and
  race-safe (`LikeToggleService`: row lock + unique-constraint fallback).
- **"Who liked this"**: a dedicated endpoint per post/comment
  (`GET /posts/{post}/likes`, `GET /comments/{comment}/likes`), fetched
  on-demand in a modal — not embedded in every feed row, which would mean N
  extra queries per page load at scale.
- **Comments & replies**: one level of nesting (comment → replies), matching
  the provided design. Both comments and replies support like/unlike and
  "who liked."
- Like/comment/reply counts are **denormalized columns**
  (`posts.likes_count`, `posts.comments_count`, `comments.likes_count`)
  updated transactionally on write, instead of `COUNT()` aggregates computed
  on every read.

### Design fidelity
The provided CSS/fonts/images are used unmodified (copied verbatim into
`frontend/public/assets`), and the Login/Register pages mirror the given
HTML structure and classes closely — the registration form gains first/last
name fields (required by the task) styled with the same input classes as the
rest of the form.

The feed page keeps the design's post-card layout, like/comment buttons, and
comment/reply structure, but — per the task's instruction to "ignore most
design elements, focus only on the main functionality" — drops elements the
static template included that aren't part of the required feature set:
stories, friend requests, notifications, emoji-reaction picker, share button,
and the post dropdown menu (save/hide/edit/delete). A few small pieces
needed for real functionality weren't in the static template at all (there
are no real user photos, so users get a color-coded initials avatar instead
of a broken `<img>`; there's no header logout control; there's no likes-list
modal) — these are added in `frontend/src/custom.css`, styled to match the
existing color palette (`--color5` etc.) rather than introducing a new look.

### Security & performance notes
- Mass assignment is locked down via explicit `#[Fillable(...)]` allow-lists
  on every model.
- File uploads are validated by MIME type and size (5 MB) before being
  stored on the `public` disk; served as static files (never executed).
- CORS is restricted to the configured frontend origin (not `*`).
- Morph classes are aliased (`post`, `comment`) via a morph map instead of
  storing fully-qualified class names in the `likes` table.
- Eager loading (`with(['user', 'myLike', ...])`) is used throughout to
  avoid N+1 queries; "did I like this" is resolved via an eager-loaded
  `myLike` relation instead of one `exists()` query per row.

### Scaling to millions of posts (design intent)
Implemented now:
- Cursor pagination on the feed and comment lists (`orderByDesc(created_at,
  id)` + keyset pagination) — avoids the `OFFSET n` scan cost that grows
  linearly with page depth under offset pagination.
- Composite indexes matching the actual query shape:
  `posts(visibility, created_at, id)` for the feed,
  `posts(user_id, created_at)` for a user's own posts,
  `comments(post_id, parent_id, created_at)` for a post's comment thread,
  `likes(likeable_type, likeable_id)` for "who liked."
- Denormalized counters instead of aggregate counts on read.

Noted as follow-up work rather than implemented here (out of scope for a
take-home, but the schema doesn't preclude any of them): a Redis cache in
front of the hot feed query, read replicas for the Postgres primary, moving
uploaded images to S3/CDN instead of local disk, and background jobs for
counter maintenance if writes ever need to be decoupled from the request
cycle.

## API summary

All routes below except register/login require `Authorization: Bearer
<token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/register` | Create account, returns user + token |
| POST | `/api/login` | Returns user + token |
| POST | `/api/logout` | Revokes current token |
| GET | `/api/user` | Current user |
| GET | `/api/posts` | Cursor-paginated feed (public + own private) |
| POST | `/api/posts` | Create post (`body?`, `image?`, `visibility`) |
| GET | `/api/posts/{post}` | Single post (visibility-checked) |
| POST | `/api/posts/{post}/like` | Toggle like |
| GET | `/api/posts/{post}/likes` | Who liked this post |
| GET | `/api/posts/{post}/comments` | Top-level comments + their replies |
| POST | `/api/posts/{post}/comments` | Add a top-level comment |
| POST | `/api/comments/{comment}/replies` | Reply to a top-level comment |
| POST | `/api/comments/{comment}/like` | Toggle like on a comment/reply |
| GET | `/api/comments/{comment}/likes` | Who liked this comment/reply |

## Explicitly out of scope

Per the task brief: no "forgot password," no post edit/delete, no
share/reactions beyond like, no notifications/friend requests — the design's
static markup for these was intentionally not wired up.

## Deliverables checklist

- [x] Working app (this repo)
- [x] Documentation (this file)
- [ ] Pushed to a GitHub repository
- [ ] Deployed to a live URL
- [ ] Video walkthrough (YouTube, unlisted/private)
