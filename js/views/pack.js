// Pack: the pack's goals (objective circles), its units in workbook order
// with stars, and the Check-up at the bottom.

import * as content from '../content.js';
import * as store from '../store.js';
import { h, icon, say, sayable, stars, backButton } from '../ui.js';

function objectiveList(pack) {
  const stats = store.objectiveStats(pack);
  return h(
    'ul',
    { class: 'obj-list' },
    pack.objectives.map((o) =>
      sayable(
        h('li', { class: 'obj-item' }, h('span', { class: `obj-dot level-${store.objectiveLevel(stats[o.id])}` }), h('span', {}, o.text)),
        o.text,
      ),
    ),
  );
}

function unitCard(pack, unit) {
  const { bestStars, learned } = store.unitProgress(unit.id);
  const title = sayable(h('span', { class: 'unit-title' }, unit.title), unit.title);
  // First time in a unit, Practise shows the Learn card first, then goes on to practise.
  const practiseHref = learned ? `#/practise/${pack.id}/${unit.id}` : `#/learn/${pack.id}/${unit.id}/first`;
  return h(
    'div',
    { class: 'unit-card' },
    h('span', { class: 'unit-pic', 'aria-hidden': 'true' }, unit.pic || '📘'),
    h('div', { class: 'unit-info' }, title, stars(bestStars)),
    h(
      'div',
      { class: 'unit-actions' },
      h('a', { class: 'act-btn learn', href: `#/learn/${pack.id}/${unit.id}`, 'aria-label': 'Learn' }, icon('book')),
      h('a', { class: 'act-btn practise', href: practiseHref, 'aria-label': 'Practise' }, icon('play')),
    ),
  );
}

// Check-up opens once every unit has been practised at least once
// (or a grown-up has unlocked it in settings).
function checkupButton(pack) {
  if (!pack.checkup?.length) return null;
  const ready = store.settings().unlockCheckup || pack.units.every((u) => store.unitProgress(u.id).rounds > 0);
  if (ready) {
    return h('a', { class: 'checkup-btn', href: `#/checkup/${pack.id}` }, h('span', { class: 'checkup-pic', 'aria-hidden': 'true' }, '🏆'), h('span', {}, 'Check-up'));
  }
  const btn = h(
    'button',
    { class: 'checkup-btn locked', type: 'button' },
    icon('lock', 'checkup-lock'),
    h('span', {}, 'Check-up'),
  );
  btn.addEventListener('click', () => say('Practise every part first. Then come back for the check-up!', btn));
  return btn;
}

export async function render(packId) {
  const pack = await content.pack(packId);
  if (!pack) throw new Error(`No pack called "${packId}"`);
  return h(
    'div',
    { class: 'screen pack' },
    h(
      'header',
      { class: 'bar' },
      backButton('#/', 'Home'),
      h('span', { class: 'bar-pic', 'aria-hidden': 'true' }, pack.pic || '📘'),
      sayable(h('h1', { class: 'bar-title' }, pack.title), pack.title),
    ),
    objectiveList(pack),
    h('section', { class: 'unit-list' }, pack.units.map((u) => unitCard(pack, u))),
    checkupButton(pack),
  );
}
