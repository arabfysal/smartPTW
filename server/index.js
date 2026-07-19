import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = process.env.PORT || 4000;

// Seed db.json from the snapshot on first boot (Render's FS is ephemeral per deploy)
const dbPath = join(__dirname, 'db.json');
const seedPath = join(__dirname, 'db.seed.json');
if (!existsSync(dbPath) && existsSync(seedPath)) {
  copyFileSync(seedPath, dbPath);
}

// Simple in-memory JSON DB backed by db.json
let db = JSON.parse(readFileSync(dbPath, 'utf-8'));
function persist() { writeFileSync(dbPath, JSON.stringify(db, null, 2)); }

let idCounter = Date.now();
function nextId() { return (++idCounter).toString(36); }

const app = express();

// CORS — allow the Vercel frontend to call this API
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// ---------- Static frontend (BEFORE API so / serves index.html, not a 404 JSON) ----------
const distDir = join(ROOT, 'dist');
const indexPath = join(distDir, 'index.html');

console.log(`[boot] ROOT=${ROOT}`);
console.log(`[boot] distDir=${distDir} exists=${existsSync(distDir)}`);
console.log(`[boot] index.html exists=${existsSync(indexPath)}`);

if (existsSync(distDir)) {
  app.use(express.static(distDir));
}

// ---------- REST API on /api ----------

// GET /api/:resource
app.get('/api/:resource', (req, res) => {
  const data = db[req.params.resource];
  if (!Array.isArray(data)) return res.status(404).json({});
  const q = req.query;
  let result = data;
  for (const [key, val] of Object.entries(q)) {
    if (key.startsWith('_')) continue;
    result = result.filter((item) => String(item[key]) === String(val));
  }
  if (q._sort) {
    const field = String(q._sort);
    const order = String(q._order || 'asc').toLowerCase();
    result = [...result].sort((a, b) => {
      if (a[field] < b[field]) return order === 'desc' ? 1 : -1;
      if (a[field] > b[field]) return order === 'desc' ? -1 : 1;
      return 0;
    });
  }
  res.json(result);
});

// GET /api/:resource/:id
app.get('/api/:resource/:id', (req, res) => {
  const data = db[req.params.resource];
  if (!Array.isArray(data)) return res.status(404).json({});
  const item = data.find((i) => String(i.id) === req.params.id);
  if (!item) return res.status(404).json({});
  res.json(item);
});

// POST /api/:resource
app.post('/api/:resource', (req, res) => {
  const col = req.params.resource;
  if (!Array.isArray(db[col])) db[col] = [];
  const item = { id: req.body.id || nextId(), ...req.body };
  db[col].push(item);
  persist();
  res.status(201).json(item);
});

// PATCH /api/:resource/:id
app.patch('/api/:resource/:id', (req, res) => {
  const data = db[req.params.resource];
  if (!Array.isArray(data)) return res.status(404).json({});
  const idx = data.findIndex((i) => String(i.id) === req.params.id);
  if (idx === -1) return res.status(404).json({});
  data[idx] = { ...data[idx], ...req.body };
  persist();
  res.json(data[idx]);
});

// PUT /api/:resource/:id
app.put('/api/:resource/:id', (req, res) => {
  const data = db[req.params.resource];
  if (!Array.isArray(data)) return res.status(404).json({});
  const idx = data.findIndex((i) => String(i.id) === req.params.id);
  if (idx === -1) return res.status(404).json({});
  data[idx] = { id: req.params.id, ...req.body };
  persist();
  res.json(data[idx]);
});

// DELETE /api/:resource/:id
app.delete('/api/:resource/:id', (req, res) => {
  const data = db[req.params.resource];
  if (!Array.isArray(data)) return res.status(404).json({});
  const idx = data.findIndex((i) => String(i.id) === req.params.id);
  if (idx === -1) return res.status(404).json({});
  data.splice(idx, 1);
  persist();
  res.status(200).json({});
});

// ---------- SPA fallback — any non-API, non-static route serves index.html ----------
app.get('/{*path}', (_req, res) => {
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send('Frontend not built — run npm run build first.');
  }
});

app.listen(PORT, () => {
  console.log(`SmartPTW running on port ${PORT}`);
});
