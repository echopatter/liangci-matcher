// Drill engines: shared quiz frame, match drill (two tier scoring), reverse
// drill, context clash, and the "Why?" explanation builder.

import { CLASSIFIERS } from '../data/classifiers.js';
import { NOUNS, CONTEXT_ITEMS } from '../data/nouns.js';
import { state, mastery, recordAnswer, recordConfusion, confusedWith } from './state.js';
import { el, hz, fmt, shuffle, pick, sample, kbdHint } from './ui.js';

// ---- tier aware data access ----

export function activeTiers() {
  return state.settings.hsk3 ? ['core', 'stretch', 'hsk3'] : ['core', 'stretch'];
}

export function activeNouns() {
  const tiers = activeTiers();
  return NOUNS.filter(n => tiers.includes(n.tier));
}

export function activeBest(noun) {
  // A best classifier only counts while its tier is visible.
  const tiers = activeTiers();
  const best = noun.best.filter(id => tiers.includes(CLASSIFIERS[id].tier) || CLASSIFIERS[id].tier === 'structural');
  return best.length ? best : noun.best; // stretch nouns keep their hsk3 classifier
}

export function activeAlts(noun) {
  const tiers = activeTiers();
  const map = new Map();
  for (const a of (noun.alt || [])) {
    if (a.tier && !tiers.includes(a.tier)) continue;
    if (!tiers.includes(CLASSIFIERS[a.cl].tier) && CLASSIFIERS[a.cl].tier !== 'structural') continue;
    map.set(a.cl, a.note);
  }
  return map;
}

export function drillableClassifiers() {
  const tiers = activeTiers();
  return Object.values(CLASSIFIERS).filter(c => tiers.includes(c.tier) && c.group !== 'structural');
}

// ---- "Why?" engine ----

function clName(id) {
  const c = CLASSIFIERS[id];
  return hz(c.hanzi, c.pinyin, 'cl-name');
}

function whyRight(noun, chosenId, altNote) {
  const p = el('p', {});
  if (altNote) { p.append(fmt(altNote)); return p; }
  if (noun.note) { p.append(fmt(noun.note)); return p; }
  const c = CLASSIFIERS[chosenId];
  p.append(clName(chosenId), ' is for ', fmt(c.frag), '.');
  return p;
}

function whyHalf(bestId) {
  const p = el('p', {});
  p.append('Native speakers default to ', hz('个', 'gè'),
    ' in casual speech, but HSK tests the specific one. Here that is ',
    clName(bestId), '.');
  return p;
}

function whyWrong(noun, expectedId, chosenId) {
  const exp = CLASSIFIERS[expectedId];
  const cho = CLASSIFIERS[chosenId];
  const p = el('p', {});
  p.append(hz(noun.hanzi, noun.pinyin), ' takes ', clName(expectedId), '. It is for ', fmt(exp.frag), '. ');
  if (cho) p.append(clName(chosenId), ' is for ', fmt(cho.frag), '.');
  if (noun.note) p.append(' ', fmt(noun.note));
  return p;
}

// ---- shared quiz frame ----

