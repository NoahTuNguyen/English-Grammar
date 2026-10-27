// Practise: one question at a time, with the hint ladder.
//
//   wrong try 1  the option wobbles and fades, the subject or clue lights up,
//                and a hint line appears (and is read out)
//   wrong try 2  the rule card appears in compact form
//   wrong try 3  the answer is shown and read; the item comes back at the end
//
// playRound() is also used by the Check-up, with hints: false (no hints, no
// re-queue: a wrong answer simply moves on).

import * as content from '../content.js';
import * as store from '../store.js';
import * as engine from '../engine.js';
import { h, icon, say, marked, backButton, TIMES, TIME_ORDER, WHO } from '../ui.js';
import { ruleCard } from '../rulecard.js';
import { doneScreen } from './done.js';

export async function render(packId, unitId) {
  const [found, rules] = await Promise.all([content.unit(packId, unitId), content.rules()]);
  if (!found?.unit) throw new Error(`No unit called "${unitId}"`);
  const { pack, unit } = found;
  const root = h('div', { class: 'screen practise' });
  const backHref = `#/pack/${pack.id}`;

  const start = () =>
    playRound(root, {
      pack,
      round: new engine.Round(engine.buildRound(unit.items, store.attempts())),
      mode: 'practise',
      hints: true,
      ruleFor: () => rules[unit.rule],
      backHref,
      onFinish(round) {
        const stars = round.stars();
        store.recordRound(unit.id, stars);
        root.replaceChildren(doneScreen({ stars, onAgain: start, backHref }));
      },
    });
  start();
  return root;
}

// ---- Round ----

export function playRound(root, ctx) {
  const show = () => {
    if (ctx.round.done) return ctx.onFinish(ctx.round);
    const item = ctx.round.current;
    root.replaceChildren(topBar(ctx), askQuestion({ ...ctx, rule: ctx.ruleFor(item), next: show }, item));
    window.scrollTo(0, 0);
  };
  show();
}

// Back button and progress dots (one per question, including any re-queued).
function topBar({ round, backHref }) {
  return h(
    'header',
    { class: 'bar practise-bar' },
    backButton(backHref, 'Stop'),
    h(
      'div',
      { class: 'dots', 'aria-label': `Question ${round.pos + 1} of ${round.queue.length}` },
      round.queue.map((_, i) => h('span', { class: `dot${i < round.pos ? ' done' : ''}${i === round.pos ? ' current' : ''}` })),
    ),
  );
}

// ---- One question ----

function askQuestion(ctx, item) {
  const { round, hints } = ctx;
  let wrong = 0;
  let chose = null;
  let over = false;

  const hintBox = h('div', { class: 'hint-box' });
  const ruleBox = h('div', { class: 'hint-rule' });
  const nextBox = h('div', { class: 'next-box' });

  // What tapping the sentence or picture says: the question, then the answer once solved.
  let spoken = engine.promptSpeech(item);
  const hear = (el) => say(spoken, el);

  const api = {
    // A wrong choice. Returns the hint step reached (0 when hints are off).
    wrong(choice) {
      if (over) return 0;
      wrong++;
      if (chose == null) chose = choice;
      if (!hints) {
        finish({ revealed: false, correct: false }); // check-up: any slip moves on
        return 0;
      }
      if (kind.noLadder) {
        kind.nudge?.(wrong);
        return 0;
      }
      if (wrong === 1) showHint();
      else if (wrong === 2) showRule();
      else finish({ revealed: true, correct: false });
      return wrong;
    },
    right() {
      if (!over) finish({ revealed: false, correct: true });
    },
    hear,
  };

  const kind = BUILDERS[item.type](item, api);

  function showHint() {
    const line = engine.hintLine(item, ctx.rule);
    kind.highlight?.(line.marks);
    const p = h(
      'button',
      { class: 'hint-line sentence', type: 'button' },
      line.who && icon(WHO[line.who].icon, 'hint-who'),
      h('span', {}, marked(line.text, [...line.marks, { text: line.text.match(/(I|We|One|Many)!$/)?.[0] }])),
    );
    p.addEventListener('click', () => say(line.text, p));
    hintBox.replaceChildren(p);
    say(line.text, p);
  }

  function showRule() {
    if (!ctx.rule) return;
    ruleBox.replaceChildren(h('div', { class: 'rule-card compact' }, ruleCard(ctx.rule, { ...engine.compactOptions(item), pack: ctx.pack })));
    say(ctx.rule.line, ruleBox);
  }

  function finish({ revealed, correct }) {
    over = true;
    kind.solved({ revealed, correct });
    const first = round.finish(item, { wrongTries: wrong, revealed, chose });
    if (first) store.recordAttempt({ item: item.id, correct, firstTry: wrong === 0, mode: ctx.mode, chose });
    // In the check-up a wrong answer just moves on, without showing the answer.
    if (!correct && !hints) {
      setTimeout(() => el.isConnected && ctx.next(), 700);
      return;
    }
    spoken = engine.fullSentence(item);
    if (correct) el.append(starPop());
    hintBox.replaceChildren();
    say(spoken, kind.line);
    const next = h('button', { class: 'big-btn next', type: 'button' }, h('span', {}, 'Next'), icon('next'));
    next.addEventListener('click', ctx.next);
    nextBox.replaceChildren(next);
    next.focus({ preventScroll: true });
  }

  const pic = h('button', { class: 'q-pic', type: 'button', 'aria-label': 'Hear it again' }, item.pic || '❓');
  pic.addEventListener('click', () => hear(pic));

  const el = h('div', { class: `question q-${item.type}` }, pic, kind.body, hintBox, ruleBox, nextBox);

  if (store.settings().readAloud) setTimeout(() => el.isConnected && !over && hear(kind.line), 350);
  return el;
}

