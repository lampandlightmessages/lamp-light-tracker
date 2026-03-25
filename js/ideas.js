// ── IDEAS ─────────────────────────────────────────────────────
let currentFilter = 'all';
let currentDetailId = null;
let addRating = 3;
let detailRating = null;

async function renderIdeas() {
  const list = document.getElementById('ideas-list');
  const empty = document.getElementById('ideas-empty');
  try {
    let ideas = await Storage.getIdeas();
    if (currentFilter !== 'all') ideas = ideas.filter(i => i.rating === parseInt(currentFilter));
    list.innerHTML = '';
    if (!ideas.length) { empty.classList.add('visible'); return; }
    empty.classList.remove('visible');
    ideas.forEach(idea => {
      const c = document.createElement('div');
      c.className = 'idea-card';
      c.innerHTML = `<span class="idea-card__title">${esc(idea.title)}</span><div class="idea-card__meta"><div class="idea-card__stars">${starsHTML(idea.rating)}</div><span class="idea-card__arrow">&#8250;</span></div>`;
      c.addEventListener('click', () => openIdeaDetail(idea.id));
      list.appendChild(c);
    });
  } catch(e) { showToast('Error loading ideas', 'error'); }
}

async function openIdeaDetail(id) {
  const idea = await Storage.getIdeaById(id);
  if (!idea) return;
  currentDetailId = id;
  detailRating = idea.rating;
  document.getElementById('detail-date-display').textContent = 'Added ' + formatDate(idea.created_at) + (idea.updated_at !== idea.created_at ? '  ·  Edited ' + formatDate(idea.updated_at) : '');
  document.getElementById('detail-title-input').value = idea.title;
  document.getElementById('detail-notes-input').value = idea.notes || '';
  document.getElementById('detail-save-hint').textContent = '';
  const sb2 = document.getElementById('btn-save-detail');
  sb2.textContent = 'Save Changes'; sb2.classList.remove('saved');
  document.querySelectorAll('#detail-rating-picker .rating-opt').forEach(b => b.classList.toggle('selected', parseInt(b.dataset.val) === idea.rating));
  showPage('idea-detail');
}