// gen() -> { prompt: Node, options: [{ key, node }], answer(key) -> verdict } or null when done.
// verdict: { score: 1|0.5|0, correctKeys: [..], headline, why: Node }
export function runQuiz(container, { title, gen, backHash = '#/home' }) {
  let points = 0, total = 0, current = null, answered = false;

  const scoreEl = el('span', { class: 'quiz-score', 'aria-live': 'polite' }, 'Score 0 / 0');
  const promptEl = el('div', { class: 'quiz-prompt' });
  const optsEl = el('div', { class: 'quiz-options', role: 'group' });
  const feedbackEl = el('div', { class: 'quiz-feedback', 'aria-live': 'polite' });
  const nextBtn = el('button', { class: 'btn primary', onclick: () => next(), hidden: true }, 'Next');
  const endLink = el('a', { class: 'btn ghost', href: backHash }, 'End session');

  container.append(
    el('div', { class: 'quiz-head' }, el('h2', {}, title), scoreEl),
    promptEl, optsEl, feedbackEl,
    el('div', { class: 'quiz-actions' }, nextBtn, endLink),
    kbdHint('Practicing on a computer? The keys work too. ', { key: '1' }, ' to ', { key: '4' },
      ' pick an answer, ', { key: 'enter' }, ' moves on.'),
  );

  function next() {
    current = gen();
    answered = false;
    feedbackEl.replaceChildren();
    nextBtn.hidden = true;
    if (!current) {
      promptEl.replaceChildren(el('p', { class: 'done-msg' }, 'That is the whole set. Nice work.'));
      optsEl.replaceChildren();
      endLink.textContent = 'Back';
      return;
    }
    promptEl.replaceChildren(current.prompt);
    optsEl.replaceChildren(...current.options.map((o, i) =>
      el('button', { class: 'opt', 'data-key': o.key, onclick: () => answer(o.key) },
        el('span', { class: 'opt-num' }, String(i + 1) + ' '), o.node)));
    optsEl.querySelector('button')?.focus();
  }

  function answer(key) {
    if (answered || !current) return;
    answered = true;
    const v = current.answer(key);
    points += v.score;
    total += 1;
    scoreEl.textContent = 'Score ' + (Math.round(points * 10) / 10) + ' / ' + total;
    for (const b of optsEl.querySelectorAll('button')) {
      b.disabled = true;
      const k = b.getAttribute('data-key');
      if (v.correctKeys.includes(k)) b.classList.add('correct');
      if (k === key && v.score === 0) b.classList.add('wrong');
      if (k === key && v.score === 0.5) b.classList.add('half');
    }
    const badge = v.score === 1 ? 'ok' : v.score === 0.5 ? 'half' : 'bad';
    const mark = v.score === 1 ? '✓ ' : v.score === 0 ? '✕ ' : '';
    feedbackEl.replaceChildren(
      el('p', { class: 'verdict ' + badge }, mark + v.headline),
      v.why ? el('div', { class: 'explain' }, v.why) : '');
    nextBtn.hidden = false;
    nextBtn.focus();
  }

  function onKey(e) {
    if (e.key >= '1' && e.key <= '9' && !answered) {
      const btn = optsEl.querySelectorAll('button')[+e.key - 1];
      if (btn) { e.preventDefault(); btn.click(); }
    } else if (e.key === 'Enter' && answered && !nextBtn.hidden) {
      e.preventDefault(); next();
    }
  }
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', () => document.removeEventListener('keydown', onKey), { once: true });

  next();
}

// ---- distractor selection ----

// Prefer the personal confusion matrix, then seeded confusions, then same
// group classifiers, then anything else in the option set.
function distractorsFor(expectedId, optionSet, excludeIds, count) {
  const out = [];
  const exclude = new Set(excludeIds);
  const addFrom = (ids) => {
    for (const id of ids) {
      if (out.length >= count) return;
      if (exclude.has(id) || out.includes(id)) continue;
      if (!optionSet.includes(id)) continue;
      out.push(id);
    }
  };
  addFrom(confusedWith(expectedId));
  addFrom(CLASSIFIERS[expectedId].confusions || []);
  const group = CLASSIFIERS[expectedId].group;
  addFrom(shuffle(optionSet.filter(id => CLASSIFIERS[id].group === group)));
  addFrom(shuffle(optionSet));
  return out;
}

// Weight noun choice toward classifiers the user has not mastered yet.
function weightedNoun(pool) {
  const weights = pool.map(n => 1.4 - mastery(activeBest(n)[0]).score + Math.random());
  let best = 0;
  for (let i = 1; i < pool.length; i++) if (weights[i] > weights[best]) best = i;
  return pool[best];
}

function nounPrompt(noun, question) {
  const wrap = el('div', {});
  wrap.append(el('div', { class: 'big-hanzi' }, hz(noun.hanzi, noun.pinyin)));
  if (state.settings.english) wrap.append(el('div', { class: 'gloss' }, noun.en));
  wrap.append(el('p', { class: 'question' }, question));
  return wrap;
}

// ---- match drill ----

