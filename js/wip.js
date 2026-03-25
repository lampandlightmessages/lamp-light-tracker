// ── WIP ───────────────────────────────────────────────────────
let currentWipId = null;
let focusMode = false;
let autosaveTimer = null;

async function renderWips() {
  const list = document.getElementById('wip-list');
  const empty = document.getElementById('wip-empty');
  try {
    const docs = await Storage.getWips();
    list.innerHTML = '';
    if (!docs.length) { empty.classList.add('visible'); return; }
    empty.classList.remove('visible');
    docs.forEach(doc => {
      const c = document.createElement('div');
      c.className = 'wip-card';
      const dateStr = doc.updated_at ? formatDate(doc.updated_at) : '';
      const seriesStr = doc.series ? `<span>${esc(doc.series)}</span>` : '';
      c.innerHTML = `<div class="wip-card__info"><div class="wip-card__title">${esc(doc.title)}</div><div class="wip-card__meta">${dateStr?`<span>${dateStr}</span>`:''}${seriesStr}</div></div><div class="wip-card__right"><span class="status-badge ${doc.status}">${doc.status}</span><span class="idea-card__arrow">&#8250;</span></div>`;
      c.addEventListener('click', () => openWipEditor(doc.id));
      list.appendChild(c);
    });
  } catch(e) { showToast('Error loading WIP', 'error'); }
}

async function openWipEditor(id) {
  const doc = await Storage.getWipById(id);
  if (!doc) return;
  currentWipId = id;
  document.getElementById('editor-title').value = doc.title || '';
  document.getElementById('editor-content').innerHTML = doc.content || '';
  document.getElementById('meta-status').value = doc.status || 'drafting';
  document.getElementById('meta-date').value = doc.target_date || '';
  document.getElementById('meta-series').value = doc.series || '';
  const lw = document.getElementById('meta-linked-wrap');
  if (doc.linked_idea_title) {
    document.getElementById('meta-linked-title').textContent = doc.linked_idea_title;
    lw.style.display = 'block';
    const nw = document.getElementById('meta-linked-notes-wrap');
    const ne = document.getElementById('meta-linked-notes');
    if (doc.linked_idea_notes && doc.linked_idea_notes.trim()) {
      ne.textContent = doc.linked_idea_notes;
      nw.style.display = 'block';
    } else { nw.style.display = 'none'; }
  } else { lw.style.display = 'none'; }
  showPage('wip-editor');
}

async function newWipDoc(linkedIdeaId=null, titlePrefill='', linkedIdeaTitle='', linkedIdeaNotes='') {
  try {
    const doc = await Storage.saveWip({ title: titlePrefill, content: '', status: 'drafting', linkedIdeaId, linkedIdeaTitle, linkedIdeaNotes });
    await openWipEditor(doc.id);
  } catch(e) { showToast('Error creating document', 'error'); }
}

async function saveCurrentWip(showIndicator=true) {
  if (!currentWipId) return;
  try {
    await Storage.updateWip(currentWipId, {
      title: document.getElementById('editor-title').value.trim() || 'Untitled',
      content: document.getElementById('editor-content').innerHTML,
      status: document.getElementById('meta-status').value,
      targetDate: document.getElementById('meta-date').value,
      series: document.getElementById('meta-series').value.trim(),
    });
    await renderWips();
    if (showIndicator) showAutosaved();
  } catch(e) { showToast('Save failed', 'error'); }
}

function showAutosaving() {
  const el = document.getElementById('autosave-indicator');
  const tx = document.getElementById('autosave-text');
  el.classList.remove('saved'); el.classList.add('saving','visible');
  tx.textContent = 'Saving...';
}
function showAutosaved() {
  const el = document.getElementById('autosave-indicator');
  const tx = document.getElementById('autosave-text');
  el.classList.remove('saving'); el.classList.add('saved','visible');
  tx.textContent = 'Saved';
  setTimeout(() => el.classList.remove('visible'), 2500);
}
function scheduleAutosave() {
  showAutosaving();
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => saveCurrentWip(true), 1500);
}

function execFormat(cmd) {
  const ed = document.getElementById('editor-content'); ed.focus();
  if (cmd==='bold') document.execCommand('bold',false);
  else if (cmd==='italic') document.execCommand('italic',false);
  else if (cmd==='underline') document.execCommand('underline',false);
  else if (cmd==='ul') document.execCommand('insertUnorderedList',false);
  else if (cmd==='ol') document.execCommand('insertOrderedList',false);
  else if (cmd==='h1') document.execCommand('formatBlock',false,'<h1>');
  else if (cmd==='h2') document.execCommand('formatBlock',false,'<h2>');
  else if (cmd==='h3') document.execCommand('formatBlock',false,'<h3>');
  updateToolbarState();
}
function updateToolbarState() {
  document.querySelectorAll('.toolbar-btn[data-cmd]').forEach(btn => {
    const cmd = btn.dataset.cmd;
    if (['bold','italic','underline'].includes(cmd)) btn.classList.toggle('active', document.queryCommandState(cmd));
  });
}
function toggleFocusMode() {
  focusMode = !focusMode;
  document.body.classList.toggle('focus-mode', focusMode);
  const fb = document.getElementById('btn-focus-mode');
  fb.innerHTML = focusMode
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg> Exit Focus'
    : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg> Focus Mode';
  if (focusMode) document.getElementById('editor-content').focus();
}

async function deleteCurrentWip() {
  if (!confirm('Delete this document? This cannot be undone.')) return;
  clearTimeout(autosaveTimer);
  const id = currentWipId; currentWipId = null;
  try {
    if (id) await Storage.deleteWip(id);
    if (focusMode) toggleFocusMode();
    await renderWips();
    showPage('wip');
  } catch(e) { showToast('Delete failed', 'error'); }
}

async function promoteToReady() {
  if (!currentWipId) return;
  await saveCurrentWip(false);
  try {
    const doc = await Storage.getWipById(currentWipId);
    if (!doc) return;
    await Storage.saveReady({ title: doc.title, content: doc.content, series: doc.series, sourceWipId: doc.id });
    await Storage.deleteWip(currentWipId);
    currentWipId = null;
    await renderWips();
    await renderReadys();
    showPage('ready');
    showToast('Moved to Ready to Record', 'success');
  } catch(e) { showToast('Error promoting document', 'error'); }
}
