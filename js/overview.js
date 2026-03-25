// ── OVERVIEW ──────────────────────────────────────────────────
async function renderOverview() {
  try {
    const [ideas, wip, ready, recorded] = await Promise.all([
      Storage.getIdeas(), Storage.getWips(), Storage.getReadys(), Storage.getRecorded()
    ]);

    const counts = { ideas: ideas.length, wip: wip.length, rtr: ready.length, recorded: recorded.length };
    document.getElementById('ov-count-ideas').textContent = counts.ideas;
    document.getElementById('ov-count-wip').textContent = counts.wip;
    document.getElementById('ov-count-rtr').textContent = counts.rtr;
    document.getElementById('ov-count-recorded').textContent = counts.recorded;

    const max = Math.max(counts.ideas, counts.wip, counts.rtr, counts.recorded, 1);
    document.getElementById('ov-bar-ideas').style.width = Math.round((counts.ideas/max)*100)+'%';
    document.getElementById('ov-bar-wip').style.width = Math.round((counts.wip/max)*100)+'%';
    document.getElementById('ov-bar-rtr').style.width = Math.round((counts.rtr/max)*100)+'%';
    document.getElementById('ov-bar-recorded').style.width = Math.round((counts.recorded/max)*100)+'%';

    document.querySelectorAll('.pipeline-card[data-page-link]').forEach(card => {
      card.onclick = () => showPage(card.dataset.pageLink);
    });

    const withStats = recorded.filter(d => d.video_length && parseMmSs(d.video_length));
    const noStatsEl = document.getElementById('ov-no-stats');
    const statsWrapEl = document.getElementById('ov-stats-wrap');

    if (!withStats.length) {
      statsWrapEl.style.opacity = '0.35';
      noStatsEl.style.display = 'block';
      document.getElementById('ov-avg-words').textContent = '—';
      document.getElementById('ov-avg-duration').textContent = '—';
      document.getElementById('ov-avg-wpm').textContent = '—';
      return;
    }

    statsWrapEl.style.opacity = '1';
    noStatsEl.style.display = 'none';
    const totalWords = withStats.reduce((s,d) => s + (d.word_count || countWords(d.content||'')), 0);
    const totalSecs = withStats.reduce((s,d) => s + parseMmSs(d.video_length), 0);
    const avgWords = Math.round(totalWords / withStats.length);
    const avgMins = (Math.round(totalSecs / withStats.length) / 60).toFixed(1);
    const avgWpm = calcWpm(totalWords, totalSecs);
    document.getElementById('ov-avg-words').textContent = avgWords.toLocaleString();
    document.getElementById('ov-avg-duration').textContent = avgMins;
    document.getElementById('ov-avg-wpm').textContent = avgWpm || '—';
  } catch(e) {
    showToast('Error loading overview', 'error');
  }
}