export function genMatch(pool, optionSet) {
  if (!pool.length) return null;
  const noun = weightedNoun(pool);
  const best = activeBest(noun);
  const alts = activeAlts(noun);
  const expected = pick(best);
  const rightIds = new Set([...best, ...alts.keys()]);

  const opts = [expected];
  // 个 as a deliberate trap about half the time, when it is not already right.
  if (noun.geHalf && !rightIds.has('ge') && optionSet.includes('ge') && Math.random() < 0.5) opts.push('ge');
  opts.push(...distractorsFor(expected, optionSet, [...rightIds, ...opts], 4 - opts.length));
  const shown = shuffle([...new Set(opts)]);

  return {
    prompt: nounPrompt(noun, 'Which classifier fits?'),
    options: shown.map(id => ({ key: id, node: hz(CLASSIFIERS[id].hanzi, CLASSIFIERS[id].pinyin) })),
    answer(key) {
      const correctKeys = shown.filter(id => rightIds.has(id));
      if (best.includes(key)) {
        recordAnswer(key, 1);
        return { score: 1, correctKeys, headline: 'Right', why: whyRight(noun, key, null) };
      }
      if (alts.has(key)) {
        recordAnswer(key, 1);
        return { score: 1, correctKeys, headline: 'Right, with a nuance', why: whyRight(noun, key, alts.get(key)) };
      }
      if (key === 'ge' && noun.geHalf) {
        recordAnswer(expected, 0.5);
        recordConfusion(expected, 'ge');
        return { score: 0.5, correctKeys, headline: 'Understood, but not best', why: whyHalf(expected) };
      }
      recordAnswer(expected, 0);
      recordConfusion(expected, key);
      return { score: 0, correctKeys, headline: 'Not this one', why: whyWrong(noun, expected, key) };
    },
  };
}

// ---- reverse drill ----

export function genReverse(pool, clSet) {
  const accepts = (n, clId) =>
    activeBest(n).includes(clId) || activeAlts(n).has(clId) || (clId === 'ge' && n.geHalf);
  // 个 pairs with nearly everything, so it stays out of the reverse drill.
  const usable = clSet.filter(id => id !== 'ge'
    && pool.some(n => activeBest(n).includes(id))
    && pool.filter(n => !accepts(n, id)).length >= 3);
  if (!usable.length) return null;

  const clId = pick(usable);
  const c = CLASSIFIERS[clId];
  const correct = pick(pool.filter(n => activeBest(n).includes(clId)));
  const wrongs = sample(pool.filter(n => !accepts(n, clId)), 3);
  const shown = shuffle([correct, ...wrongs]);

  const promptWrap = el('div', {});
  promptWrap.append(el('div', { class: 'big-hanzi' }, hz(c.hanzi, c.pinyin)));
  if (state.settings.english) promptWrap.append(el('div', { class: 'gloss' }, 'for ' + c.en));
  promptWrap.append(el('p', { class: 'question' }, 'Which noun does it pair with?'));

  return {
    prompt: promptWrap,
    options: shown.map(n => ({
      key: n.id,
      node: el('span', {}, hz(n.hanzi, n.pinyin), state.settings.english ? el('span', { class: 'opt-gloss' }, ' ' + n.en) : null),
    })),
    answer(key) {
      const correctKeys = [correct.id];
      if (key === correct.id) {
        recordAnswer(clId, 1);
        return { score: 1, correctKeys, headline: 'Right', why: whyRight(correct, clId, null) };
      }
      recordAnswer(clId, 0);
      const chosen = shown.find(n => n.id === key);
      const p = el('p', {});
      p.append(clName(clId), ' is for ', fmt(c.frag), '. ',
        hz(chosen.hanzi, chosen.pinyin), ' takes ', clName(activeBest(chosen)[0]), ' instead.');
      recordConfusion(clId, activeBest(chosen)[0]);
      return { score: 0, correctKeys, headline: 'Not this one', why: p };
    },
  };
}

// ---- context clash ----

export function makeContextGen() {
  const tiers = activeTiers();
  const queue = shuffle(CONTEXT_ITEMS.filter(it => tiers.includes(it.tier)));
  let i = 0;
  return function gen() {
    if (i >= queue.length) return null;
    const item = queue[i++];
    const noun = NOUNS.find(n => n.id === item.noun);
    const shown = shuffle(item.options);

    const promptWrap = el('div', {});
    promptWrap.append(el('p', { class: 'cue' }, item.cue));
    promptWrap.append(el('div', { class: 'big-hanzi' }, hz(noun.hanzi, noun.pinyin)));
    if (state.settings.english) promptWrap.append(el('div', { class: 'gloss' }, noun.en));
    promptWrap.append(el('p', { class: 'question' }, 'Which classifier fits this situation?'));

    return {
      prompt: promptWrap,
      options: shown.map(id => ({ key: id, node: hz(CLASSIFIERS[id].hanzi, CLASSIFIERS[id].pinyin) })),
      answer(key) {
        const correctKeys = [item.correct];
        const p = el('p', {});
        p.append(fmt(item.why));
        if (key === item.correct) {
          recordAnswer(item.correct, 1);
          return { score: 1, correctKeys, headline: 'Right', why: p };
        }
        recordAnswer(item.correct, 0);
        recordConfusion(item.correct, key);
        return { score: 0, correctKeys, headline: 'Not in this situation', why: p };
      },
    };
  };
}
