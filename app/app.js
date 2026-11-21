// Leonida Trophy Guide v2: checklist, filters, spoiler mode, roadmap, missable
// watch, sources with claim-level citations, and progress. Data comes from
// data/trophies.json (official names, descriptions and grades plus this guide's
// own words, numbered steps with source refs, kinds, stages, counts, watch list,
// story gates and disputes). Progress and counts live in localStorage and can be
// exported to a file and imported back. Nothing here reaches the network: the
// only fetch is the local data file.
const STORE_KEY = 'leonida-trophy-guide-v1';
const SPOILER_KEY = 'leonida-trophy-guide-spoiler';
const COUNTS_KEY = 'leonida-trophy-guide-counts-v1';

const KIND_LABELS = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', online: 'Online', platinum: 'Platinum' };

const grid = document.getElementById('grid');
const countLine = document.getElementById('count');
const searchBox = document.getElementById('search');
const gradePick = document.getElementById('grade');
const spoilerBox = document.getElementById('spoiler');

let data = null;
let trophies = [];
let sources = [];
let sourceById = new Map();
let earned = new Set(loadEarned());
let counts = loadCounts();
let kind = 'all';
let grade = 'all';
let query = '';
let spoiler = localStorage.getItem(SPOILER_KEY) === '1';
let openId = null;
let missablesRendered = false;
let sourcesRendered = false;

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'number') : [];
  } catch (_) {
    return [];
  }
}