// ---- Pieces shared by the builders ----

// A big choice button with its own small "hear it" button next to it,
// so every option can be heard without choosing it.
function option(label, { cls = '', iconName, speech, onChoose }) {
  const btn = h('button', { class: `opt ${cls}`.trim(), type: 'button' }, iconName && icon(iconName, 'opt-icon'), h('span', { class: 'opt-text' }, label));
  btn.addEventListener('click', () => !btn.disabled && onChoose(btn));
  const ear = h('button', { class: 'opt-say round-btn', type: 'button', 'aria-label': `Hear ${label}` }, icon('volume'));
  ear.addEventListener('click', () => say(speech || label, ear));
  return { label, btn, wrap: h('div', { class: 'opt-wrap' }, btn, ear) };
}

// Wobble, then (optionally) fade out. Never red, never "wrong".
function wobble(el, fade = false) {
  el.classList.remove('wobble');
  void el.offsetWidth;
  el.classList.add('wobble');
  if (fade) {
    el.classList.add('faded');
    el.disabled = true;
  }
}

function starPop() {
  const s = h('div', { class: 'star-pop', 'aria-hidden': 'true' }, icon('star', 'star on'));
  setTimeout(() => s.remove(), 1200);
  return s;
}

// The sentence line: tap it to hear it. Its contents can be redrawn.
function sentenceLine(api) {
  const text = h('p', { class: 'sentence q-sentence' });
  const line = h('div', { class: 'q-line sayable' }, text, icon('volume', 'speaker'));
  line.addEventListener('click', () => api.hear(line));
  return { line, text };
}

// A sentence with a blank, e.g. "My two cousins [   ] Lily and Sam."
function blankSentence(item, { filled = false, marks = [] } = {}) {
  const [pre, post = ''] = item.text.split('___');
  const blank = filled
    ? h('span', { class: 'blank filled' }, item.answer)
    : h('span', { class: 'blank', 'aria-label': 'blank' }, ' ');
  const after = (item.base ? ` (${item.base})` : '') + post;
  return [...marked(pre, marks), blank, ...marked(after, marks)];
}

// ---- Builders: one per item type ----
// Each returns { body, line, solved(), highlight?(), ... }.

