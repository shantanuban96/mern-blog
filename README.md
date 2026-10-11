# MERN Blog

A blog platform built with **MongoDB, Express.js, React and Node.js**. It includes user authentication (email/password, Google, Facebook), role-based access control, posts with soft delete, comments, an admin panel and real-time notifications.

> **Demo video:** _add your video link here_

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Installation](#installation)
5. [Environment setup](#environment-setup)
6. [Running the app](#running-the-app)
7. [Testing](#testing)
8. [API documentation](#api-documentation)
9. [Design decisions](#design-decisions)

---

## Features

### Authentication
- Register, login and logout with email and password
- Passwords hashed with **bcrypt**
- **JWT access token** (15 min, sent in the `Authorization` header) and **refresh token** (7 days, `httpOnly` cookie)
- Refresh tokens are **rotated** on every use and stored as a SHA-256 hash, so logout revokes them on the server
- **Rate limiting** on login, register and refresh (20 requests / 15 min per IP)
- **Google and Facebook login** with OAuth 2.0 via Passport.js
- All secrets loaded from `.env`

### Roles and permissions (RBAC)
| Action | Guest | User | Admin |
|---|:-:|:-:|:-:|
| Read posts and comments | ✅ | ✅ | ✅ |
| Create posts and comments | | ✅ | ✅ |
| Edit / delete **own** posts and comments | | ✅ | ✅ |
| Edit / delete **any** post or comment | | | ✅ |
| Manage users (role, activate / deactivate) | | | ✅ |
| Restore deleted posts, view dashboard | | | ✅ |

The rules are enforced **in the API by middleware** (`authenticate`, `authorize`, `checkOwnership`). The React route guards are only for user experience.

### Posts
- CRUD with title, content, author and timestamps (`createdAt`, `updatedAt`)
- URL-friendly **slug** generated from the title (`My First Post` → `/posts/my-first-post`). A duplicate title gets a unique suffix.
- **Soft delete** (`isDeleted` + `deletedAt`): deleted posts are hidden but admins can restore them
- Pagination and full-text search

### Comments
- Logged-in users can comment on posts
- Users edit and delete only their own comments; admins can manage all comments
- `Comment` references `Post` and `User` through Mongoose `ObjectId` refs

### Admin panel
- Dashboard with total **users**, **posts** and **comments**, plus recent user activity
- Manage users: search, change role, deactivate or activate (deactivation logs the user out everywhere)
- Manage posts: filter active or deleted, edit, delete, restore
- Manage comments: view and delete any comment

### Other
- **Activity logging middleware**: register, login, logout, and post, comment and user changes are saved to `ActivityLog`
- **Real-time notifications (bonus)**: a post's author gets a live Socket.io notification when someone comments on it
- Validation with **Joi** on the server and **Zod** in React
- Central error handling with one consistent JSON error format
- Unit and integration tests with **Jest** (server: 70 tests, about 96% line coverage; client: 17 tests)

---

## Tech stack

| Layer | Technology |
|---|---|
| Database | MongoDB with Mongoose ODM |
| Backend | Node.js, Express.js (Express Router) |
| Auth | jsonwebtoken, bcrypt, Passport (Google OAuth 2.0, Facebook), express-rate-limit |
| Validation | Joi (server), Zod (client) |
| Frontend | React 18 (functional components + Hooks), React Router, Context API, Axios, Vite |
| Real-time | Socket.io |
| Testing | Jest, Supertest, mongodb-memory-server, React Testing Library |

---

## Architecture

The backend uses a **layered architecture**. Each layer has one job and only talks to the layer below it:

```
Request
  │
  ▼
routes/        which URL → which middleware + controller
  │
  ▼
middleware/    authenticate, authorize, checkOwnership, validate, rate limit, activity log
  │
  ▼
controllers/   reads req, calls a service, sends the response (no business logic)
  │
  ▼
services/      business logic (rules, ownership, slugs, tokens) - no req/res here
  │
  ▼
models/        Mongoose schemas, indexes, hooks
  │
  ▼
MongoDB
```

Any error thrown in any layer reaches `middleware/errorHandler.js`, which sends the standard error response.

### Folder structure

```
mern-blog/
├── server/
│   ├── src/
│   │   ├── config/        env.js (loads .env), passport.js (Google/Facebook)
│   │   ├── constants/     roles and activity action names
│   │   ├── controllers/   auth, post, comment, admin
│   │   ├── middleware/    auth (authenticate/authorize/checkOwnership), validate,
│   │   │                  rateLimiter, activityLogger, errorHandler
│   │   ├── models/        User, Post, Comment, RefreshToken, ActivityLog
│   │   ├── routes/        index (/api/v1), auth, post, comment, admin
│   │   ├── services/      auth, token, post, comment, admin, activity
│   │   ├── utils/         ApiError, asyncHandler, apiResponse, pagination, slugify, logger
│   │   ├── validators/    Joi schemas per feature
│   │   ├── socket.js      Socket.io setup + notifyUser()
│   │   ├── app.js         Express app (middleware + routes)
│   │   └── server.js      connects MongoDB, starts HTTP + Socket.io
│   ├── scripts/           seed.js (first admin), dev-memory.js (run without installing MongoDB)
│   └── tests/             unit/ and integration/
│
└── client/
    └── src/
        ├── api/           Axios instance (token + auto refresh) and one file per resource
        ├── context/       AuthContext (global auth state), NotificationContext (Socket.io)
        ├── components/    Navbar, ProtectedRoute, CommentSection, Pagination, ...
        ├── hooks/         useFetch
        ├── pages/         Home, PostDetail, PostForm, MyPosts, Login, Register, ...
        │   └── admin/     AdminLayout, Dashboard, ManageUsers, ManagePosts, ManageComments
        ├── schemas/       Zod form validation
        └── __tests__/     Jest + React Testing Library
```

### How authentication works

1. **Login** → the API returns an **access token** in the JSON body and sets the **refresh token** as an `httpOnly` cookie.
2. React keeps the access token **in memory** (not localStorage) and Axios adds it to every request.
3. When a request returns **401**, Axios calls `/auth/refresh` once, gets a new access token and retries the request.
4. On page reload, `AuthContext` calls `/auth/refresh` to restore the session from the cookie.
5. **Logout** deletes the refresh token from the database and clears the cookie.

**Social login:** the browser opens `/api/v1/auth/google` → Google → `/api/v1/auth/google/callback` → the server finds or creates the user, sets the refresh cookie and redirects to `/oauth/callback` in React. React then restores the session as in step 4.

---

## Installation

**Requirements:** Node.js 18 or newer, plus MongoDB (local or [Atlas](https://www.mongodb.com/atlas)). You can also try the app without MongoDB using `npm run dev:memory`, described below.

```bash
git clone https://github.com/<your-username>/mern-blog.git
cd mern-blog

# Backend
cd server
npm install
cp .env.example .env      # then edit .env (see below)

# Frontend
cd ../client
npm install
```

---

## Environment setup

All configuration lives in `server/.env`. The client needs no env file: in development Vite forwards `/api` and `/socket.io` to the server.

| Variable | Description |
|---|---|
| `PORT` | API port (default `5000`) |
| `SERVER_URL` | Public URL of the API, used for OAuth callback URLs |
| `CLIENT_URL` | URL of the React app (CORS + redirect after social login) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Two **different** long random strings |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime (default `15m`) |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | Refresh token lifetime (default `7`) |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost (default `12`) |
| `AUTH_RATE_LIMIT_MAX` | Max auth requests per IP per 15 minutes (default `20`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth keys (optional) |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook app keys (optional) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | First admin account created by `npm run seed` |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Google login setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. **APIs & Services → OAuth consent screen**: choose *External*, fill in the app name and add your Google account as a **test user**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → *Web application*.
   - Authorized JavaScript origin: `http://localhost:5173`
   - Authorized redirect URI: `http://localhost:5000/api/v1/auth/google/callback`
4. Copy the Client ID and Client secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### Facebook login setup
1. Go to [Meta for Developers](https://developers.facebook.com/) → **My Apps → Create App**, and choose the use case *Authenticate and request data from users with Facebook Login*.
2. In the use case settings, make sure the **email** permission is added.
3. **Facebook Login → Settings → Valid OAuth Redirect URIs**: `http://localhost:5000/api/v1/auth/facebook/callback`
4. **App settings → Basic**: copy the App ID and App secret into `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`.
5. While the app is in development mode, only accounts with a role on the app (for example you) can log in.

If a provider's keys are empty, its button is hidden in the UI.

---

## Running the app

### Option A: with your own MongoDB
```bash
# terminal 1
cd server
npm run seed          # creates the admin from SEED_ADMIN_* (add --sample for demo data: npm run seed:sample)
npm run dev           # http://localhost:5000/api/v1

# terminal 2
cd client
npm run dev           # http://localhost:5173
```

### Option B: no MongoDB installed (quick try)
```bash
# terminal 1
cd server
npm run dev:memory    # starts an in-memory MongoDB and seeds demo data

# terminal 2
cd client
npm run dev
```

**Demo accounts** (created by `seed:sample` and `dev:memory`):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin12345` |
| User | `user@example.com` | `User12345` |

### Production build
```bash
cd client && npm run build     # static files in client/dist
cd server && npm start
```
Serve `client/dist` and the API under the same domain (for example with a reverse proxy routing `/api` and `/socket.io` to Node). Set `NODE_ENV=production` so the refresh cookie is sent over HTTPS only.

---

## Testing

```bash
cd server
npm test                 # 70 unit + integration tests (in-memory MongoDB, nothing to install)
npm run test:coverage    # coverage report

cd client
npm test                 # 17 component and validation tests
```

| Suite | What it covers |
|---|---|
| `server/tests/unit` | slugify, pagination, validation, `authorize`, `checkOwnership`, error handler, rate limiter, JWT |
| `server/tests/integration/auth` | register, login, refresh-token rotation, reuse rejection, logout, `/me` |
| `server/tests/integration/posts` | pagination, search, slugs, ownership (403), admin override, soft delete |
| `server/tests/integration/comments` | create, list, owner-only edit, admin delete |
| `server/tests/integration/admin` | 401/403 protection, stats, user management, restore, activity log |
| `server/tests/integration/socialLogin` | create, link by email, deactivated accounts |
| `client/src/__tests__` | Zod schemas, `ProtectedRoute`, Login page, Pagination |

---

## API documentation

Base URL: `/api/v1`

**Success response**
```json
{ "success": true, "message": "Post created", "data": { }, "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
```
**Error response**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "details": [{ "field": "title", "message": "title is required" }] } }
```

Error codes: `BAD_REQUEST`, `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `TOO_MANY_REQUESTS` (429), `INTERNAL_ERROR` (500).

🔒 = requires `Authorization: Bearer <accessToken>`  ·  👑 = admin only  ·  ✍️ = owner or admin

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` → user + access token, sets refresh cookie |
| POST | `/auth/login` | `{ email, password }` → user + access token, sets refresh cookie |
| POST | `/auth/refresh` | Uses the refresh cookie → new access token, rotates the cookie |
| POST | `/auth/logout` | Revokes the refresh token and clears the cookie |
| GET | `/auth/me` 🔒 | Current user |
| GET | `/auth/providers` | Which social logins are enabled |
| GET | `/auth/google`, `/auth/google/callback` | Google OAuth 2.0 flow |
| GET | `/auth/facebook`, `/auth/facebook/callback` | Facebook OAuth 2.0 flow |

### Posts
| Method | Endpoint | Description |
|---|---|---|
| GET | `/posts?page=&limit=&search=&author=` | Paginated list of active posts (with excerpt instead of content) |
| GET | `/posts/:idOrSlug` | One post by slug or id |
| POST | `/posts` 🔒 | `{ title, content }` |
| PATCH | `/posts/:id` 🔒✍️ | `{ title?, content? }` |
| DELETE | `/posts/:id` 🔒✍️ | Soft delete |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/posts/:postId/comments?page=&limit=` | Paginated comments of a post |
| POST | `/posts/:postId/comments` 🔒 | `{ content }` (notifies the post author in real time) |
| PATCH | `/comments/:id` 🔒✍️ | `{ content }` |
| DELETE | `/comments/:id` 🔒✍️ | Delete comment |

### Admin 🔒👑
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/stats` | `{ users, posts, comments }` |
| GET | `/admin/activity?limit=` | Recent activity log |
| GET | `/admin/users?page=&limit=&search=` | List and search users |
| PATCH | `/admin/users/:id` | `{ role?, isActive? }` (cannot change yourself) |
| GET | `/admin/posts?page=&limit=&status=all\|active\|deleted` | All posts, including deleted |
| PATCH | `/admin/posts/:id/restore` | Restore a soft-deleted post |
| GET | `/admin/comments?page=&limit=` | All comments with author and post |

### Socket.io
Connect with `io({ auth: { token: accessToken } })`. The server emits `notification` → `{ message, link, createdAt }`.

---

## Design decisions

- **Roles can't be self-assigned.** Validation strips unknown fields, so `{ "role": "admin" }` in a register request is ignored. The first admin is created with `npm run seed`.
- **Role and status are checked on every request.** `authenticate` loads the user from the database, so promoting or deactivating someone takes effect immediately, not when their token expires.
- **Slugs don't change on edit**, so links that have already been shared keep working.
- **Social accounts are linked by email.** If someone registered with email and later uses Google with the same address, it is the same account. Google and Facebook only return verified emails.
- **Users are deactivated, not deleted**, so their posts and comments keep a valid author.
- **Performance:**
  - Indexes match the main queries: feed `{isDeleted, createdAt}`, my posts `{author, isDeleted, createdAt}`, comments `{post, createdAt}`, plus a text index for search.
  - Every list is paginated and runs the page query and count in parallel.
  - Lists send an `excerpt` instead of the full content.
  - `populate` only loads the fields shown (`name avatar`), and read queries use `.lean()`.

### Scaling further
- **Rate limiting:** counts are in memory. With several API instances, use a Redis store (`rate-limit-redis`).
- **Socket.io:** add `@socket.io/redis-adapter` so notifications reach users connected to any instance.
- **Notifications:** store them in a collection if users should see them after reconnecting.
- **API versioning:** a new `/api/v2` router can be added next to `/api/v1` without breaking existing clients.
