// Practice engine: builds rounds, keeps score, and decides what each hint says.
// No DOM here. The practise view does the drawing.

export const ROUND_SIZE = 8;
const MAX_MISSED = 3;       // up to 3 recently missed items come back in a new round
const RECENT = 100;         // "recently" = within the last 100 attempts

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick up to 8 items from a unit, preferring ones missed recently.
export function buildRound(items, attempts, size = ROUND_SIZE) {
  const pool = items.filter((i) => i.type !== 'say');
  const ids = new Set(pool.map((i) => i.id));
  const missed = [];
  for (let k = attempts.length - 1; k >= Math.max(0, attempts.length - RECENT) && missed.length < MAX_MISSED; k--) {
    const a = attempts[k];
    if (ids.has(a.item) && !a.firstTry && !missed.includes(a.item)) missed.push(a.item);
  }
  const preferred = pool.filter((i) => missed.includes(i.id));
  const rest = shuffle(pool.filter((i) => !missed.includes(i.id)));
  return shuffle([...preferred, ...rest].slice(0, size));
}

// One round: a queue of items. In practise mode, an item whose answer had to
// be shown (hint step 3) comes back once at the end of the round.
export class Round {
  constructor(items, { requeue = true } = {}) {
    this.queue = [...items];
    this.total = items.length;
    this.pos = 0;
    this.requeue = requeue;
    this.firstTry = new Map(); // item id -> right on the very first try?
  }

  get current() {
    return this.queue[this.pos];
  }

  get done() {
    return this.pos >= this.queue.length;
  }

  // Finish the current item. Returns true if this was its first showing
  // (only first showings count for stars and are saved as attempts).
  finish(item, { wrongTries, revealed }) {
    const first = !this.firstTry.has(item.id);
    if (first) {
      this.firstTry.set(item.id, wrongTries === 0);
      if (this.requeue && revealed) this.queue.push(item);
    }
    this.pos++;
    return first;
  }

  get firstTryCorrect() {
    return [...this.firstTry.values()].filter(Boolean).length;
  }

  stars() {
    return starsFor(this.firstTryCorrect, this.total);
  }
}

// First-try correct: 90%+ -> 3 stars, 60%+ -> 2, else 1.
export function starsFor(correct, total) {
  const r = total ? correct / total : 0;
  return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1;
}

export function isRight(item, choice) {
  return choice === item.answer;
}

// ---- What gets said ----

// The sentence as shown, with the base word in brackets after the blank.
export function displayText(item) {
  return item.base ? item.text.replace('___', `___ (${item.base})`) : item.text;
}

// Read when the question appears (and when the sentence or picture is tapped).
// Options are read too, so she can hear the choices without tapping them.
export function promptSpeech(item) {
  switch (item.type) {
    case 'pick': return `${displayText(item)} ${item.options.join(', or ')}?`;
    case 'when': return `${item.text} Now, Before, or Later?`;
    case 'spell': return `${item.base}. Make the Before word.`;
    case 'build': return `Make the sentence. ${item.text}`;
    default: return item.text || '';
  }
}

// The finished sentence, read after a right answer.
export function fullSentence(item) {
  switch (item.type) {
    case 'pick': return item.text.replace('___', item.answer);
    case 'spell': return `${item.base}, ${item.answer}.`;
    default: return item.text;
  }
}

const WHO_LINE = {
  I: 'Who is it? I!',
  we: 'Who is it? We!',
  one: 'One or many? One!',
  many: 'One or many? Many!',
};

// Hint step 1. Returns { text, who, marks } where marks are the parts of
// the text to highlight (and of the sentence above).
export function hintLine(item, rule) {
  const marks = [{ text: item.subject }, { text: item.clue }].filter((m) => m.text);
  if (item.hint) return { text: item.hint, who: item.who, marks };
  switch (item.type) {
    case 'pick':
      if (item.who && item.subject) return { text: `Look: ${item.subject}. ${WHO_LINE[item.who]}`, who: item.who, marks };
      if (item.clue) return { text: `Find the time clue: ${item.clue}.`, marks };
      return { text: 'Listen to the sentence again.', marks };
    case 'when':
      return { text: `Find the time clue: ${item.clue}.`, marks };
    case 'spell': {
      const p = rule?.patterns?.find((x) => x.id === item.pattern);
      return { text: p ? `${p.rule}.` : rule?.line || 'Listen to the word again.', marks: [] };
    }
    default:
      return { text: 'Listen again.', marks: [] };
  }
}

// Hint step 2: which part of the rule card to show (see rulecard.js).
export function compactOptions(item) {
  if (item.type === 'spell') return { pattern: item.pattern, from: item.base };
  return { row: item.time, who: item.who, from: item.base };
}

// Letter tiles for a spell item: the answer's letters plus 2 extra letters.
export function letterTiles(answer, extra = 2) {
  const spare = 'abcdefghijklmnoprstuwy'.split('').filter((c) => !answer.includes(c));
  const extras = shuffle(spare).slice(0, extra);
  return shuffle([...answer.split(''), ...extras]);
}

// Word tiles for a build item, never left already in order.
export function wordTiles(text) {
  const words = text.trim().split(/\s+/);
  if (new Set(words).size < 2) return words;
  let tiles;
  do tiles = shuffle(words);
  while (tiles.join(' ') === words.join(' '));
  return tiles;
}
