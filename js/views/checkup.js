// Check-up: the pack's Mini Check-Up. Same question screen as Practise,
// but no hints and no re-queue: a wrong answer simply moves on.
// The child sees stars; the details are saved for the Grown-ups page.

import * as content from '../content.js';
import * as store from '../store.js';
import * as engine from '../engine.js';
import { playRound } from './practise.js';
import { doneScreen } from './done.js';

export async function render(packId) {
  const pack = await content.pack(packId);
  if (!pack?.checkup?.length) throw new Error(`No check-up for pack "${packId}"`);
  const root = document.createElement('div');
  root.className = 'screen practise checkup';
  const backHref = `#/pack/${pack.id}`;

  const start = () =>
    playRound(root, {
      pack,
      round: new engine.Round(engine.shuffle(pack.checkup), { requeue: false }),
      mode: 'checkup',
      hints: false,
      ruleFor: () => null,
      backHref,
      onFinish(round) {
        const stars = round.stars();
        store.recordCheckup(pack.id, { stars, total: round.total, correct: round.firstTryCorrect, items: round.results() });
        root.replaceChildren(doneScreen({ stars, onAgain: start, backHref }));
      },
    });
  start();
  return root;
}
