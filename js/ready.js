// ── READY TO RECORD ───────────────────────────────────────────
let currentRtrId = null;
let recordingMode = false;

async function renderReadys() {
  const list = document.getElementById('rtr-list');
  const empty = document.getElementById('rtr-empty');
  try {
    const docs = await Storage.getReadys();
    list.innerHTML = '';
    if (!docs.length) { empty.classList.add('visible'); return; }
    empty.classList.remove('visible');
    docs.forEach(doc => {
      const c = document.createElement('div');
      c.className = 'rtr-card';
      const dateStr = doc.created_at ? formatDate(doc.created_at) : '';
      const seriesStr = doc.series ? `<span>${esc(doc.series)}</span>` : '';
      c.innerHTML = `<div class="rtr-card__info"><div class="rtr-card__title">${esc(doc.title)}</div><div class="rtr-card__meta">${dateStr?`<span>${dateStr}</span>`:''}${seriesStr}</div></div><span class="idea-card__arrow">&#8250;</span>`;
      c.addEventListener('click', () => openRtrDetail(doc.id));
      list.appendChild(c);
    });
  } catch(e) { showToast('Error loading Ready to Record', 'error'); }
}

async function openRtrDetail(id) {
  const doc = await Storage.getReadyById(id);
  if (!doc) return;
  currentRtrId = id;
  document.getElementById('rtr-detail-title').textContent = doc.title;
  document.getElementById('rtr-detail-content').innerHTML = doc.content || '';
  showPage('rtr-detail');
}

async function returnToWip() {
  if (!currentRtrId) return;
  try {
    const doc = await Storage.getReadyById(currentRtrId);
    if (!doc) return;
    const wipDoc = await Storage.saveWip({ title: doc.title, content: doc.content, series: doc.series, status: 'reviewing' });
    await Storage.deleteReady(currentRtrId);
    currentRtrId = null;
    if (recordingMode) toggleRecordingMode();
    await renderReadys();
    await renderWips();
    await openWipEditor(wipDoc.id);
    showToast('Returned to Work in Progress', 'success');
  } catch(e) { showToast('Error returning to WIP', 'error'); }
}

function toggleRecordingMode() {
  recordingMode = !recordingMode;
  document.body.classList.toggle('recording-mode', recordingMode);
}

async function markAsRecorded() {
  if (!currentRtrId) return;
  try {
    const doc = await Storage.getReadyById(currentRtrId);
    if (!doc) return;
    const rec = await Storage.saveRecorded({ title: doc.title, content: doc.content, series: doc.series });
    await Storage.deleteReady(currentRtrId);
    currentRtrId = null;
    if (recordingMode) toggleRecordingMode();
    await renderReadys();
    await renderRecorded();
    openRecordedDetail(rec.id);
    showToast('Marked as Recorded!', 'success');
  } catch(e) { showToast('Error marking as recorded', 'error'); }
}
