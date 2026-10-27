#!/usr/bin/env node
// Validates content/packs/*.json against the schema in docs/SPEC.md
// and against the school's grammar rules. Usage: node scripts/validate-packs.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const readJson = (p) => {
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { err(p, `cannot read JSON (${e.message})`); return null; }
};

const WHO = ['I', 'one', 'we', 'many'];
const TIME = ['now', 'before', 'later'];
const PATTERNS = ['add-ed', 'add-d', 'y-ied', 'double', 'irregular'];
const TYPES = ['pick', 'when', 'spell', 'build', 'say'];

// School rules: which form each "who" takes, per word family.
const FAMILIES = [
  { forms: ['am', 'is', 'are'], by: { I: 'am', one: 'is', we: 'are', many: 'are' } },
  { forms: ['was', 'were'], by: { I: 'was', one: 'was', we: 'were', many: 'were' } },
  { forms: ['has', 'have'], by: { I: 'have', one: 'has', we: 'have', many: 'have' } },
  { forms: ['shall', 'will'], by: { I: 'shall', one: 'will', we: 'shall', many: 'will' } },
];

const rules = readJson(join(root, 'content/rules.json')) || {};
const index = readJson(join(root, 'content/packs/index.json'));
if (!index?.packs?.length) err('index.json', 'no packs listed');

const seenIds = new Map();

function checkItem(item, where, { inCheckup, unitIds }) {
  const w = `${where} ${item.id ?? '(no id)'}`;
  if (!item.id) err(w, 'missing id');
  else if (seenIds.has(item.id)) err(w, `duplicate id (also in ${seenIds.get(item.id)})`);
  else seenIds.set(item.id, where);

  if (!TYPES.includes(item.type)) { err(w, `unknown type "${item.type}"`); return; }
  if (!item.pic) warn(w, 'no pic');
  if (inCheckup) {
    if (item.type === 'say') err(w, 'say items belong in "together", not checkup');
    if (!unitIds.has(item.unit)) err(w, `checkup item needs "unit" pointing to a unit in this pack (got "${item.unit}")`);
  }

  const has = (sub, field) => {
    if (sub == null) return;
    if (!item.text?.includes(sub)) err(w, `${field} "${sub}" is not in the text exactly`);
  };

  switch (item.type) {
    case 'pick': {
      const blanks = (item.text?.match(/___/g) || []).length;
      if (blanks !== 1) err(w, `text must contain exactly one ___ (found ${blanks})`);
      if (!Array.isArray(item.options) || item.options.length < 2) err(w, 'needs at least 2 options');
      else {
        if (new Set(item.options).size !== item.options.length) err(w, 'duplicate options');
        if (!item.options.includes(item.answer)) err(w, `answer "${item.answer}" is not one of the options`);
        if (item.text?.startsWith('___') && item.options.some((o) => o[0] !== o[0].toUpperCase()))
          err(w, 'blank starts the sentence, so options must be capitalised');
      }
      if (item.who != null && !WHO.includes(item.who)) err(w, `who must be one of ${WHO.join(', ')}`);
      if (item.time != null && !TIME.includes(item.time)) err(w, `time must be one of ${TIME.join(', ')}`);
      has(item.subject, 'subject');
      has(item.clue, 'clue');
      // Grammar rule check
      const ans = item.answer?.toLowerCase();
      for (const fam of FAMILIES) {
        if (fam.forms.includes(ans)) {
          if (!item.who) { warn(w, `"${ans}" depends on who: add "who" and "subject" so hints work`); break; }
          const expected = fam.by[item.who];
          if (expected !== ans) err(w, `school rule says who="${item.who}" takes "${expected}", but answer is "${ans}"`);
          break;
        }
      }
      if (item.who && !item.subject) warn(w, 'has "who" but no "subject" to highlight');
      break;
    }
    case 'when': {
      if (!TIME.includes(item.answer)) err(w, `answer must be one of ${TIME.join(', ')}`);
      if (!item.clue) err(w, 'when items need a clue');
      has(item.clue, 'clue');
      const station = rules.when?.stations?.find((s) => s.time === item.answer);
      if (station && item.clue && !station.clues.some((c) => c.toLowerCase() === item.clue.toLowerCase()))
        warn(w, `clue "${item.clue}" isn't listed under ${item.answer} in rules.json (add it there if it's a school clue)`);
      break;
    }
    case 'spell': {
      if (!item.base || !item.answer) err(w, 'spell items need base and answer');
      if (!PATTERNS.includes(item.pattern)) err(w, `pattern must be one of ${PATTERNS.join(', ')}`);
      const b = item.base ?? '', a = item.answer ?? '';
      const expect = {
        'add-ed': b + 'ed',
        'add-d': b + 'd',
        'y-ied': b.slice(0, -1) + 'ied',
        double: b + b.slice(-1) + 'ed',
      }[item.pattern];
      if (expect && expect !== a) err(w, `pattern ${item.pattern} turns "${b}" into "${expect}", not "${a}"`);
      if (!/^[a-z]+$/.test(a)) err(w, 'answer must be lowercase letters only (tiles)');
      break;
    }
    case 'build': {
      const words = item.text?.trim().split(/\s+/) || [];
      if (words.length < 3) err(w, 'build sentence needs at least 3 words');
      if (words.length > 8) warn(w, 'build sentences over 8 words are hard for a 6-year-old');
      break;
    }
    case 'say': {
      if (!item.prompt) err(w, 'say items need a prompt');
      break;
    }
  }
  if (item.text && item.text.length > 70) warn(w, 'sentence is long for an early reader');
}

for (const entry of index?.packs || []) {
  const path = join(root, 'content/packs', entry.file);
  if (!existsSync(path)) { err('index.json', `file not found: ${entry.file}`); continue; }
  const pack = readJson(path);
  if (!pack) continue;
  const p = entry.file;
  if (pack.id !== entry.id) err(p, `pack id "${pack.id}" doesn't match index id "${entry.id}"`);
  for (const f of ['title', 'objectives', 'units']) if (!pack[f]) err(p, `missing ${f}`);

  const objIds = new Set((pack.objectives || []).map((o) => o.id));
  const unitIds = new Set((pack.units || []).map((u) => u.id));
  const usedObjectives = new Set();

  for (const unit of pack.units || []) {
    const u = `${p} > ${unit.id}`;
    if (!rules[unit.rule]) err(u, `rule "${unit.rule}" not found in rules.json`);
    for (const o of unit.objectives || []) {
      if (!objIds.has(o)) err(u, `unknown objective "${o}"`);
      usedObjectives.add(o);
    }
    if (!unit.items?.length) err(u, 'no items');
    else if (unit.items.length < 6) warn(u, `only ${unit.items.length} items; 6+ makes rounds less repetitive`);
    for (const item of unit.items || []) {
      if (item.type === 'say') err(`${u} ${item.id}`, 'say items belong in "together"');
      checkItem(item, u, { inCheckup: false, unitIds });
    }
  }
  for (const o of objIds) if (!usedObjectives.has(o)) warn(p, `objective ${o} has no unit practising it`);
  for (const item of pack.together || []) {
    if (item.type !== 'say') err(`${p} > together ${item.id}`, 'together items must be type "say"');
    checkItem(item, `${p} > together`, { inCheckup: false, unitIds });
  }
  for (const item of pack.checkup || []) checkItem(item, `${p} > checkup`, { inCheckup: true, unitIds });
}

for (const wmsg of warnings) console.log(`warn   ${wmsg}`);
for (const emsg of errors) console.log(`ERROR  ${emsg}`);
console.log(`\n${seenIds.size} items checked, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