function loadCounts() {
  try {
    const raw = JSON.parse(localStorage.getItem(COUNTS_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch (_) {
    return {};
  }
}

function saveEarned() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveCounts() {
  localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
}

function gradeWord(g) {
  return g === 'platinum' ? 'Platinum' : g[0].toUpperCase() + g.slice(1);
}

function isStoryHidden(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}

function matchesKind(t) {
  if (kind === 'all') return true;
  if (kind === 'missable') return t.missable;
  if (kind === 'online') return false;
  return t.kind === kind;
}

function visibleTrophies() {
  const q = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (!matchesKind(t)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function auditCounts() {
  let claims = 0;
  let cited = 0;
  let twoPlus = 0;
  for (const t of trophies) {
    for (const s of t.steps || []) {
      claims += 1;
      if (s.refs && s.refs.length > 0) cited += 1;
      if (s.refs && s.refs.length >= 2) twoPlus += 1;
    }
  }
  const sites = new Set(sources.map((s) => s.site)).size;
  const unconfirmed = trophies.filter((t) => t.unconfirmed).length;
  const watch = (data.watch || []).length;
  const possibly = (data.watch || []).filter((w) => w.risk === 'possibly-missable').length;
  return { claims, cited, twoPlus, pages: sources.length, sites, unconfirmed, watch, possibly, disputes: (data.disputes || []).length };
}

function renderAudit() {
  const a = auditCounts();
  const items = [
    [`55/55`, 'official name, description, grade'],
    [`${a.cited}/${a.claims}`, 'claims cited'],
    [`${a.twoPlus}`, 'backed by 2+ sources'],
    [`${a.pages} pages`, `${a.sites} sites · read ${data.read_date}`],
    [`${a.possibly} possibly missable`, `${a.watch - a.possibly} at risk · watch, not missable`],
    [`${a.unconfirmed} unconfirmed`, 'methods guides have not confirmed'],
    [`${a.disputes} disputes`, 'shown both ways'],
  ];
  document.getElementById('audit').innerHTML = items
    .map(([v, l]) => `<div class="audit-item"><strong>${v}</strong><span>${l}</span></div>`)
    .join('');
}

function renderFacts() {
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let hidden = 0;
  for (const t of trophies) {
    byGrade[t.grade] += 1;
    if (t.hidden) hidden += 1;
  }
  document.getElementById('facts').innerHTML = [
    ['55', 'trophies'],
    ['1', 'platinum'],
    ['2', 'gold'],
    ['6', 'silver'],
    ['46', 'bronze'],
    [String(hidden), 'hidden'],
    ['1', 'missable'],
    ['~200 h', 'to platinum'],
  ].map(([v, l]) => `<div class="fact"><strong>${v}</strong><span>${l}</span></div>`).join('');
}

function renderProgress() {
  const total = trophies.length;
  const got = earned.size;
  const pct = total ? Math.round((got / total) * 100) : 0;
  document.getElementById('progressText').textContent = `${got} of ${total} earned`;
  document.getElementById('progressSub').textContent = `${pct}% to the platinum`;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressBar').setAttribute('aria-valuenow', String(got));
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const gotByGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    byGrade[t.grade] += 1;
    if (earned.has(t.id)) gotByGrade[t.grade] += 1;
  }
  document.getElementById('gradeCounts').innerHTML = Object.keys(byGrade)
    .map((g) => `<span class="gcount ${g}">${gradeWord(g)} ${gotByGrade[g]}/${byGrade[g]}</span>`)
    .join('');
}

function renderNextUp() {
  const list = document.getElementById('nextUp');
  const upcoming = trophies
    .filter((t) => !earned.has(t.id))
    .sort((a, b) => (a.stage - b.stage) || (a.id - b.id))
    .slice(0, 5);
  list.innerHTML = upcoming.map((t) => {
    const name = isStoryHidden(t) ? 'Hidden story trophy' : t.name;
    return `<li><button type="button" data-next="${t.id}"><strong>${name}</strong> <span>Stage ${t.stage} · ${gradeWord(t.grade)}${t.risk ? ' · ' + (t.risk === 'possibly-missable' ? 'possibly missable' : 'watch') : ''}</span></button></li>`;
  }).join('');
  list.querySelectorAll('[data-next]').forEach((b) => {
    b.addEventListener('click', () => {
      openId = Number(b.dataset.next);
      renderGrid();
      document.querySelector(`[data-card="${openId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

function renderStages() {
  const list = document.getElementById('stages');
  list.innerHTML = '';
  for (const s of data.stages) {
    const members = trophies.filter((t) => t.stage === s.n);
    const got = members.filter((t) => earned.has(t.id)).length;
    const li = document.createElement('li');
    li.className = 'stage';
    const chips = members.map((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (earned.has(t.id) ? ' done' : '');
      b.textContent = isStoryHidden(t) ? 'Hidden trophy' : t.name;
      b.addEventListener('click', () => {
        switchTab('tracker');
        openId = t.id;
        renderGrid();
        document.querySelector(`[data-card="${t.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return b;
    });
    const refs = (s.refs || []).map((r) => `[${r}]`).join(' ');
    li.innerHTML = `<div class="stage-head"><span class="stage-no">Stage ${s.n}</span><h3>${s.title}</h3><span class="stage-meta">${s.hours} · ${s.difficulty}</span><span class="stage-count">${got}/${members.length}</span></div><p>${s.blurb}</p><p class="stage-watch">Watch: ${(s.watch || []).join(' · ')}</p><p class="stage-refs">Sources ${refs}</p>`;
    const wrap = document.createElement('div');
    wrap.className = 'chips';
    for (const c of chips) wrap.append(c);
    li.append(wrap);
    list.append(li);
  }
}

function refSpans(refs) {
  return (refs || []).map((r) => `<span class="ref">[${r}]</span>`).join(' ');
}

function cardFor(t) {
  const hiddenStory = isStoryHidden(t);
  const card = document.createElement('article');
  card.className = 'card' + (earned.has(t.id) ? ' earned' : '') + (t.missable ? ' missable' : '') + (t.risk === 'watch' ? ' watchcard' : '');
  card.dataset.card = String(t.id);
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id);
    else earned.delete(t.id);
    saveEarned();
    renderAll();
  });
  const flags = [];
  if (t.hidden) flags.push('<span class="flag hidden-flag">Hidden</span>');
  if (t.missable) flags.push('<span class="flag missable-flag">Missable</span>');
  if (t.risk === 'watch') flags.push('<span class="flag watch-flag">Watch</span>');
  if (t.unconfirmed) flags.push('<span class="flag unconfirmed-flag">Unconfirmed</span>');
  if (t.count) flags.push(`<span class="flag count-flag">${t.count} ${t.count_label}</span>`);
  flags.push(`<span class="flag kind-flag">${KIND_LABELS[t.kind] || t.kind}</span>`);
  const name = hiddenStory ? 'Hidden story trophy' : t.name;
  const desc = hiddenStory ? 'Hidden on PlayStation until earned. Tick it earned to reveal it.' : t.description;
  card.innerHTML = `
    <div class="card-top">
      <span class="badge ${t.grade}">${gradeWord(t.grade)}</span>
      <div class="card-titles"><h3>${name}</h3><p class="desc">${desc}</p></div>
    </div>
    <div class="flags">${flags.join('')}</div>`;
  const head = card.querySelector('.card-top');
  head.prepend(box);
  const body = document.createElement('div');
  body.className = 'guide-body';
  if (openId === t.id) {
    if (hiddenStory) {
      body.innerHTML = '<p class="guide">Guide hidden by spoiler-free mode. Tick the trophy earned to reveal it.</p>';
    } else {
      const usedRefs = [];
      for (const s of t.steps || []) for (const r of s.refs || []) if (!usedRefs.includes(r)) usedRefs.push(r);
      const stepsHtml = (t.steps || []).map((s, i) =>
        `<li><span class="step-no">${i + 1}.</span> ${s.text} ${refSpans(s.refs)}</li>`).join('');
      const srcLine = usedRefs.map((r) => {
        const src = sourceById.get(r);
        return src ? `[${r}] ${src.site}` : `[${r}]`;
      }).join(' · ');
      let extra = '';
      if (t.dispute) {
        extra += `<div class="dispute-box"><p><strong>Sources differ — both versions shown</strong></p><p>A · ${t.dispute.a}</p><p>B · ${t.dispute.b}</p><p><strong>Our call:</strong> ${t.dispute.call}</p></div>`;
      }
      if (t.count) {
        const n = Math.min(counts[t.id] || 0, t.count);
        extra += `<div class="counter" data-counter="${t.id}"><button type="button" data-dec="${t.id}" aria-label="Decrease count">−</button><span><strong>${n} / ${t.count}</strong> ${t.count_label}</span><button type="button" data-inc="${t.id}" aria-label="Increase count">+</button></div>`;
      }
      body.innerHTML = `<ol class="steps">${stepsHtml}</ol>${extra}<p class="sources">Sources: ${srcLine}</p><p class="stage-line">Roadmap: Stage ${t.stage} — ${data.stages[t.stage - 1].title}</p>`;
      body.querySelectorAll('[data-inc]').forEach((b) => b.addEventListener('click', () => {
        counts[t.id] = Math.min((counts[t.id] || 0) + 1, t.count);
        saveCounts();
        renderGrid();
      }));
      body.querySelectorAll('[data-dec]').forEach((b) => b.addEventListener('click', () => {
        counts[t.id] = Math.max((counts[t.id] || 0) - 1, 0);
        saveCounts();
        renderGrid();
      }));
    }
    body.hidden = false;
  } else {
    body.hidden = true;
  }
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  toggle.textContent = openId === t.id ? 'Hide guide ▲' : 'Read the guide ▼';
  toggle.addEventListener('click', () => {
    openId = openId === t.id ? null : t.id;
    renderGrid();
  });
  card.append(body, toggle);
  return card;
}

function renderGrid() {
  const list = visibleTrophies();
  grid.replaceChildren();
  if (kind === 'online') {
    const note = document.createElement('p');
    note.className = 'empty';
    note.textContent = 'No online trophies: all 55 are offline and single-player, so there is nothing to track here.';
    grid.append(note);
  }
  for (const t of list) grid.append(cardFor(t));
  const shown = list.length;
  countLine.textContent = kind === 'online'
    ? '0 of 55 trophies · online filter'
    : `${shown} of ${trophies.length} trophies shown · ${earned.size} earned`;
}

function renderWatch() {
  const cols = ['Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5', 'Post'];
  const head = `<tr><th>Trophy</th>${cols.map((c) => `<th>${c}</th>`).join('')}<th>Risk</th></tr>`;
  const rows = (data.watch || []).map((w) => {
    const t = trophies.find((x) => x.id === w.id);
    if (!t) return '';
    const cells = cols.map((c) => {
      if (w.last === c) return w.risk === 'possibly-missable' ? '<td class="cell-last">LAST</td>' : '<td class="cell-watch">WATCH</td>';
      if (w.last === 'Post' && c === 'Post') return '<td class="cell-safe">safe</td>';
      if (w.last === '?' && c === 'Post') return '<td class="cell-unknown">?</td>';
      return '<td></td>';
    }).join('');
    return `<tr><td class="watch-name"><strong>${t.name}</strong><br><span>${t.description}</span></td>${cells}<td>${w.risk === 'possibly-missable' ? '<span class="flag missable-flag">Possibly missable</span>' : '<span class="flag watch-flag">Watch</span>'}</td></tr>`;
  }).join('');
  document.getElementById('watchGrid').innerHTML = head + rows;
  document.getElementById('watchNotes').innerHTML = (data.watch || []).map((w) => {
    const t = trophies.find((x) => x.id === w.id);
    if (!t) return '';
    const refs = (w.refs || []).map((r) => `[${r}]`).join(' ');
    return `<div class="watch-note"><h3>${t.name} <span class="flag ${w.risk === 'possibly-missable' ? 'missable-flag' : 'watch-flag'}">${w.risk === 'possibly-missable' ? 'Possibly missable' : 'Watch'}</span></h3><p>${w.note} <span class="refs-inline">Sources ${refs}</span></p></div>`;
  }).join('') + `<p class="why-one"><strong>Why only one missable?</strong> Some guides list more trophies as “at risk”, but PowerPyx, KeenGamer and TechForNerd all agree: every quest giver for a trophy returns in free-roam after the story, and timed hourglass missions need no trophy. The eight above are watch items because their strands or partners need a little planning — not because they can lock you out.</p>`;
  document.getElementById('gates').innerHTML = (data.gates || []).map((g) => {
    const refs = (g.refs || []).map((r) => `[${r}]`).join(' ');
    return `<li class="gate"><div class="stage-head"><span class="stage-no">Chapter ${g.chapter}</span><h3>${g.title}</h3></div><p class="gate-missions">${g.missions.join(' · ')}</p><p>${g.note}</p><p class="stage-refs">Sources ${refs}</p></li>`;
  }).join('');
  document.getElementById('disputes').innerHTML = (data.disputes || []).map((d) =>
    `<div class="dispute-box"><p><strong>${d.topic}</strong></p><p>A · ${d.a}</p><p>B · ${d.b}</p><p><strong>Our call:</strong> ${d.call}</p></div>`).join('');
}

function renderSourcesTab() {
  document.getElementById('sourceList').innerHTML = sources.map((s) =>
    `<li><strong>[${s.id}] ${s.site}</strong> — ${s.title}${s.url ? ` <span class="src-url">${s.url}</span>` : ''} <span class="src-read">read ${s.read}</span></li>`).join('');
  const head = `<tr><th>Trophy</th>${sources.map((s) => `<th>${s.id}</th>`).join('')}</tr>`;
  const rows = trophies.map((t) => {
    const used = new Set();
    for (const step of t.steps || []) for (const r of step.refs || []) used.add(r);
    const cells = sources.map((s) => `<td class="${used.has(s.id) ? 'm-on' : ''}">${used.has(s.id) ? '●' : ''}</td>`).join('');
    return `<tr><td class="matrix-name">${t.name}</td>${cells}</tr>`;
  }).join('');
  document.getElementById('matrix').innerHTML = head + rows;
}

function switchTab(name) {
  document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  document.querySelectorAll('.tabpage').forEach((p) => { p.hidden = p.id !== 'tab-' + name; });
  if (name === 'missables' && !missablesRendered) { renderWatch(); missablesRendered = true; }
  if (name === 'sources' && !sourcesRendered) { renderSourcesTab(); sourcesRendered = true; }
}

function renderAll() {
  renderFacts();
  renderAudit();
  renderProgress();
  renderNextUp();
  renderStages();
  renderGrid();
}

document.querySelectorAll('[data-tab]').forEach((b) => {
  b.addEventListener('click', () => switchTab(b.dataset.tab));
});
document.querySelectorAll('[data-kind]').forEach((b) => {
  b.addEventListener('click', () => {
    kind = b.dataset.kind;
    document.querySelectorAll('[data-kind]').forEach((x) => x.classList.toggle('on', x === b));
    renderGrid();
  });
});
gradePick.addEventListener('change', () => { grade = gradePick.value; renderGrid(); });
searchBox.addEventListener('input', () => { query = searchBox.value; renderGrid(); });
spoilerBox.checked = spoiler;
spoilerBox.addEventListener('change', () => {
  spoiler = spoilerBox.checked;
  localStorage.setItem(SPOILER_KEY, spoiler ? '1' : '0');
  renderAll();
});

document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b), counts }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    const valid = new Set(trophies.map((t) => t.id));
    earned = new Set((Array.isArray(ids) ? ids : []).filter((x) => valid.has(x)));
    if (parsed && parsed.counts) {
      counts = {};
      for (const [k, v] of Object.entries(parsed.counts)) {
        const t = trophies.find((x) => x.id === Number(k));
        if (t && t.count) counts[t.id] = Math.max(0, Math.min(Number(v) || 0, t.count));
      }
    }
    saveEarned();
    saveCounts();
    renderAll();
  } catch (_) {
    alert('That file is not a trophy progress export.');
  }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Clear all earned trophies and counts?')) {
    earned = new Set();
    counts = {};
    saveEarned();
    saveCounts();
    renderAll();
  }
});

data = await (await fetch('data/trophies.json')).json();
trophies = data.trophies;
sources = data.sources || [];
sourceById = new Map(sources.map((s) => [s.id, s]));
renderAll();
