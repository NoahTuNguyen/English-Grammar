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
