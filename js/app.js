// ── Helpers ──────────────────────────────────────────────────
function starsHTML(r) {
  return [1,2,3].map(i => `<span class="star ${i<=r?'filled':''}">${i<=r?'&#9733;':'&#9734;'}</span>`).join('');
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function countWords(html) {
  const txt = html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return txt ? txt.split(' ').filter(w=>w.length>0).length : 0;
}
function parseMmSs(val) {
  const m = String(val).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1])*60 + parseInt(m[2]);
}
function calcWpm(words, totalSecs) {
  if (!words || !totalSecs) return null;
  return Math.round(words / (totalSecs / 60));
}
function showToast(msg, type='info') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast toast--' + type + ' toast--visible';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('toast--visible'), 3000);
}

// ── Routing ──────────────────────────────────────────────────
const NAV_MAP = {
  'ideas':'ideas','add-idea':'ideas','idea-detail':'ideas',
  'wip':'wip','wip-editor':'wip',
  'ready':'ready','rtr-detail':'ready',
  'recorded':'recorded','recorded-detail':'recorded',
  'overview':'overview'
};

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const t = document.getElementById('page-'+id);
  if (t) t.classList.add('active');
  const nk = NAV_MAP[id] || id;
  // Update top nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === nk));
  // Update bottom nav
  document.querySelectorAll('.bottom-nav__btn').forEach(b => b.classList.toggle('active', b.dataset.page === nk));
  document.getElementById('btn-add-idea').classList.toggle('visible', id==='ideas');
  document.getElementById('btn-add-wip').classList.toggle('visible', id==='wip');
  window.scrollTo(0, 0);
  if (id === 'overview') renderOverview();
}

// ── Settings drawer ──────────────────────────────────────────
function openSettings() {
  document.getElementById('settings-overlay').classList.add('open');
  document.getElementById('settings-drawer').classList.add('open');
  document.getElementById('btn-hamburger').classList.add('open');
}
function closeSettings() {
  document.getElementById('settings-overlay').classList.remove('open');
  document.getElementById('settings-drawer').classList.remove('open');
  document.getElementById('btn-hamburger').classList.remove('open');
}

// ── Export ───────────────────────────────────────────────────
async function exportData() {
  try {
    await Storage.exportAll();
    showToast('Backup downloaded.', 'success');
  } catch(e) {
    showToast('Export failed: ' + e.message, 'error');
  }
}

// ── Auth ─────────────────────────────────────────────────────
let authMode = 'signin'; // or 'signup'

function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'none';
}

function showApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
}

function showLoading() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('loading-screen').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
}

async function signOut() {
  await sb.auth.signOut();
  closeSettings();
  showAuthScreen();
}
