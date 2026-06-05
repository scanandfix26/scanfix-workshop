# Multi-Device Sync — Setup Guide

## What was the bug?

The original app stored everything in **IndexedDB** — a database that lives
**only inside that one browser/device**. When you added a job on Mobile A,
it was invisible on Mobile B and on the PC, because each device has its own
separate IndexedDB. There was no shared database.

## What was fixed?

Three files were changed and two new files were added:

| File | What changed |
|---|---|
| `src/db/index.ts` | Added cloud sync engine (push/pull/offline queue) |
| `src/hooks/useJobs.ts` | Auto-sync on mount, on every write, on coming online |
| `src/App.tsx` | Shows `SyncBar` status strip at top |
| `src/pages/Settings.tsx` | Added "Sync Now" button |
| `src/components/SyncBar.tsx` | NEW — shows sync status (syncing / synced / offline / pending) |
| `server/index.js` | NEW — tiny shared backend all devices talk to |

---

## Step 1 — Deploy the backend (shared database)

The `server/` folder contains a small Node.js server.
Deploy it for **free** using one of these:

### Option A — Render.com (easiest, free)
1. Push your project to GitHub
2. Go to https://render.com → New → Web Service
3. Point it to the `server/` folder
4. Set **Start Command**: `node index.js`
5. Deploy → copy the URL (e.g. `https://scanfix-sync.onrender.com`)

### Option B — Railway.app
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select the `server/` folder as the root
3. Railway auto-detects Node → deploy
4. Copy the generated URL

### Option C — Run locally on your Wi-Fi
```bash
cd server
npm install
node index.js
# Server runs on http://YOUR_PC_IP:3001
```
All devices on the same Wi-Fi can reach it.

---

## Step 2 — Tell the app where the server is

Create a `.env` file in the root of the project:

```
VITE_SYNC_URL=https://your-server-url-here.com
```

Example:
```
VITE_SYNC_URL=https://scanfix-sync.onrender.com
```

Then rebuild:
```bash
npm run build
```

> **If you leave `VITE_SYNC_URL` empty**, the app works exactly like before —
> local-only, no sync. This is safe as a fallback.

---

## How sync works

```
Mobile A                  Cloud Server              Mobile B / PC
   │                           │                          │
   │  Add job (offline)        │                          │
   │  → saved to IndexedDB     │                          │
   │  → syncPending = 1        │                          │
   │                           │                          │
   │ (comes online)            │                          │
   │──POST /jobs ─────────────►│                          │
   │                           │  stores job              │
   │◄──{ ok: true }────────────│                          │
   │  syncPending = 0          │                          │
   │                           │                          │
   │                           │◄── GET /jobs ────────────│
   │                           │──{ jobs: [...] }────────►│
   │                           │                          │  merges new job
   │                           │                          │  shows in list ✓
```

**Conflict resolution:** If two devices edit the same job at the same time,
the one with the **later `updatedAt` timestamp wins**. The losing edit is
overwritten. This is called "last-writer-wins" and works well for a workshop
where usually only one person edits a job at a time.

**Offline:** If there's no internet, jobs are saved locally with
`syncPending = 1`. As soon as the device comes back online, they are
automatically pushed. The yellow "Offline — will sync when online" bar
appears at the top to let you know.

---

## Verifying it works

1. Open the app on Phone A → add a job
2. The sync bar at the top should briefly show "Syncing…" then "Synced"
3. Open the app on Phone B (or your PC) → the job appears automatically
4. Turn off Wi-Fi → edit a job → it shows "X pending" badge
5. Turn Wi-Fi back on → it syncs automatically within seconds

---

## For production (more than one workshop)

The `server/index.js` uses a local JSON file as storage. For real production:
- Replace the `readJobs()`/`writeJobs()` functions with a PostgreSQL query
- Add a simple API key header check for basic security
- Use Render's free PostgreSQL add-on (500MB free)

This keeps the server code almost identical — only the storage layer changes.
