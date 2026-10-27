// Grown-ups: progress per objective, tricky questions, check-up results,
// Together tasks, and settings. Opened from Home by press-and-hold.
// This page is for adults, so it uses normal text.

import * as content from '../content.js';
import * as store from '../store.js';
import * as speech from '../speech.js';
import * as engine from '../engine.js';
import { h, icon, say, sayable, stars, backButton } from '../ui.js';

const NEEDS_PRACTICE = 0.7; // under 70% first-try right

const date = (t) => new Date(t * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const pct = (x) => `${Math.round(x * 100)}%`;

function section(title, ...kids) {
  return h('section', { class: 'gu-section' }, h('h2', {}, title), ...kids);
}

// ---- Progress: one bar per objective ----

function objectiveRows(pack) {
  const stats = store.objectiveStats(pack);
  return h(
    'div',
    { class: 'gu-objs' },
    pack.objectives.map((o) => {
      const s = stats[o.id];
      const needs = s.n > 0 && s.accuracy < NEEDS_PRACTICE;
      return h(
        'div',
        { class: 'gu-obj' },
        h('span', { class: 'gu-obj-text' }, o.text, needs && h('span', { class: 'tag needs' }, 'needs practice')),
        h('span', { class: 'gu-bar' }, h('span', { class: `gu-bar-fill${needs ? ' low' : ''}`, style: `width:${s.n ? pct(s.accuracy) : '0%'}` })),
        h('span', { class: 'gu-num' }, s.n ? `${pct(s.accuracy)} of ${s.n}` : 'not yet'),
      );
    }),
  );
}

function lastCheckup(pack, byId) {
  const list = store.checkups(pack.id);
  if (!list.length) return h('p', { class: 'muted' }, 'Check-up: not taken yet.');
  const c = list[list.length - 1];
  const missed = (c.items || []).filter((r) => !r.ok);
  return h(
    'div',
    { class: 'gu-checkup' },
    h('p', {}, `Last check-up (${date(c.t)}): ${c.correct} of ${c.total} right first time `, stars(c.stars)),
    missed.length > 0 &&
      h(
        'ul',
        { class: 'gu-list' },
        missed.map((r) => {
          const item = byId.get(r.item);
          return item && h('li', {}, h('span', { class: 'gu-sentence' }, engine.summaryText(item)), answerNote(item, r.chose ? [r.chose] : []));
        }),
      ),
  );
}

// "Chose: is · Answer: are"
function answerNote(item, chose) {
  const answer = item.type === 'when' ? item.answer[0].toUpperCase() + item.answer.slice(1) : item.answer;
  const parts = [];
  if (chose.length) parts.push(`Chose: ${chose.join(', ')}`);
  if (answer) parts.push(`Answer: ${answer}`);
  return h('span', { class: 'gu-note' }, parts.join(' · '));
}

// ---- Tricky questions: missed (not right first time) more than once ----

function trickyList(byId) {
  const missed = new Map(); // item id -> { count, chose: Set }
  for (const a of store.attempts()) {
    if (a.firstTry) continue;
    const m = missed.get(a.item) || { count: 0, chose: new Set() };
    m.count++;
    if (a.chose != null) m.chose.add(String(a.chose));
    missed.set(a.item, m);
  }
  const rows = [...missed]
    .filter(([id, m]) => m.count > 1 && byId.has(id))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15);
  if (!rows.length) return h('p', { class: 'muted' }, 'Nothing tricky yet.');
  return h(
    'ul',
    { class: 'gu-list' },
    rows.map(([id, m]) => {
      const item = byId.get(id);
      return h('li', {}, h('span', { class: 'gu-sentence' }, engine.summaryText(item)), h('span', { class: 'tag' }, `missed ${m.count}×`), answerNote(item, [...m.chose]));
    }),
  );
}

// ---- Together tasks (say items): parent ticks "She said it" ----

function togetherTask(item) {
  const btn = h('button', { class: 'gu-said', type: 'button' });
  const paint = () => {
    const t = store.togetherDone(item.id);
    btn.setAttribute('aria-pressed', t ? 'true' : 'false');
    btn.replaceChildren(icon('check'), t ? `Said it (${date(t)})` : 'She said it');
  };
  btn.addEventListener('click', () => {
    store.markTogether(item.id, !store.togetherDone(item.id));
    paint();
  });
  paint();
  return h(
    'li',
    { class: 'gu-task' },
    h('span', { class: 'gu-task-pic', 'aria-hidden': 'true' }, item.pic || '🎤'),
    h(
      'div',
      { class: 'gu-task-text' },
      sayable(h('span', { class: 'gu-prompt' }, item.prompt), item.prompt),
      item.example && sayable(h('span', { class: 'gu-example' }, `e.g. ${item.example}`), item.example),
    ),
    btn,
  );
}

