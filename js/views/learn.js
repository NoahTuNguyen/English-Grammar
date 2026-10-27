// Learn: the unit's rule card, the "Say it aloud" strip and "Let's practise".
// #/learn/<pack>/<unit>/first is the first visit, reached from the Practise
// button: the rule is read out and "Let's practise" bounces to lead on.

import * as content from '../content.js';
import * as store from '../store.js';
import { h, icon, say, sayable, backButton } from '../ui.js';
import { ruleCard } from '../rulecard.js';

export async function render(packId, unitId, first) {
  const [found, rules] = await Promise.all([content.unit(packId, unitId), content.rules()]);
  if (!found?.unit) throw new Error(`No unit called "${unitId}"`);
  const { pack, unit } = found;
  const rule = rules[unit.rule];
  if (!rule) throw new Error(`No rule called "${unit.rule}"`);
  store.markLearned(unit.id);

  const line = sayable(h('p', { class: 'sentence rule-line' }, rule.line), rule.line);
  if (first === 'first' && store.settings().readAloud) {
    setTimeout(() => line.isConnected && say(rule.line, line), 400);
  }

  return h(
    'div',
    { class: 'screen learn' },
    h(
      'header',
      { class: 'bar' },
      backButton(`#/pack/${pack.id}`, 'Back to pack'),
      h('span', { class: 'bar-pic', 'aria-hidden': 'true' }, unit.pic || '📘'),
      sayable(h('h1', { class: 'bar-title' }, rule.title), rule.title),
    ),
    line,
    h('section', { class: 'rule-card' }, ruleCard(rule, { pack })),
    rule.sayAloud &&
      sayable(
        h('div', { class: 'say-aloud' }, h('span', { class: 'say-aloud-pic', 'aria-hidden': 'true' }, '🗣️'), h('span', { class: 'sentence' }, rule.sayAloud)),
        rule.sayAloud,
      ),
    h(
      'a',
      { class: `big-btn go${first === 'first' ? ' lead-on' : ''}`, href: `#/practise/${pack.id}/${unit.id}` },
      icon('play'),
      h('span', {}, "Let's practise"),
    ),
  );
}
