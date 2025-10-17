// server.js — Summary UI server with /api proxy + static assets (incl. audio)
// Retains original behavior and adds:
//  - Resilient API proxy at /api → your backend (keeps ?token / ?api intact)
//  - Static serving for /audio so BG music works
//  - Health + whoami debug endpoints
//
// ENV (optional):
//   PORT=8080
//   DUEL_BACKEND_URL=https://duel-bot-backend-production.up.railway.app
//   API_TARGET=... (overrides everything for /api proxy)

const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const app  = express();
const PORT = process.env.PORT || 3000;

// ---- Public backend (default usable from browsers)
const PUBLIC_API = (process.env.DUEL_BACKEND_URL || 'https://duel-bot-backend-production.up.railway.app').replace(/\/$/, '');

// Optional hard override (use when you want to pin to a specific URL)
const API_TARGET_OVERRIDE = process.env.API_TARGET ? process.env.API_TARGET.replace(/\/$/, '') : null;

// Candidate list (lowest → highest priority)
const CANDIDATES = [
  API_TARGET_OVERRIDE,
  PUBLIC_API
].filter(Boolean);

let CURRENT_TARGET = CANDIDATES.at(-1); // default to last candidate

function log(...args) { console.log('[summary-ui]', ...args); }

// Small probe: /health then /duel/status
async function canReach(base) {
  const ctl = new AbortController();
  const t   = setTimeout(() => ctl.abort(), 2500);
  try {
    const r = await fetch(`${base}/health`, { signal: ctl.signal });
    if (r.ok) return true;
  } catch {}
  clearTimeout(t);

  const ctl2 = new AbortController();
  const t2   = setTimeout(() => ctl2.abort(), 2500);
  try {
    const r2 = await fetch(`${base}/duel/status`, { signal: ctl2.signal });
    return r2.ok;
  } catch { return false; }
  finally { clearTimeout(t2); }
}

async function chooseTarget() {
  for (const base of CANDIDATES) {
    if (!base) continue;
    if (await canReach(base)) return base;
  }
  return PUBLIC_API;
}

// Pick initial target then re-probe periodically
(async () => {
  CURRENT_TARGET = await chooseTarget();
  log('Proxy target selected:', CURRENT_TARGET);

  setInterval(async () => {
    try {
      const next = await chooseTarget();
      if (next !== CURRENT_TARGET) {
        log('Proxy target switch:', { from: CURRENT_TARGET, to: next });
        CURRENT_TARGET = next;
      }
    } catch (e) {
      log('probe error:', e?.message || e);
    }
  }, 20000);
})();

// -------- Health/debug routes
app.get('/health', (_req, res) => res.type('text/plain').send('ok'));
app.get('/__whoami', (_req, res) => res.json({ currentTarget: CURRENT_TARGET, candidates: CANDIDATES }));
app.get('/__proxycheck', async (_req, res) => {
  try {
    const ok = await canReach(CURRENT_TARGET);
    res.json({ ok, target: CURRENT_TARGET });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e?.message || e) });
  }
});

// -------- Static assets (including /audio for BG music)
app.use(express.static(__dirname, { index: false, extensions: ['html'] }));

// -------- API proxy: browser hits /api/* → forward to CURRENT_TARGET
app.use(
  '/api',
  createProxyMiddleware({
    changeOrigin: true,
    xfwd: true,
    router: () => CURRENT_TARGET,             // dynamically point to currently best target
    pathRewrite: { '^/api': '' },             // strip /api when forwarding
    proxyTimeout: 10000,
    timeout: 10000,
    onProxyReq: (proxyReq, req) => {
      log('proxy', { method: req.method, url: req.url, target: CURRENT_TARGET });
    },
    onError: (err, _req, res) => {
      log('proxy error:', err?.message || err);
      res
        .status(502)
        .json({ error: 'Bad gateway (Summary-UI → API proxy failed)', detail: String(err?.message || err) });
    },
  })
);

// -------- SPA entry (serve summary.html at root and as fallback)
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'summary.html'));
});

// Fallback to summary for any other route (so deep links still show UI)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'summary.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  log(`Summary UI listening on ${PORT}, index=${path.join(__dirname, 'summary.html')}`);
});