// ---- Settings ----

function toggle(label, key, onChange) {
  const input = h('input', { type: 'checkbox', checked: !!store.settings()[key] });
  input.addEventListener('change', () => {
    store.setSetting(key, input.checked);
    onChange?.(input.checked);
  });
  return h('label', { class: 'gu-setting' }, h('span', {}, label), input);
}

function settingsBlock(rerender) {
  const s = store.settings();

  const speed = h(
    'div',
    { class: 'gu-seg', role: 'radiogroup', 'aria-label': 'Voice speed' },
    [
      ['Slow', speech.RATE_SLOW],
      ['Normal', speech.RATE_NORMAL],
    ].map(([label, rate]) => {
      const b = h('button', { type: 'button', role: 'radio', 'aria-checked': s.rate === rate ? 'true' : 'false' }, label);
      b.addEventListener('click', () => {
        store.setSetting('rate', rate);
        speech.setRate(rate);
        speed.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
        say('I am reading a book.', b);
      });
      return b;
    }),
  );

  const name = h('input', { type: 'text', value: s.name || '', placeholder: 'e.g. Jennie', maxlength: '20', autocomplete: 'off' });
  name.addEventListener('input', () => store.setSetting('name', name.value.trim()));

  const test = h('button', { class: 'gu-small', type: 'button' }, icon('volume'), 'Test');
  test.addEventListener('click', () => say('Hello! I am Mimi. Who is it? When is it?', test));

  const reset = h('button', { class: 'gu-reset', type: 'button' }, 'Reset progress…');
  reset.addEventListener('click', () => {
    if (confirm('Reset all stars, attempts, check-ups and Together ticks? Settings are kept.')) {
      store.resetAll();
      rerender();
    }
  });

  return h(
    'div',
    { class: 'gu-settings' },
    toggle('Read questions aloud', 'readAloud'),
    h('div', { class: 'gu-setting' }, h('span', {}, 'Voice speed'), speed),
    speech.available
      ? h('div', { class: 'gu-setting' }, h('span', {}, 'Voice', h('small', { class: 'muted' }, ` ${speech.voiceName()}`)), test)
      : h('p', { class: 'muted' }, 'Speech is not available in this browser.'),
    h('label', { class: 'gu-setting' }, h('span', {}, "Child's name (Done screen)"), name),
    toggle('Open check-ups before every unit is practised', 'unlockCheckup'),
    h('div', { class: 'gu-setting' }, h('span', {}, 'Start again'), reset),
  );
}

export async function render() {
  const packs = await content.packs();
  const byId = new Map();
  for (const p of packs) for (const item of [...p.units.flatMap((u) => u.items), ...(p.checkup || []), ...(p.together || [])]) byId.set(item.id, item);

  const root = h('div', { class: 'screen grownups' });
  const draw = () =>
    root.replaceChildren(
      h('header', { class: 'bar' }, backButton('#/', 'Home'), h('h1', { class: 'bar-title' }, 'Grown-ups')),
      section(
        'Progress',
        h('p', { class: 'muted' }, 'First-try accuracy over the last 20 questions for each goal (practice and check-ups).'),
        packs.map((p) => h('div', { class: 'gu-pack' }, h('h3', {}, `${p.pic || ''} ${p.title}`), objectiveRows(p), lastCheckup(p, byId))),
      ),
      section('Tricky questions', h('p', { class: 'muted' }, 'Missed more than once.'), trickyList(byId)),
      section(
        'Together tasks',
        h('p', { class: 'muted' }, 'Do these with her. Tap a prompt to hear it.'),
        packs.map((p) => !p.together?.length ? null : h('div', { class: 'gu-pack' }, h('h3', {}, `${p.pic || ''} ${p.title}`), h('ul', { class: 'gu-tasks' }, p.together.map(togetherTask)))),
      ),
      section('Settings', settingsBlock(draw)),
    );
  draw();
  return root;
}
