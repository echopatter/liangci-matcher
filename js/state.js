// Persistent state: settings, per classifier mastery, and the personal
// confusion matrix. Everything lives in one localStorage key and can be
// exported or imported as JSON.

const KEY = 'liangci-matcher-v1';

const DEFAULTS = {
  settings: {
    pinyin: true,     // show pinyin after every hanzi
    english: true,    // show english glosses in drills
    theme: 'auto',    // 'auto' | 'light' | 'dark'
    hsk3: false,      // extended HSK3 tier
    facts: true,      // mnemonics and curated facts
    toneChange: true, // show yi tone change (yí gè vs yì běn) in phrase builder
  },
  mastery: {},   // clId -> { score: 0..1 (recency weighted), attempts }
  confusion: {}, // "expectedId>chosenId" -> count
};

function fresh() {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const base = fresh();
      return {
        ...base,
        ...s,
        settings: { ...base.settings, ...(s.settings || {}) },
        mastery: s.mastery || {},
        confusion: s.confusion || {},
      };
    }
  } catch (e) { /* corrupted state falls back to defaults */ }
  return fresh();
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
}

export function mastery(clId) {
  return state.mastery[clId] || { score: 0, attempts: 0 };
}

export function recordAnswer(clId, score) {
  const m = state.mastery[clId] || { score: 0, attempts: 0 };
  m.score = m.attempts === 0 ? score : 0.75 * m.score + 0.25 * score;
  m.attempts += 1;
  state.mastery[clId] = m;
  save();
}

export function recordConfusion(expectedId, chosenId) {
  if (!expectedId || !chosenId || expectedId === chosenId) return;
  const k = expectedId + '>' + chosenId;
  state.confusion[k] = (state.confusion[k] || 0) + 1;
  save();
}

// Classifiers the user actually mixes up with `clId`, most confused first.
export function confusedWith(clId) {
  const tally = {};
  for (const [k, n] of Object.entries(state.confusion)) {
    const [exp, cho] = k.split('>');
    if (exp === clId) tally[cho] = (tally[cho] || 0) + n;
    if (cho === clId) tally[exp] = (tally[exp] || 0) + n;
  }
  return Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

export function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'liangci-matcher-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importJSON(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const s = JSON.parse(reader.result);
      if (typeof s !== 'object' || !s) throw new Error('bad shape');
      const base = fresh();
      state.settings = { ...base.settings, ...(s.settings || {}) };
      state.mastery = (s.mastery && typeof s.mastery === 'object') ? s.mastery : {};
      state.confusion = (s.confusion && typeof s.confusion === 'object') ? s.confusion : {};
      save();
      onDone(null);
    } catch (e) {
      onDone('That file does not look like a Liangci Matcher export.');
    }
  };
  reader.onerror = () => onDone('Could not read that file.');
  reader.readAsText(file);
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch (e) {}
  location.reload();
}
