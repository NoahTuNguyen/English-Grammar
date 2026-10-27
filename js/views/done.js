// Done: stars for the round, then "Play again" or "Back to pack".
// Not a route of its own; the practise and check-up views show it at the end.

import * as store from '../store.js';
import { h, icon, say, mimi, stars as starRow } from '../ui.js';

const CHEERS = {
  3: 'Amazing!',
  2: 'Great job!',
  1: 'Good try! Practice makes it easy.',
};

export function doneScreen({ stars, onAgain, backHref }) {
  const name = store.settings().name?.trim();
  const cheer = name ? `${CHEERS[stars]} Well done, ${name}!` : CHEERS[stars];

  const row = starRow(stars);
  row.classList.add('done-stars');
  const again = h('button', { class: 'big-btn again', type: 'button' }, icon('play'), h('span', {}, 'Play again'));
  again.addEventListener('click', onAgain);

  const msg = h('button', { class: 'done-cheer', type: 'button' }, cheer);
  msg.addEventListener('click', () => say(cheer, msg));

  const el = h(
    'div',
    { class: 'screen center done' },
    mimi(cheer, 'big'),
    row,
    msg,
    h('div', { class: 'done-actions' }, again, h('a', { class: 'big-btn back-to-pack', href: backHref }, icon('back'), h('span', {}, 'Back to pack'))),
  );
  setTimeout(() => el.isConnected && say(cheer, msg), 300);
  return el;
}
