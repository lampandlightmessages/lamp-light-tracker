// ── APP INIT ──────────────────────────────────────────────────

async function bootApp() {
  // Load settings
  try {
    const settings = await Storage.getSettings();
    const rt = document.getElementById('setting-return-on-save');
    rt.checked = settings.return_on_save !== false;
    rt.addEventListener('change', () => Storage.saveSetting('returnOnSave', rt.checked));
  } catch(e) { /* settings table may be empty on first boot */ }

  // Load all data
  await Promise.all([renderIdeas(), renderWips(), renderReadys(), renderRecorded(), renderOverview()]);

  showPage('ideas');
  showApp();
}

document.addEventListener('DOMContentLoaded', async () => {

  // ── Auth screen wiring ──────────────────────────────────────
  let authMode = 'signin';

  document.getElementById('btn-toggle-auth').addEventListener('click', () => {
    authMode = authMode === 'signin' ? 'signup' : 'signin';
    document.getElementById('btn-sign-in').textContent = authMode === 'signin' ? 'Sign In' : 'Sign Up';
    document.getElementById('btn-toggle-auth').textContent = authMode === 'signin'
      ? "Don't have an account? Sign Up"
      : 'Already have an account? Sign In';
    document.getElementById('auth-error').style.display = 'none';
  });

  document.getElementById('btn-sign-in').addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error');
    errEl.style.display = 'none';

    if (!email || !password) {
      errEl.textContent = 'Please enter your email and password.';
      errEl.style.display = 'block';
      return;
    }

    showLoading();

    let result;
    if (authMode === 'signin') {
      result = await sb.auth.signInWithPassword({ email, password });
    } else {
      result = await sb.auth.signUp({ email, password });
    }

    if (result.error) {
      showAuthScreen();
      errEl.textContent = result.error.message;
      errEl.style.display = 'block';
      return;
    }

    if (authMode === 'signup' && result.data?.user?.identities?.length === 0) {
      showAuthScreen();
      errEl.textContent = 'This email is already registered. Please sign in.';
      errEl.style.display = 'block';
      return;
    }

    await bootApp();
  });

  // Allow Enter key on password field
  document.getElementById('auth-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-sign-in').click();
  });

  // ── Check existing session ──────────────────────────────────
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    await bootApp();
  } else {
    showAuthScreen();
  }

  // ── Settings ────────────────────────────────────────────────
  document.getElementById('btn-hamburger').addEventListener('click', openSettings);
  document.getElementById('btn-settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-overlay').addEventListener('click', closeSettings);

  // ── Nav (top + bottom) ──────────────────────────────────────
  document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));
  document.querySelectorAll('.bottom-nav__btn').forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));

  // ── Ideas ───────────────────────────────────────────────────
  document.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    currentFilter = b.dataset.filter;
    renderIdeas();
  }));

  document.getElementById('btn-add-idea').addEventListener('click', () => {
    document.getElementById('idea-title').value = '';
    document.getElementById('idea-notes').value = '';
    addRating = 3;
    document.querySelectorAll('#add-rating-picker .rating-opt').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.val) === 3));
    showPage('add-idea');
  });

  document.querySelectorAll('#add-rating-picker .rating-opt').forEach(b => b.addEventListener('click', () => {
    addRating = parseInt(b.dataset.val);
    document.querySelectorAll('#add-rating-picker .rating-opt').forEach(x => x.classList.toggle('selected', x === b));
  }));

  document.getElementById('btn-save-idea').addEventListener('click', async () => {
    const title = document.getElementById('idea-title').value.trim();
    if (!title) {
      const inp = document.getElementById('idea-title');
      inp.style.borderColor = '#a83232'; inp.focus();
      setTimeout(() => inp.style.borderColor = '', 1500);
      return;
    }
    try {
      await Storage.saveIdea({ title, notes: document.getElementById('idea-notes').value, rating: addRating });
      showPage('ideas');
      await renderIdeas();
    } catch(e) { showToast('Error saving idea', 'error'); }
  });

  document.getElementById('btn-back-from-add').addEventListener('click', () => showPage('ideas'));
  document.getElementById('btn-back-from-detail').addEventListener('click', () => showPage('ideas'));

  document.querySelectorAll('#detail-rating-picker .rating-opt').forEach(b => b.addEventListener('click', () => {
    detailRating = parseInt(b.dataset.val);
    document.querySelectorAll('#detail-rating-picker .rating-opt').forEach(x => x.classList.toggle('selected', x === b));
  }));

  document.getElementById('btn-save-detail').addEventListener('click', async () => {
    if (!currentDetailId) return;
    const title = document.getElementById('detail-title-input').value.trim();
    if (!title) {
      const inp = document.getElementById('detail-title-input');
      inp.style.borderColor = '#a83232'; inp.focus();
      setTimeout(() => inp.style.borderColor = '', 1500);
      return;
    }
    try {
      await Storage.updateIdea(currentDetailId, { title, notes: document.getElementById('detail-notes-input').value, rating: detailRating });
      await renderIdeas();
      if (document.getElementById('setting-return-on-save').checked) {
        showPage('ideas');
      } else {
        const btn = document.getElementById('btn-save-detail'), hint = document.getElementById('detail-save-hint');
        btn.textContent = 'Saved \u2713'; btn.classList.add('saved'); hint.textContent = 'Changes saved.';
        setTimeout(() => { btn.textContent = 'Save Changes'; btn.classList.remove('saved'); hint.textContent = ''; }, 2200);
      }
    } catch(e) { showToast('Error saving idea', 'error'); }
  });

  document.getElementById('btn-delete-idea').addEventListener('click', async () => {
    if (!currentDetailId) return;
    if (confirm('Delete this idea? This cannot be undone.')) {
      try {
        await Storage.deleteIdea(currentDetailId);
        showPage('ideas');
        await renderIdeas();
      } catch(e) { showToast('Delete failed', 'error'); }
    }
  });

  document.getElementById('btn-promote-idea').addEventListener('click', async () => {
    if (!currentDetailId) return;
    const idea = await Storage.getIdeaById(currentDetailId);
    if (!idea) return;
    const idToRemove = currentDetailId;
    currentDetailId = null;
    try {
      await Storage.deleteIdea(idToRemove);
      await renderIdeas();
      await newWipDoc(idea.id, idea.title, idea.title, idea.notes);
      showToast('Moved to Work in Progress', 'success');
    } catch(e) { showToast('Error promoting idea', 'error'); }
  });

  // ── WIP ─────────────────────────────────────────────────────
  document.getElementById('btn-add-wip').addEventListener('click', () => newWipDoc());

  document.getElementById('btn-back-from-editor').addEventListener('click', async () => {
    await saveCurrentWip();
    if (focusMode) toggleFocusMode();
    showPage('wip');
    await renderWips();
  });

  document.querySelectorAll('.toolbar-btn[data-cmd]').forEach(btn => btn.addEventListener('click', () => execFormat(btn.dataset.cmd)));

  document.getElementById('editor-content').addEventListener('keyup', () => { updateToolbarState(); scheduleAutosave(); });
  document.getElementById('editor-content').addEventListener('mouseup', updateToolbarState);
  ['meta-status','meta-date','meta-series','editor-title'].forEach(id => {
    document.getElementById(id).addEventListener('change', scheduleAutosave);
    document.getElementById(id).addEventListener('input', scheduleAutosave);
  });

  document.getElementById('btn-focus-mode').addEventListener('click', toggleFocusMode);

  // ── Recorded ────────────────────────────────────────────────
  document.getElementById('recorded-search').addEventListener('input', e => renderRecorded(e.target.value));
  document.getElementById('btn-back-from-recorded-detail').addEventListener('click', () => showPage('recorded'));
  document.getElementById('stat-video-length').addEventListener('input', () => {
    const wc = parseInt(document.getElementById('stat-word-count').textContent.replace(/,/g,'')) || 0;
    updateWpmDisplay(wc, document.getElementById('stat-video-length').value);
  });

  // ── Keyboard shortcuts ───────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (recordingMode) { toggleRecordingMode(); return; }
      if (focusMode) { toggleFocusMode(); return; }
    }
  });
});
