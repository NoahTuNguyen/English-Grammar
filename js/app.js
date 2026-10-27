// Boot and hash router.
// Routes look like #/pack/p1 or #/learn/p1/p1-be-now: the first part picks
// the view, the rest are passed to the view's render() as arguments.

import * as speech from './speech.js';
import * as store from './store.js';
import { h, mimi, backButton } from './ui.js';
import * as home from './views/home.js';
import * as pack from './views/pack.js';
import * as learn from './views/learn.js';
import * as practise from './views/practise.js';

const views = {
  '': home,      // #/
  pack,          // #/pack/<packId>
  learn,         // #/learn/<packId>/<unitId>[/first]
  practise,      // #/practise/<packId>/<unitId>
};

const app = document.getElementById('app');

// Shown for screens that aren't built yet (or unknown links).
function notYet() {
  return h(
    'div',
    { class: 'screen center' },
    backButton('#/', 'Home'),
    mimi('This part is coming soon!', 'big'),
    h('p', { class: 'note' }, 'Coming soon'),
  );
}

let renderId = 0;
async function route() {
  const id = ++renderId;
  const [name = '', ...args] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const view = views[name];
  speech.stop();
  try {
    const el = view ? await view.render(...args) : notYet();
    if (id !== renderId) return; // a newer navigation won
    app.replaceChildren(el);
    window.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    app.replaceChildren(
      h('div', { class: 'screen center' }, backButton('#/', 'Home'), mimi('Oops! Let us go back home.', 'big'), h('p', { class: 'note' }, String(e.message || e))),
    );
  }
}

speech.init();
speech.setRate(store.settings().rate);
window.addEventListener('hashchange', route);
route();
