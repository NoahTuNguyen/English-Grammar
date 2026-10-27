// Web Speech wrapper.
// - Picks a British-ish English voice (en-GB, then en-SG, en-AU, then any en-*).
// - iOS only allows speech after a user gesture, so unlock() speaks a silent
//   utterance on the very first tap.
// - Reads the blank "___" as a short pause.
// If speech isn't supported, everything here quietly does nothing and
// <html> gets the class "no-speech" so CSS can hide the speaker icons.

const synth = window.speechSynthesis;
export const available = !!(synth && window.SpeechSynthesisUtterance);

const PREFERRED = ['en-gb', 'en-sg', 'en-au'];
export const RATE_NORMAL = 0.85;
export const RATE_SLOW = 0.7;

let voice = null;
let rate = RATE_NORMAL;
let unlocked = false;

function langOf(v) {
  return v.lang.replace('_', '-').toLowerCase();
}

function pickVoice() {
  const voices = synth.getVoices();
  for (const lang of PREFERRED) {
    const matches = voices.filter((v) => langOf(v) === lang);
    if (matches.length) {
      // Local voices start faster and work offline.
      voice = matches.find((v) => v.localService) || matches[0];
      return;
    }
  }
  voice = voices.find((v) => langOf(v).startsWith('en')) || null;
}

export function init() {
  if (!available) {
    document.documentElement.classList.add('no-speech');
    return;
  }
  pickVoice();
  // Chrome loads voices asynchronously.
  synth.addEventListener?.('voiceschanged', pickVoice);

  // First tap anywhere unlocks speech on iOS.
  const unlockOnce = () => {
    unlock();
    document.removeEventListener('touchend', unlockOnce, true);
    document.removeEventListener('click', unlockOnce, true);
  };
  document.addEventListener('touchend', unlockOnce, true);
  document.addEventListener('click', unlockOnce, true);
}

export function unlock() {
  if (!available || unlocked) return;
  unlocked = true;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  synth.speak(u);
}

export function setRate(r) {
  rate = r;
}

// Turn display text into something that sounds right.
export function clean(text) {
  return String(text)
    .replace(/_{3,}/g, ', ... ,')
    .replace(/…/g, '');
}

// Speak text. Calls onend when finished (or interrupted, or unsupported).
export function speak(text, { onend } = {}) {
  if (!available || !text) {
    onend?.();
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(clean(text));
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = 'en-GB';
  }
  u.rate = rate;
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      onend?.();
    }
  };
  u.onend = finish;
  u.onerror = finish;
  synth.speak(u);
}

export function stop() {
  if (available) synth.cancel();
}
