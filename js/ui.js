// Shared UI helpers: a tiny element builder, tap-to-hear, and the
// Who / When vocabulary (names, icons, colours) used on every screen.

import * as speech from './speech.js';
import { icon } from './icons.js';

// h('button', { class: 'x', onclick: fn }, 'text', childEl) -> element.
// Strings become text nodes, so content is never parsed as HTML.
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...kids.flat().filter((k) => k != null && k !== false));
  return el;
}

// The three times, in timeline order. Kid-facing names are the workbook's words.
export const TIMES = {
  before: { name: 'Before', icon: 'moon' },
  now: { name: 'Now', icon: 'sun' },
  later: { name: 'Later', icon: 'sunrise' },
};
export const TIME_ORDER = ['before', 'now', 'later'];

// The four "who" columns.
export const WHO = {
  I: { name: 'I', icon: 'user-circle', sub: '' },
  one: { name: 'one', icon: 'user', sub: 'he, she, it, Ben' },
  we: { name: 'we', icon: 'users', sub: '' },
  many: { name: 'many', icon: 'users-group', sub: 'you, they, birds' },
};
export const WHO_ORDER = ['I', 'one', 'we', 'many'];

// Speak text and glow the element while it's being read.
let speakingEl = null;
export function say(text, el) {
  speakingEl?.classList.remove('speaking');
  speakingEl = el || null;
  el?.classList.add('speaking');
  speech.speak(text, {
    onend: () => {
      if (speakingEl === el) {
        el?.classList.remove('speaking');
        speakingEl = null;
      }
    },
  });
}

// Make any element tap-to-hear. Adds a small speaker icon unless noIcon.
export function sayable(el, text, { noIcon = false } = {}) {
  el.classList.add('sayable');
  if (!noIcon) el.append(icon('volume', 'speaker'));
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    say(text, el);
  });
  return el;
}

// Wrap parts of a sentence in <mark>, e.g.
// marked('My two cousins ___ Lily.', [{ text: 'My two cousins', cls: 'hl' }]).
// Matches whole words only, case-insensitive, first occurrence of each.
export function marked(sentence, needles = []) {
  const found = [];
  for (const n of needles) {
    if (!n?.text) continue;
    const esc = n.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = new RegExp(`(^|[^A-Za-z])(${esc})(?![A-Za-z])`, 'i').exec(sentence);
    if (m) found.push({ start: m.index + m[1].length, end: m.index + m[1].length + m[2].length, cls: n.cls || 'hl' });
  }
  found.sort((a, b) => a.start - b.start);
  const out = [];
  let pos = 0;
  for (const f of found) {
    if (f.start < pos) continue; // skip overlaps
    out.push(sentence.slice(pos, f.start), h('mark', { class: f.cls }, sentence.slice(f.start, f.end)));
    pos = f.end;
  }
  out.push(sentence.slice(pos));
  return out.filter((x) => x !== '');
}

// 0–3 stars. Filled stars glow; empty ones are outlines.
export function stars(n, max = 3) {
  return h(
    'span',
    { class: 'stars', 'aria-label': `${n} of ${max} stars` },
    Array.from({ length: max }, (_, i) => icon('star', i < n ? 'star on' : 'star')),
  );
}

// A round "back" button that goes to the given hash.
export function backButton(href, label = 'Back') {
  return h('a', { class: 'round-btn back', href, 'aria-label': label }, icon('back'));
}

// The mascot. Tapping her says something friendly.
export function mimi(line = 'Hi! I am Mimi.', size = '') {
  const el = h('button', { class: `mimi ${size}`.trim(), type: 'button', 'aria-label': 'Mimi the cat' }, '🐱');
  el.addEventListener('click', () => {
    el.classList.remove('bounce');
    void el.offsetWidth; // restart the animation
    el.classList.add('bounce');
    say(line, el);
  });
  return el;
}

export { icon };