const BUILDERS = {
  // Choose the right word for the blank.
  pick(item, api) {
    const { line, text } = sentenceLine(api);
    text.replaceChildren(...blankSentence(item));
    let marks = [];
    const opts = engine.shuffle(item.options).map((o) =>
      option(o, {
        onChoose(btn) {
          if (engine.isRight(item, o)) api.right();
          else {
            wobble(btn, true);
            api.wrong(o);
          }
        },
      }),
    );
    return {
      body: [line, h('div', { class: 'opts' }, opts.map((o) => o.wrap))],
      line,
      highlight(m) {
        marks = m;
        text.replaceChildren(...blankSentence(item, { marks }));
      },
      solved() {
        // Fill the blank and light up the subject and clue.
        marks = [{ text: item.subject }, { text: item.clue }];
        text.replaceChildren(...blankSentence(item, { filled: true, marks }));
        for (const o of opts) {
          o.btn.disabled = true;
          o.btn.classList.add(o.label === item.answer ? 'correct' : 'faded');
        }
      },
    };
  },

  // Now, Before or Later?
  when(item, api) {
    const { line, text } = sentenceLine(api);
    text.replaceChildren(item.text);
    const opts = TIME_ORDER.map((t) =>
      option(TIMES[t].name, {
        cls: `t-${t}`,
        iconName: TIMES[t].icon,
        onChoose(btn) {
          if (item.answer === t) api.right();
          else {
            wobble(btn, true);
            api.wrong(t);
          }
        },
      }),
    );
    return {
      body: [line, h('div', { class: 'opts opts-when' }, opts.map((o) => o.wrap))],
      line,
      highlight(marks) {
        text.replaceChildren(...marked(item.text, marks));
      },
      solved() {
        text.replaceChildren(...marked(item.text, [{ text: item.clue, cls: 'hl glow' }]));
        for (const o of opts) {
          o.btn.disabled = true;
          o.btn.classList.add(o.label === TIMES[item.answer].name ? 'correct' : 'faded');
        }
      },
    };
  },

  // Build the Before word from letter tiles. Only the right next letter clicks in.
  spell(item, api) {
    const answer = item.answer;
    let pos = 0;
    const slots = answer.split('').map(() => h('span', { class: 'slot' }, ' '));
    const { line, text } = sentenceLine(api);
    text.replaceChildren(
      h('span', { class: 'spell-base' }, item.base),
      icon('next', 'arrow'),
      icon('moon', 'spell-moon'),
      h('span', { class: 'slots' }, slots),
    );
    const place = (letter) => {
      slots[pos].textContent = letter;
      slots[pos].classList.add('filled');
      pos++;
    };
    const tiles = engine.letterTiles(answer).map((letter) => {
      const t = h('button', { class: 'tile', type: 'button' }, letter);
      t.addEventListener('click', () => {
        if (t.disabled) return;
        if (letter === answer[pos]) {
          place(letter);
          t.disabled = true;
          t.classList.add('used');
          if (pos === answer.length) api.right();
        } else {
          wobble(t);
          api.wrong(letter);
        }
      });
      return t;
    });
    return {
      body: [line, h('div', { class: 'tiles' }, tiles)],
      line,
      solved() {
        while (pos < answer.length) place(answer[pos]);
        for (const t of tiles) t.disabled = true;
        line.classList.add('solved');
      },
    };
  },

  // Tap the words in order. Only the right next word clicks in. No hint
  // ladder here: after two slips the next word glows.
  build(item, api) {
    const words = item.text.trim().split(/\s+/);
    let pos = 0;
    const placed = h('p', { class: 'sentence built' }, h('span', { class: 'built-gap' }, ' '));
    const ear = h('button', { class: 'round-btn listen', type: 'button', 'aria-label': 'Hear the sentence' }, icon('volume'));
    ear.addEventListener('click', () => api.hear(ear));
    const line = h('div', { class: 'q-line build-line' }, placed, ear);
    const tiles = engine.wordTiles(item.text).map((word) => {
      const t = h('button', { class: 'tile word', type: 'button' }, word);
      t.addEventListener('click', () => {
        if (t.disabled) return;
        if (word === words[pos]) {
          placed.querySelector('.built-gap')?.remove();
          placed.append(h('span', { class: 'built-word' }, word), ' ');
          pos++;
          t.disabled = true;
          t.classList.add('used');
          tiles.forEach((x) => x.classList.remove('glow'));
          if (pos === words.length) api.right();
        } else {
          wobble(t);
          api.wrong(word);
        }
      });
      return t;
    });
    return {
      body: [line, h('div', { class: 'tiles' }, tiles)],
      line,
      noLadder: true,
      nudge(wrongs) {
        if (wrongs < 2) return;
        tiles.find((t) => !t.disabled && t.textContent === words[pos])?.classList.add('glow');
      },
      solved() {
        for (const t of tiles) t.disabled = true;
        line.classList.add('solved');
      },
    };
  },
};
