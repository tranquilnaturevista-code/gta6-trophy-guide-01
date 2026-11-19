// Leonida Legend — the tracker. Loads app/data/trophies.json (a file of this app,
// never the network), renders the checklist, the roadmap and the guides, and keeps
// progress in localStorage. Export writes a JSON file; import reads one back.
const STORE_KEY = 'leonida-legend-v1';
const KIND_LABELS = {
  story: 'Story',
  collectibles: 'Collectibles',
  activities: 'Activities',
  platinum: 'Platinum & 100%',
};
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

const listEl = document.getElementById('list');
const stagesEl = document.getElementById('stages');
const emptyNotice = document.getElementById('emptyNotice');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const statusEl = document.getElementById('status');
const spoilersEl = document.getElementById('spoilers');
const sourceListEl = document.getElementById('sourceList');

let store = loadStore();
let doc = null;

function loadStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
    if (raw && Array.isArray(raw.earned)) {
      return { earned: new Set(raw.earned), spoilers: raw.spoilers === true };
    }
  } catch {
    // A corrupt store starts empty rather than breaking the page.
  }
  return { earned: new Set(), spoilers: false };
}

function saveStore() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...store.earned].sort((a, b) => a - b),
    spoilers: store.spoilers,
  }));
}

function gradeOf(t) { return GRADE_LABELS[t.grade] ?? t.grade; }

function isHidden(t) { return t.hidden === true; }

function spoilerMasks(t) {
  return store.spoilers && isHidden(t) && !store.earned.has(t.id);
}

function matchesFilters(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = [t.name, t.description, t.guide, gradeOf(t), KIND_LABELS[t.kind] ?? '']
      .join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (kindEl.value === 'missable') {
    if (!t.missable) return false;
  } else if (kindEl.value !== 'all' && t.kind !== kindEl.value) {
    return false;
  }
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (statusEl.value === 'earned' && !store.earned.has(t.id)) return false;
  if (statusEl.value === 'remaining' && store.earned.has(t.id)) return false;
  return true;
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function badge(text, cls) { return el('span', 'badge ' + cls, text); }

function renderProgress() {
  const total = doc.trophies.length;
  const earned = store.earned.size;
  document.getElementById('progressText').textContent = earned + ' of ' + total + ' earned';
  document.getElementById('miniProgress').textContent = earned + ' / ' + total + ' earned';
  document.getElementById('progressDetail').textContent =
    earned === total ? 'Platinum earned — you are a Leonida Legend.'
    : Math.round((earned / total) * 100) + '% of the way to the platinum';
  document.getElementById('progressFill').style.width = (earned / total) * 100 + '%';
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const inGrade = doc.trophies.filter((t) => t.grade === g);
    const got = inGrade.filter((t) => store.earned.has(t.id)).length;
    return gradeOf({ grade: g }) + ' ' + got + '/' + inGrade.length;
  });
  document.getElementById('gradeCounts').textContent = counts.join(' · ');
}

function renderStages() {
  stagesEl.replaceChildren();
  for (const stage of doc.roadmap) {
    const card = el('div', 'stage');
    const title = el('h3');
    title.append(el('span', 'stage-num', String(stage.stage)), document.createTextNode(stage.title));
    card.append(title);
    card.append(el('p', null, stage.text));
    const done = stage.trophies.filter((id) => store.earned.has(id)).length;
    card.append(el('p', 'stage-progress', done + ' of ' + stage.trophies.length + ' earned in this stage'));
    const chips = el('ul');
    for (const id of stage.trophies) {
      const t = doc.trophies.find((x) => x.id === id);
      if (!t) continue;
      const li = el('li', store.earned.has(id) ? 'done' : (t.missable ? 'missable' : ''), t.name);
      if (t.missable) li.title = 'Possibly missable';
      chips.append(li);
    }
    card.append(chips);
    stagesEl.append(card);
  }
}

function renderSources() {
  sourceListEl.replaceChildren();
  for (const s of doc.sources) {
    const li = el('li');
    const a = el('a', null, s.name);
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    li.append(a);
    if (s.note) li.append(document.createTextNode(' — ' + s.note));
    sourceListEl.append(li);
  }
}

