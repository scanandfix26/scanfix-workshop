const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*', methods: ['GET','POST','DELETE','OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '10mb' }));

function readJobs() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}
function writeJobs(jobs) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));
}

app.get('/jobs', (req, res) => {
  const store = readJobs();
  res.json({ jobs: Object.values(store) });
});

app.post('/jobs', (req, res) => {
  const incoming = req.body.jobs;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: 'jobs array required' });
  const store = readJobs();
  let upserted = 0;
  for (const job of incoming) {
    if (!job.id) continue;
    const existing = store[job.id];
    if (!existing || new Date(job.updatedAt) >= new Date(existing.updatedAt)) {
      store[job.id] = { ...job, syncPending: 0 };
      upserted++;
    }
  }
  writeJobs(store);
  res.json({ ok: true, upserted });
});

app.delete('/jobs/:id', (req, res) => {
  const store = readJobs();
  delete store[req.params.id];
  writeJobs(store);
  res.json({ ok: true });
});

app.get('/health', (req, res) => res.json({ ok: true, jobs: Object.keys(readJobs()).length }));

app.listen(PORT, () => console.log(`Scan & Fix sync server on :${PORT}`));
