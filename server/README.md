# 🦅 BlackHawk Tournament API - Standalone Server

Production-grade, independent backend service powered by Express, TypeScript, and Firebase Realtime Database.

---

## 🚀 Quick Start (Local & Standalone)

### 1. Build Server
```bash
npm run server:build
```
This compiles TypeScript files from `server/` to `dist-server/`.

### 2. Start Production Server
```bash
npm run server:start
# or
npm start
```
Default server URL: `http://localhost:3001`

---

## 🛠️ Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP Port to listen on | `3001` |
| `HOST` | Network interface to bind | `0.0.0.0` |
| `NODE_ENV` | Runtime environment (`production` / `development`) | `development` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or `*`) | `*` |
| `FIREBASE_DATABASE_URL` | Firebase Realtime Database URL | *Asia Southeast 1 default* |
| `ADMIN_USERNAME` | Default admin username seeded on initial boot | `admin` |
| `ADMIN_PASSWORD` | Default admin password seeded on initial boot | `blackhawk2026!` |
| `DISCORD_CLIENT_ID` | Discord Application Client ID for OAuth2 | *(optional)* |
| `DISCORD_CLIENT_SECRET` | Discord Application Secret | *(optional)* |
| `DISCORD_GUILD_ID` | Discord Server ID to check membership | *(optional)* |
| `DISCORD_BOT_TOKEN` | Discord Bot Token for role checks | *(optional)* |

---

## 🌐 Deploying to Cloud Platforms

### 1. Render (Web Service)
1. Link your GitHub repository.
2. Select **Web Service** with **Node** runtime.
3. Configure settings:
   - **Build Command:** `npm ci && npm run server:build`
   - **Start Command:** `npm run server:start`
4. In Environment, set `CORS_ORIGIN` to your frontend URL (e.g., `https://your-frontend.vercel.app`) and `FIREBASE_DATABASE_URL`.
5. Set Health Check path to `/health`.

### 2. Railway
1. Create a new project and connect the repo.
2. Railway detects the `Procfile` (`web: node dist-server/index.js`) or `Dockerfile` automatically.
3. If using Nixpacks/Node:
   - **Build Command:** `npm ci && npm run server:build`
   - **Start Command:** `node dist-server/index.js`
4. Set required environment variables in the Railway dashboard.

### 3. Fly.io
```bash
fly launch
fly deploy
```
Fly will use the included multi-stage [Dockerfile](file:///c:/Event%20website/Dockerfile).

### 4. Docker (Google Cloud Run / AWS / VPS)
Build and run the container locally or in CI/CD:
```bash
# Build image
docker build -t blackhawk-api .

# Run container
docker run -d -p 3001:3001 \
  -e CORS_ORIGIN="https://your-frontend.vercel.app" \
  -e FIREBASE_DATABASE_URL="https://your-db.firebasedatabase.app" \
  --name blackhawk-api-server blackhawk-api
```

---

## 📡 Built-in Endpoints

- `GET /health` - Service health, uptime, memory, and environment
- `GET /api` - API directory and endpoint index
- `GET /api/stats` - Tournament statistics
- `GET /api/games` - Registered tournament titles
- `GET /api/events` - Tournament schedules and prizes
- `GET /api/players` - Registered players
- `GET /api/leaderboard` - Live dynamic player leaderboard & rankings
- `POST /api/registrations` - Player registration submission
- `POST /api/auth/login` - Admin authentication