function renderList() {
  listEl.replaceChildren();
  let shown = 0;
  for (const t of doc.trophies) {
    if (!matchesFilters(t)) continue;
    shown += 1;
    const card = el('article', 'trophy' + (store.earned.has(t.id) ? ' earned' : ''));
    card.id = 'trophy-' + t.id;

    const top = el('div', 'trophy-top');
    const checkWrap = el('label', 'trophy-check');
    checkWrap.title = store.earned.has(t.id) ? 'Earned — click to unmark' : 'Mark as earned';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = store.earned.has(t.id);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', () => {
      if (box.checked) store.earned.add(t.id);
      else store.earned.delete(t.id);
      saveStore();
      renderAll();
    });
    checkWrap.append(box);
    top.append(checkWrap);

    const head = el('div', 'trophy-head');
    const masked = spoilerMasks(t);
    head.append(el('h3', null, masked ? 'Hidden trophy' : t.name));
    head.append(el('p', 'official', masked
      ? 'Hidden on PlayStation until earned. Earn it (or turn spoilers off) to reveal it.'
      : t.description));
    if (t.count) head.append(el('p', 'count', 'PlayStation tracks a count for this one: ' + t.count + '.'));
    top.append(head);

    const badges = el('div', 'badges');
    badges.append(badge(gradeOf(t), t.grade));
    if (isHidden(t)) badges.append(badge('Hidden', 'hidden'));
    if (t.missable) badges.append(badge('Missable', 'missable'));
    badges.append(badge(KIND_LABELS[t.kind] ?? t.kind, 'kind'));
    top.append(badges);
    card.append(top);

    if (!masked) {
      const guide = el('div', 'guide');
      guide.append(el('h4', null, 'Guide'));
      for (const para of t.guide.split('\n')) {
        if (para.trim()) guide.append(el('p', null, para.trim()));
      }
      const sources = el('p', 'sources', 'Sources: ');
      (t.sources ?? []).forEach((s, i) => {
        if (i > 0) sources.append(document.createTextNode(' · '));
        const a = el('a', null, s.name);
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'noopener';
        sources.append(a);
      });
      guide.append(sources);
      card.append(guide);
    }
    listEl.append(card);
  }
  emptyNotice.hidden = shown !== 0;
  document.getElementById('listIntro').textContent =
    'Official names, descriptions and grades as published on PlayStation (Exophase and ' +
    'PSNProfiles, 18 Nov 2026). Each guide is written for this page, in our own words, ' +
    'with its sources named beside it. Showing ' + shown + ' of ' + doc.trophies.length + ' trophies.';
}

function renderAll() {
  renderProgress();
  renderStages();
  renderList();
}

function applyHash() {
  const hash = location.hash;
  if (hash === '#spoiler') {
    store.spoilers = true;
    spoilersEl.checked = true;
    saveStore();
    renderAll();
    return;
  }
  const match = /^#trophy-(\d+)$/.exec(hash);
  if (match) {
    const card = document.getElementById('trophy-' + match[1]);
    if (card) card.scrollIntoView({ block: 'center' });
  }
}

document.getElementById('export').addEventListener('click', () => {
  const payload = {
    app: 'leonida-legend',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...store.earned].sort((a, b) => a - b),
    spoilers: store.spoilers,
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const known = new Set(doc.trophies.map((t) => t.id));
    store.earned = new Set(ids.filter((id) => known.has(id)));
    if (typeof data.spoilers === 'boolean') store.spoilers = data.spoilers;
    saveStore();
    spoilersEl.checked = store.spoilers;
    renderAll();
  } catch {
    alert('That file is not a Leonida Legend progress export.');
  }
  event.target.value = '';
});

document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  store.earned = new Set();
  saveStore();
  renderAll();
});

for (const control of [searchEl, kindEl, gradeEl, statusEl]) {
  control.addEventListener(control === searchEl ? 'input' : 'change', renderList);
}
spoilersEl.addEventListener('change', () => {
  store.spoilers = spoilersEl.checked;
  saveStore();
  renderAll();
});
window.addEventListener('hashchange', applyHash);

const response = await fetch('data/trophies.json');
doc = await response.json();
spoilersEl.checked = store.spoilers;
renderSources();
renderAll();
applyHash();
// Readiness signal for the screenshot script (scripts/shots.mjs): the page is
// fully rendered once this is true.
window.__shotReady = true;
