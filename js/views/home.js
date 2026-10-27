// Home: Mimi, the Before · Now · Later timeline strip, and one card per pack.

import * as content from '../content.js';
import * as store from '../store.js';
import { h, icon, say, sayable, mimi, TIMES, TIME_ORDER } from '../ui.js';

// One example per station (from the spec).
const EXAMPLES = {
  before: 'I played.',
  now: 'I am playing.',
  later: 'I shall play.',
};

function timelineStrip() {
  return h(
    'section',
    { class: 'timeline', 'aria-label': 'Before, Now, Later' },
    TIME_ORDER.map((t) => {
      const el = h(
        'button',
        { class: `station t-${t}`, type: 'button' },
        icon(TIMES[t].icon, 'station-icon'),
        h('span', { class: 'station-name' }, TIMES[t].name),
        h('span', { class: 'sentence station-ex' }, EXAMPLES[t]),
      );
      el.addEventListener('click', () => say(`${TIMES[t].name}. ${EXAMPLES[t]}`, el));
      return el;
    }),
  );
}

// Circles for the pack's objectives: empty, half (practising), full (mastered).
export function objectiveDots(pack) {
  const stats = store.objectiveStats(pack);
  return h(
    'div',
    { class: 'obj-dots', 'aria-label': 'Goals' },
    pack.objectives.map((o) =>
      h('span', { class: `obj-dot level-${store.objectiveLevel(stats[o.id])}`, title: o.text }),
    ),
  );
}

function packCard(pack) {
  const speaker = sayable(h('button', { class: 'card-say round-btn', type: 'button', 'aria-label': 'Hear the name' }), pack.title);
  return h(
    'div',
    { class: 'pack-card-wrap' },
    h(
      'a',
      { class: 'pack-card', href: `#/pack/${pack.id}` },
      h('span', { class: 'pack-pic', 'aria-hidden': 'true' }, pack.pic || '📘'),
      h('span', { class: 'pack-title' }, pack.title),
      objectiveDots(pack),
    ),
    speaker,
  );
}

// Small corner button: press and hold for 2 seconds to open Grown-ups.
// Keeps a 6-year-old out without needing a PIN.
export function grownupsButton() {
  const HOLD_MS = 2000;
  let timer = null;
  const btn = h(
    'button',
    { class: 'grownups-btn', type: 'button', 'aria-label': 'Grown-ups: press and hold' },
    icon('settings'),
    h('span', { class: 'grownups-label' }, 'Grown-ups'),
    h('span', { class: 'hold-ring', 'aria-hidden': 'true' }),
  );
  const start = (e) => {
    if (e.type === 'keydown' && (e.repeat || (e.key !== 'Enter' && e.key !== ' '))) return;
    e.preventDefault();
    btn.classList.add('holding');
    timer = setTimeout(() => {
      btn.classList.remove('holding');
      location.hash = '#/grownups';
    }, HOLD_MS);
  };
  const cancel = () => {
    clearTimeout(timer);
    btn.classList.remove('holding');
  };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('keydown', start);
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur']) btn.addEventListener(ev, cancel);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  return btn;
}

export async function render() {
  const packs = await content.packs();
  const title = sayable(h('h1', { class: 'app-title' }, 'Who & When'), 'Who and When', { noIcon: true });
  return h(
    'div',
    { class: 'screen home' },
    h(
      'header',
      { class: 'home-head' },
      mimi('Hi! I am Mimi. Who is it? When is it?', 'big'),
      title,
      grownupsButton(),
    ),
    timelineStrip(),
    h('section', { class: 'pack-list' }, packs.map(packCard)),
  );
}
