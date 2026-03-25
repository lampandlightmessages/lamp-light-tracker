// ── Storage — all database operations ───────────────────────
// All functions are async and return data or throw on error.
// user_id is injected automatically from the current session.

const Storage = (() => {

  async function uid() {
    const { data: { user } } = await sb.auth.getUser();
    return user.id;
  }

  // ── IDEAS ──────────────────────────────────────────────────
  async function getIdeas() {
    const { data, error } = await sb.from('ideas').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function saveIdea(idea) {
    const userId = await uid();
    const { data, error } = await sb.from('ideas').insert({
      user_id: userId,
      title: idea.title.trim(),
      notes: idea.notes.trim(),
      rating: idea.rating,
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function updateIdea(id, changes) {
    const payload = {};
    if (changes.title !== undefined) payload.title = changes.title;
    if (changes.notes !== undefined) payload.notes = changes.notes;
    if (changes.rating !== undefined) payload.rating = changes.rating;
    payload.updated_at = new Date().toISOString();
    const { data, error } = await sb.from('ideas').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteIdea(id) {
    const { error } = await sb.from('ideas').delete().eq('id', id);
    if (error) throw error;
  }

  async function getIdeaById(id) {
    const { data, error } = await sb.from('ideas').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  // ── WIP ────────────────────────────────────────────────────
  async function getWips() {
    const { data, error } = await sb.from('wip').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function saveWip(doc) {
    const userId = await uid();
    const { data, error } = await sb.from('wip').insert({
      user_id: userId,
      title: doc.title || 'Untitled',
      content: doc.content || '',
      status: doc.status || 'drafting',
      target_date: doc.targetDate || '',
      series: doc.series || '',
      linked_idea_id: doc.linkedIdeaId || null,
      linked_idea_title: doc.linkedIdeaTitle || '',
      linked_idea_notes: doc.linkedIdeaNotes || '',
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function updateWip(id, changes) {
    const payload = { updated_at: new Date().toISOString() };
    if (changes.title !== undefined) payload.title = changes.title;
    if (changes.content !== undefined) payload.content = changes.content;
    if (changes.status !== undefined) payload.status = changes.status;
    if (changes.targetDate !== undefined) payload.target_date = changes.targetDate;
    if (changes.series !== undefined) payload.series = changes.series;
    const { data, error } = await sb.from('wip').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteWip(id) {
    const { error } = await sb.from('wip').delete().eq('id', id);
    if (error) throw error;
  }

  async function getWipById(id) {
    const { data, error } = await sb.from('wip').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  // ── READY ──────────────────────────────────────────────────
  async function getReadys() {
    const { data, error } = await sb.from('ready').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function saveReady(doc) {
    const userId = await uid();
    const { data, error } = await sb.from('ready').insert({
      user_id: userId,
      title: doc.title || 'Untitled',
      content: doc.content || '',
      series: doc.series || '',
      source_wip_id: doc.sourceWipId || null,
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteReady(id) {
    const { error } = await sb.from('ready').delete().eq('id', id);
    if (error) throw error;
  }

  async function getReadyById(id) {
    const { data, error } = await sb.from('ready').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  // ── RECORDED ───────────────────────────────────────────────
  async function getRecorded() {
    const { data, error } = await sb.from('recorded').select('*').order('recorded_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function saveRecorded(doc) {
    const userId = await uid();
    const { data, error } = await sb.from('recorded').insert({
      user_id: userId,
      title: doc.title || 'Untitled',
      content: doc.content || '',
      series: doc.series || '',
      video_length: '',
      word_count: 0,
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function updateRecorded(id, changes) {
    const payload = {};
    if (changes.videoLength !== undefined) payload.video_length = changes.videoLength;
    if (changes.wordCount !== undefined) payload.word_count = changes.wordCount;
    const { data, error } = await sb.from('recorded').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteRecorded(id) {
    const { error } = await sb.from('recorded').delete().eq('id', id);
    if (error) throw error;
  }

  async function getRecordedById(id) {
    const { data, error } = await sb.from('recorded').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  // ── SETTINGS ───────────────────────────────────────────────
  async function getSettings() {
    const { data, error } = await sb.from('settings').select('*').maybeSingle();
    if (error || !data) return { return_on_save: true };
    return data;
  }

  async function saveSetting(key, value) {
    const userId = await uid();
    const col = key === 'returnOnSave' ? 'return_on_save' : key;
    await sb.from('settings').upsert({ user_id: userId, [col]: value }, { onConflict: 'user_id' });
  }

  // ── EXPORT ALL ─────────────────────────────────────────────
  async function exportAll() {
    const [ideas, wip, ready, recorded] = await Promise.all([
      getIdeas(), getWips(), getReadys(), getRecorded()
    ]);
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ideas, wip, ready, recorded }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lamp-light-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    getIdeas, saveIdea, updateIdea, deleteIdea, getIdeaById,
    getWips, saveWip, updateWip, deleteWip, getWipById,
    getReadys, saveReady, deleteReady, getReadyById,
    getRecorded, saveRecorded, updateRecorded, deleteRecorded, getRecordedById,
    getSettings, saveSetting, exportAll,
  };
})();
