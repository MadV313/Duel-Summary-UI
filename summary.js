// summary.js

(function () {
  // --- Bootstrap token/api from globals or URL/localStorage
  const qs = new URLSearchParams(location.search);
  const tokenFromUrl = qs.get('token') || '';
  const apiFromUrl   = (qs.get('api') || '').replace(/\/+$/, '');

  // Persist & restore token so other UIs can reuse it
  let PLAYER_TOKEN = tokenFromUrl;
  try {
    if (!PLAYER_TOKEN) PLAYER_TOKEN = localStorage.getItem('sv13.token') || '';
    if (tokenFromUrl) localStorage.setItem('sv13.token', tokenFromUrl);
  } catch {}

  // Prefer window.API_BASE injected by HTML; fall back to ?api= or /api proxy
  const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ||
                   apiFromUrl ||
                   '/api';

  // Help scripts build same-origin links back to the UI root
  const UI_BASE = (typeof window !== 'undefined' && window.UI_BASE) ||
                  (location.origin + location.pathname).replace(/\/[^\/]*$/, '');

  // Compose URL safely and append token/api when present
  function withParams(href) {
    try {
      const u = new URL(href, location.origin);
      if (PLAYER_TOKEN) u.searchParams.set('token', PLAYER_TOKEN);
      if (apiFromUrl)   u.searchParams.set('api', apiFromUrl);
      return u.toString();
    } catch {
      const sep = href.includes('?') ? '&' : '?';
      const parts = [];
      if (PLAYER_TOKEN) parts.push('token=' + encodeURIComponent(PLAYER_TOKEN));
      if (apiFromUrl)   parts.push('api=' + encodeURIComponent(apiFromUrl));
      return parts.length ? href + sep + parts.join('&') : href;
    }
  }

  // Expose in case buttons call these globally
  window.__SV13_SUMMARY__ = { API_BASE, UI_BASE, PLAYER_TOKEN, withParams };
})();

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const duelId = urlParams.get('duelId');

  if (!duelId) {
    const el = document.getElementById('resultText');
    if (el) el.textContent = 'Duel ID not found.';
    return;
  }

  const { API_BASE } = window.__SV13_SUMMARY__ || { API_BASE: '/api' };
  const endpoint = `${API_BASE.replace(/\/$/, '')}/summary/${encodeURIComponent(duelId)}`;

  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${t.slice(0, 180)}`);
    }
    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    displaySummary(data);
  } catch (err) {
    console.error('Failed to load summary:', err);
    const el = document.getElementById('resultText');
    if (el) el.textContent = 'Summary load failed.';
  }
});

function displaySummary(summary) {
  const { players = {}, winner, events, wager } = summary || {};

  const winnerKey = winner || 'player1';
  const loserKey  = winnerKey === 'player1' ? 'player2' : 'player1';

  const winnerName = (players[winnerKey]?.discordName || players[winnerKey]?.name || 'Winner');
  const loserName  = (players[loserKey]?.discordName || players[loserKey]?.name || 'Opponent');
  const finalHp    = Number(players[winnerKey]?.hp ?? 0);

  const resultTextEl = document.getElementById('resultText');
  if (resultTextEl) resultTextEl.textContent = `${String(winnerName).toUpperCase()} WINS THE DUEL!`;

  const wEl = document.getElementById('winnerName');
  const lEl = document.getElementById('loserName');
  const hpEl = document.getElementById('finalHP');
  if (wEl) wEl.textContent = `Winner: ${winnerName}`;
  if (lEl) lEl.textContent = `Loser: ${loserName}`;
  if (hpEl) hpEl.textContent = `Final HP: ${finalHp}`;

  const eventList = document.getElementById('eventList');
  if (eventList && Array.isArray(events)) {
    events.forEach(event => {
      const li = document.createElement('li');
      li.textContent = event;
      eventList.appendChild(li);
    });
  }

  if (wager) {
    const sec = document.getElementById('wagerSection');
    const txt = document.getElementById('wagerText');
    if (sec) sec.classList.remove('hidden');
    if (txt) txt.textContent = `${winnerName} gained +${wager.amount} coins.`;
  }
}

// Navigation helpers used by buttons in HTML
function returnToMenu() {
  const { UI_BASE, withParams } = window.__SV13_SUMMARY__ || {};
  const target = withParams ? withParams(UI_BASE || '/') : '/';
  window.location.href = target;
}

function replayDuel() {
  // Simple reload preserves duelId/token/api in query
  window.location.reload();
}

// Expose for inline onclicks
window.returnToMenu = returnToMenu;
window.replayDuel = replayDuel;
