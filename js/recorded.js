// ── RECORDED ──────────────────────────────────────────────────
let currentRecordedId = null;

async function renderRecorded(filter='') {
  const list = document.getElementById('recorded-list');
  const empty = document.getElementById('recorded-empty');
  try {
    let docs = await Storage.getRecorded();
    if (filter) {
      const q = filter.toLowerCase();
      docs = docs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        (d.series||'').toLowerCase().includes(q) ||
        (d.recorded_at && formatDate(d.recorded_at).toLowerCase().includes(q))
      );
    }
    list.innerHTML = '';
    if (!docs.length) { empty.classList.add('visible'); return; }
    empty.classList.remove('visible');
    docs.forEach(doc => {
      const c = document.createElement('div');
      c.className = 'recorded-card';
      const dateStr = doc.recorded_at ? formatDate(doc.recorded_at) : '';
      const seriesStr = doc.series ? `<span>${esc(doc.series)}</span>` : '';
      const wc = doc.word_count || countWords(doc.content||'');
      const chips = [];
      if (wc) chips.push(`<span class="stat-chip">${wc.toLocaleString()} words</span>`);
      if (doc.video_length) chips.push(`<span class="stat-chip">&#128338; ${doc.video_length}</span>`);
      const wpm = doc.video_length ? calcWpm(wc, parseMmSs(doc.video_length)) : null;
      if (wpm) chips.push(`<span class="stat-chip">${wpm} wpm</span>`);
      c.innerHTML = `<div class="recorded-card__info"><div class="recorded-card__title">${esc(doc.title)}</div><div class="recorded-card__meta">${dateStr?`<span>${dateStr}</span>`:''}${seriesStr}</div></div><div class="recorded-card__badges">${chips.join('')}<span class="idea-card__arrow">&#8250;</span></div>`;
      c.addEventListener('click', () => openRecordedDetail(doc.id));
      list.appendChild(c);
    });
  } catch(e) { showToast('Error loading Recorded', 'error'); }
}

async function openRecordedDetail(id) {
  const doc = await Storage.getRecordedById(id);
  if (!doc) return;
  currentRecordedId = id;
  document.getElementById('recorded-detail-title').textContent = doc.title;
  document.getElementById('recorded-detail-date').textContent = doc.recorded_at ? 'Recorded ' + formatDate(doc.recorded_at) : '';
  document.getElementById('recorded-detail-notes').innerHTML = doc.content || '';
  const wc = countWords(doc.content||'');
  await Storage.updateRecorded(id, { wordCount: wc });
  document.getElementById('stat-word-count').textContent = wc.toLocaleString();
  document.getElementById('stat-video-length').value = doc.video_length || '';
  updateWpmDisplay(wc, doc.video_length||'');
  showPage('recorded-detail');
}

function updateWpmDisplay(wordCount, lengthVal) {
  const secs = parseMmSs(lengthVal);
  const wpm = calcWpm(wordCount, secs);
  const wpmEl = document.getElementById('stat-wpm');
  const noteEl = document.getElementById('wpm-note');
  if (wpm) { wpmEl.textContent = wpm; noteEl.textContent = 'Based on notes word count'; }
  else { wpmEl.textContent = '—'; noteEl.textContent = 'Enter video length to calculate'; }
}

async function saveRecordedStats() {
  if (!currentRecordedId) return;
  const vl = document.getElementById('stat-video-length').value.trim();
  if (vl && !parseMmSs(vl)) {
    document.getElementById('stat-video-length').style.borderColor = '#a83232';
    setTimeout(() => document.getElementById('stat-video-length').style.borderColor = '', 1500);
    return;
  }
  try {
    const doc = await Storage.getRecordedById(currentRecordedId);
    const wc = countWords((doc||{}).content||'');
    await Storage.updateRecorded(currentRecordedId, { videoLength: vl, wordCount: wc });
    updateWpmDisplay(wc, vl);
    await renderRecorded(document.getElementById('recorded-search').value);
    showToast('Stats saved', 'success');
  } catch(e) { showToast('Error saving stats', 'error'); }
}

async function deleteCurrentRecorded() {
  if (!confirm('Delete this recorded entry? This cannot be undone.')) return;
  const id = currentRecordedId; currentRecordedId = null;
  try {
    if (id) await Storage.deleteRecorded(id);
    await renderRecorded(document.getElementById('recorded-search').value);
    showPage('recorded');
  } catch(e) { showToast('Delete failed', 'error'); }
}
