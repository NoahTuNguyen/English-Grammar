// Progress store in localStorage (key prefix "whowhen:").
// Schema is versioned (see docs/SPEC.md, "Progress store"). Bad or missing
// data never crashes the app: each broken key is simply reset to its default.

const KEY = 'whowhen:progress';
const VERSION = 1;
const MAX_ATTEMPTS = 500;

const defaults = () => ({
  version: VERSION,
  // unlockCheckup: parent override so Check-up opens before every unit is practised.
  settings: { readAloud: true, rate: 0.85, name: '', unlockCheckup: false },
  units: {},      // unitId -> { bestStars, rounds, learned }
  attempts: [],   // { item, correct, firstTry, mode, t, chose? }
  objectives: {}, // reserved (accuracy is derived from attempts)
  together: {},   // say-item id -> timestamp when "She said it" was ticked
});

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Upgrade older saved data to the current version. Add steps here when
// VERSION goes up, e.g. if (data.version === 1) { ...; data.version = 2; }
function migrate(data) {
  return data;
}

// Keep good keys, reset broken ones.
function sanitise(raw) {
  const d = defaults();
  if (!isObj(raw)) return d;
  const data = migrate(raw);
  return {
    version: VERSION,
    settings: isObj(data.settings) ? { ...d.settings, ...data.settings } : d.settings,
    units: isObj(data.units) ? data.units : d.units,
    attempts: Array.isArray(data.attempts) ? data.attempts.filter(isObj) : d.attempts,
    objectives: isObj(data.objectives) ? data.objectives : d.objectives,
    together: isObj(data.together) ? data.together : d.together,
  };
}

function load() {
  try {
    return sanitise(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return defaults();
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private browsing or storage full: keep working in memory.
  }
}

const now = () => Math.floor(Date.now() / 1000);

// ---- Settings ----

export function settings() {
  return state.settings;
}

export function setSetting(key, value) {
  state.settings[key] = value;
  save();
}

// ---- Units (stars per unit) ----

// learned: the Learn card has been seen at least once. Until then, the
// Practise button shows Learn first.
export function unitProgress(unitId) {
  const u = state.units[unitId];
  return { bestStars: u?.bestStars || 0, rounds: u?.rounds || 0, learned: !!u?.learned };
}

export function recordRound(unitId, stars) {
  const u = unitProgress(unitId);
  state.units[unitId] = { ...u, bestStars: Math.max(u.bestStars, stars), rounds: u.rounds + 1 };
  save();
}

export function markLearned(unitId) {
  const u = unitProgress(unitId);
  if (u.learned) return;
  state.units[unitId] = { ...u, learned: true };
  save();
}

// ---- Attempts ----

export function attempts() {
  return state.attempts;
}

export function recordAttempt({ item, correct, firstTry, mode, chose }) {
  state.attempts.push({ item, correct, firstTry, mode, t: now(), ...(chose != null && { chose }) });
  if (state.attempts.length > MAX_ATTEMPTS) state.attempts = state.attempts.slice(-MAX_ATTEMPTS);
  save();
}

// ---- Together tasks ----

export function togetherDone(id) {
  return state.together[id] || 0;
}

export function markTogether(id, done = true) {
  if (done) state.together[id] = now();
  else delete state.together[id];
  save();
}

// ---- Objectives (derived from attempts) ----

// Map each item id in a pack to the objectives its unit practises.
function itemObjectives(pack) {
  const unitObjs = new Map(pack.units.map((u) => [u.id, u.objectives || []]));
  const map = new Map();
  for (const unit of pack.units) for (const item of unit.items) map.set(item.id, unitObjs.get(unit.id));
  for (const item of pack.checkup || []) map.set(item.id, unitObjs.get(item.unit) || []);
  return map;
}

// For each objective: accuracy over its last 20 attempts (first-try correct only).
// Returns { [objectiveId]: { n, correct, accuracy } }.
export function objectiveStats(pack, window = 20) {
  const objsOf = itemObjectives(pack);
  const recent = {};
  for (const a of state.attempts) {
    for (const o of objsOf.get(a.item) || []) (recent[o] ||= []).push(a);
  }
  const out = {};
  for (const o of pack.objectives) {
    const last = (recent[o.id] || []).slice(-window);
    const correct = last.filter((a) => a.firstTry && a.correct).length;
    out[o.id] = { n: last.length, correct, accuracy: last.length ? correct / last.length : 0 };
  }
  return out;
}

// 0 = not started, 1 = practising, 2 = mastered (enough tries and mostly first-try right).
export function objectiveLevel(stat) {
  if (!stat || stat.n === 0) return 0;
  return stat.n >= 6 && stat.accuracy >= 0.8 ? 2 : 1;
}

// ---- Reset ----

export function resetAll() {
  const keepSettings = state.settings;
  state = defaults();
  state.settings = keepSettings;
  save();
}
