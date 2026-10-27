// Renders a rule card from content/rules.json.
// Used full-size on the Learn screen and in compact form for hint step 2.
//
// ruleCard(rule, opts)
//   opts.pack     the current pack (time-line clues find example sentences in it)
//   opts.row      who-grid: only show the row for this time ('now', 'before', 'have', 'later')
//   opts.who      who-grid: highlight this column ('I', 'one', 'we', 'many')
//   opts.pattern  pattern card: only show this pattern id (e.g. 'y-ied')
//   opts.from     list card: only show the pair for this base word (e.g. 'go')

import { h, icon, say, sayable, marked, TIMES, WHO, WHO_ORDER } from './ui.js';

const ROW_LOOK = { ...TIMES, have: { name: 'Have', icon: 'backpack' } };

export function ruleCard(rule, opts = {}) {
  const render = { 'who-grid': whoGrid, 'time-line': timeLine, pattern: patternCard, list: listCard }[rule.type];
  if (!render) return h('div', { class: 'rule-body' });
  return render(rule, opts);
}

// The line under the grid where the tapped example appears.
function exampleLine() {
  return h('p', { class: 'sentence example' }, h('span', { class: 'tap-hint', 'aria-hidden': 'true' }, '👆'));
}

function showExample(line, sentence, highlight) {
  line.replaceChildren(...marked(sentence, [{ text: highlight }]));
}

// ---- who-grid: columns I / one / we / many, one row per time ----

function whoGrid(rule, { row, who } = {}) {
  let rows = row ? rule.rows.filter((r) => r.time === row) : rule.rows;
  if (!rows.length) rows = rule.rows;
  const example = exampleLine();

  const heads = WHO_ORDER.map((k) => {
    const w = WHO[k];
    const el = h(
      'button',
      { class: `who-head${who === k ? ' is-hl' : ''}`, type: 'button' },
      icon(w.icon, 'who-icon'),
      h('span', { class: 'who-name' }, w.name),
      w.sub && h('span', { class: 'who-sub' }, w.sub),
    );
    el.addEventListener('click', () => say(w.sub ? `${w.name}. ${w.sub}.` : `${w.name}.`, el));
    return el;
  });

  const body = rows.flatMap((r) => {
    const look = ROW_LOOK[r.time] || ROW_LOOK.now;
    const label = sayable(
      h('div', { class: `row-label t-${r.time}` }, icon(look.icon), h('span', {}, look.name)),
      look.name,
      { noIcon: true },
    );
    const cells = WHO_ORDER.map((k) => {
      const c = r.cells[k];
      const b = h('button', { class: `cell t-${r.time}${who === k ? ' is-hl' : ''}`, type: 'button' }, c.w);
      b.addEventListener('click', () => {
        // "am …ing" -> highlight "am" in the example.
        showExample(example, c.ex, c.w.split(/\s/)[0]);
        say(c.ex, b);
      });
      return b;
    });
    return [label, ...cells];
  });

  return h('div', { class: 'rule-body' }, h('div', { class: 'who-grid' }, heads, body), example);
}

// ---- time-line: Before / Now / Later with clue words ----

// Find a sentence in the pack that uses this clue, with the blank filled in.
function sentenceForClue(pack, clue) {
  const items = [...(pack?.units || []).flatMap((u) => u.items), ...(pack?.checkup || [])];
  const item = items.find((i) => i.clue?.toLowerCase() === clue.toLowerCase() && i.text);
  return item && item.text.replace('___', item.answer);
}

function timeLine(rule, { pack } = {}) {
  const example = exampleLine();
  const stations = rule.stations.map((s) => {
    const look = TIMES[s.time];
    const head = h('button', { class: 'tl-head', type: 'button' }, icon(look.icon, 'station-icon'), h('span', { class: 'station-name' }, look.name));
    head.addEventListener('click', () => {
      showExample(example, s.ex);
      say(`${look.name}. ${s.ex}`, head);
    });
    const clues = s.clues.map((clue) => {
      const chip = h('button', { class: 'clue-chip sentence', type: 'button' }, clue);
      chip.addEventListener('click', () => {
        const sentence = sentenceForClue(pack, clue) || s.ex;
        showExample(example, sentence, clue);
        // If the sentence doesn't use this clue, say the clue first.
        const hasClue = sentence.toLowerCase().includes(clue.toLowerCase());
        say(hasClue ? sentence : `${clue}. ${sentence}`, chip);
      });
      return chip;
    });
    return h('div', { class: `tl-station t-${s.time}` }, head, h('div', { class: 'clues' }, clues));
  });
  return h('div', { class: 'rule-body' }, h('div', { class: 'tl' }, stations), example);
}

// ---- pattern: walk -> walked, with the changing letters highlighted ----

// Split two words into [same start, changed end], e.g. cry/cried -> cr + y / ied.
// whole: highlight the whole new word (special words are new words, not spelling changes).
function wordChange(from, to, { whole = false } = {}) {
  let i = 0;
  while (!whole && i < from.length && from[i] === to[i]) i++;
  if (whole) {
    return h('span', { class: 'word-change sentence' }, h('span', { class: 'from' }, from), icon('next', 'arrow'), h('mark', { class: 'hl to' }, to));
  }
  const part = (word) => [word.slice(0, i), word.slice(i) && h('mark', { class: 'hl' }, word.slice(i))];
  return h(
    'span',
    { class: 'word-change sentence' },
    h('span', { class: 'from' }, part(from)),
    icon('next', 'arrow'),
    h('span', { class: 'to' }, part(to)),
  );
}

function patternCard(rule, { pattern } = {}) {
  let list = pattern ? rule.patterns.filter((p) => p.id === pattern) : rule.patterns;
  if (!list.length) list = rule.patterns;
  const example = exampleLine();
  const rows = list.map((p) => {
    const b = h('button', { class: 'pattern-row', type: 'button' }, h('span', { class: 'pattern-rule' }, p.rule), wordChange(p.from, p.to));
    b.addEventListener('click', () => {
      showExample(example, p.ex, p.to);
      say(`${p.rule}. ${p.from}, ${p.to}. ${p.ex}`, b);
    });
    return b;
  });
  return h('div', { class: 'rule-body' }, h('div', { class: 'patterns' }, rows), example);
}

// ---- list: special (irregular) words ----

function listCard(rule, { from } = {}) {
  let pairs = from ? rule.pairs.filter((p) => p.from === from) : rule.pairs;
  if (!pairs.length) pairs = rule.pairs;
  const example = exampleLine();
  const cards = pairs.map((p) => {
    const b = h('button', { class: 'pair', type: 'button' }, wordChange(p.from, p.to, { whole: true }));
    b.addEventListener('click', () => {
      showExample(example, p.ex, p.to);
      say(`${p.from}, ${p.to}. ${p.ex}`, b);
    });
    return b;
  });
  return h('div', { class: 'rule-body' }, h('div', { class: 'pairs' }, cards), example);
}
