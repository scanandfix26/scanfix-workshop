# 🏍️ Scan & Fix — Workshop Management System

> Offline-first PWA for two-wheeler multi-brand workshops.  
> Works without internet. Syncs automatically when online. Installable on Android & Desktop.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **Offline First** | All data saved to IndexedDB. Works with zero internet. |
| **Auto Sync** | Pushes & pulls from Supabase when internet returns. |
| **Job Cards** | Auto-numbered `JOB-0001`, `JOB-0002`… |
| **Status System** | Pending → In Progress → Completed → Delivered |
| **Billing** | Parts + Labour + Other = Total (auto-calculated) |
| **Revenue** | Today / This Month / All-time tracking |
| **Search** | By bike number, phone, name, job number |
| **Multi-device** | Desktop + Mobile share the same cloud data in real time |
| **Role-Based Access** | Admin / Mechanic / Worker — each sees what they need |
| **PWA** | Installable on Android home screen and desktop |
| **Export** | CSV and PDF export of all records |
| **Backup/Restore** | Local JSON backup for data safety |
| **Calculator** | Built-in floating calculator for quick billing |

---

## 🚀 Quick Start (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials (or leave empty for demo/offline mode)
```

### 3. Run locally
```bash
npm run dev
```

Open http://localhost:5173

**Demo login (no Supabase needed):**
- Admin: `admin@workshop.com` / `workshop123`
- Mechanic: `mechanic@workshop.com` / `workshop123`
- Worker: `worker@workshop.com` / `workshop123`

---

## ☁️ Supabase Setup (for cloud sync)

1. Go to [app.supabase.com](https://app.supabase.com) → **New Project**
2. Go to **SQL Editor** → **New Query**
3. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**
5. Go to **Settings → API** → copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
6. Add these to your `.env` file

### Create users in Supabase
Go to **Authentication → Users → Add User** and create:
- `admin@workshop.com` (password: your choice)
- `mechanic@workshop.com`
- `worker@workshop.com`

Then set roles via SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@workshop.com');

UPDATE public.profiles SET role = 'mechanic'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mechanic@workshop.com');
```

---

## 🌐 Deploy to Vercel

```bash
npm run build        # builds to /dist

# Option A — Vercel CLI
npx vercel --prod

# Option B — Vercel Dashboard
# 1. Push repo to GitHub
# 2. Import at vercel.com/new
# 3. Add environment variables:
#    VITE_SUPABASE_URL
#    VITE_SUPABASE_ANON_KEY
# 4. Deploy
```

---

## 📂 Project Structure

```
scanfix/
├── public/
│   ├── logo.png           # Main logo
│   ├── logo-text.png      # Logo with text
│   ├── icon-192.png       # PWA icon
│   └── icon-512.png       # PWA icon (large)
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── Calculator.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── StatusBadge.tsx
│   │   └── SyncBar.tsx
│   ├── db/
│   │   └── index.ts       # IndexedDB + Supabase sync engine
│   ├── hooks/
│   │   ├── useAuth.ts     # Auth state + login/logout
│   │   └── useJobs.ts     # Job CRUD + sync + stats
│   ├── lib/
│   │   └── supabase.ts    # Supabase client
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── NewEntry.tsx
│   │   ├── ActiveJobs.tsx
│   │   ├── JobDetail.tsx
│   │   ├── Completed.tsx
│   │   ├── Revenue.tsx
│   │   ├── Search.tsx
│   │   └── Settings.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── export.ts      # CSV + PDF export
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## 📱 Install as App (PWA)

**Android Chrome:**
1. Open the app in Chrome
2. Tap the banner "Install Scan & Fix" OR
3. Tap ⋮ → "Add to Home Screen"

**Desktop Chrome:**
1. Click the install icon in the address bar OR
2. Click the install banner

The app then works fully offline.

---

## 🔄 How Offline Sync Works

```
User enters data
      ↓
Saved to IndexedDB immediately (syncPending = 1)
      ↓
Internet available?
  YES → Push to Supabase, pull new records, mark syncPending = 0
  NO  → Data stays local, shown as "Pending" in sync bar
      ↓
When internet returns
  → Auto-sync fires (online event + 30s interval)
  → All pending records pushed
  → New records from other devices pulled
  → Conflict resolution: last-writer-wins on updatedAt
```

---

## 👤 User Roles

| Role | Can Do |
|------|--------|
| **Admin** | Everything: view all, manage, revenue, delete, export |
| **Mechanic** | View jobs, update status, add notes, update parts & bill |
| **Worker** | Create new entries, view jobs, search (read-only job detail) |

---

## 🛠️ Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (no component library dependency)
- **IndexedDB** via `idb` (offline storage)
- **Supabase** (PostgreSQL + Auth + Realtime)
- **vite-plugin-pwa** + **Workbox** (service worker, offline caching)
- **jsPDF** + **jspdf-autotable** (PDF export)

---

## 🧪 Build & Preview

```bash
npm run build     # production build
npm run preview   # preview production build locally
npm run type-check # TypeScript type checking
```

---

*Built for rural workshops with unreliable internet. No internet = no problem.*
