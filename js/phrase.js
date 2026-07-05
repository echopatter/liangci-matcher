// Phrase builder: assemble 数字 + 量词 + 名词 chips into a correct phrase.
// Enforces the 两 vs 二 rule and can display the 一 tone change (yí vs yì).

import { CLASSIFIERS } from '../data/classifiers.js';
import { state, recordAnswer, recordConfusion } from './state.js';
import { el, hz, fmt, shuffle, pick, sample, yiBefore } from './ui.js';
import { activeBest } from './drills.js';

const NUMBERS = [
  { n: 1, hanzi: '一', pinyin: 'yī', en: 'one' },
  { n: 2, hanzi: '两', pinyin: 'liǎng', en: 'two' },
  { n: 3, hanzi: '三', pinyin: 'sān', en: 'three' },
  { n: 4, hanzi: '四', pinyin: 'sì', en: 'four' },
  { n: 5, hanzi: '五', pinyin: 'wǔ', en: 'five' },
];
const ER = { n: 2, hanzi: '二', pinyin: 'èr', en: 'two' };

// Counter phrasing for the english target, keyed by classifier.
const COUNTERS = {
  bei: ['cup of', 'cups of'], ping: ['bottle of', 'bottles of'],
  kuai: ['piece of', 'pieces of'], shuang: ['pair of', 'pairs of'],
  zhong: ['kind of', 'kinds of'], duan: ['stretch of', 'stretches of'],
  ceng: ['floor of', 'floors of'], pian: ['', ''],
};

function englishTarget(num, clId, noun) {
  const counter = COUNTERS[clId];
  const nounEn = num.n === 1 ? noun.en : noun.en2;
  if (counter && counter[0]) {
    // "two bottles of beer": counter carries the plural, noun stays base.
    const base = noun.en.replace(/^(piece|pair|kind|stretch) of /, '').replace(/^sheet of /, '');
    const basePl = noun.en2.replace(/^(pieces|pairs|kinds|stretches) of /, '').replace(/^sheets of /, '');
    return num.en + ' ' + (num.n === 1 ? counter[0] : counter[1]) + ' ' + (num.n === 1 ? base : basePl);
  }
  return num.en + ' ' + nounEn;
}

function phrasePinyin(num, cl, noun) {
  let numPy = num.pinyin;
  if (num.n === 1 && state.settings.toneChange) numPy = yiBefore(cl.pinyin);
  return numPy + ' ' + cl.pinyin + ' ' + noun.pinyin;
}

export function renderPhraseBuilder(container, pool, clSet, backHash = '#/home') {
  // Nouns that make natural counting phrases (skip money and speech).
  const usable = pool.filter(n => !['qian', 'hua', 'shijian'].includes(n.id));
  let points = 0, total = 0;

  const scoreEl = el('span', { class: 'quiz-score', 'aria-live': 'polite' }, 'Score 0 / 0');
  const targetEl = el('div', { class: 'quiz-prompt' });
  const slotsEl = el('div', { class: 'slots' });
  const chipsEl = el('div', { class: 'chips' });
  const feedbackEl = el('div', { class: 'quiz-feedback', 'aria-live': 'polite' });
  const checkBtn = el('button', { class: 'btn primary', onclick: () => check() }, 'Check');
  const nextBtn = el('button', { class: 'btn primary', onclick: () => next(), hidden: true }, 'Next');

  container.append(
    el('div', { class: 'quiz-head' }, el('h2', {}, 'Phrase builder'), scoreEl),
    targetEl, slotsEl, chipsEl, feedbackEl,
    el('div', { class: 'quiz-actions' }, checkBtn, nextBtn, el('a', { class: 'btn ghost', href: backHash }, 'End session')),
    el('p', { class: 'kbd-hint' }, 'Tap chips to fill the slots. Tap a filled slot to clear it.'),
  );

  let q = null; // { num, cl, noun, slots: {num, cl, noun} }

  function next() {
    const noun = pick(usable);
    const clId = pick(activeBest(noun).filter(id => clSet.includes(id))) || activeBest(noun)[0];
    const cl = CLASSIFIERS[clId];
    // Lean on 2 so the 两 rule comes up often.
    const num = Math.random() < 0.35 ? NUMBERS[1] : pick(NUMBERS);
    q = { num, cl, noun, slots: { num: null, cl: null, noun: null } };

    const numChips = num.n === 2 ? [NUMBERS[1], ER] : shuffle([num, pick(NUMBERS.filter(x => x.n !== num.n))]);
    const clChips = shuffle([cl, ...sample(Object.values(CLASSIFIERS).filter(c =>
      clSet.includes(c.id) && c.id !== cl.id && !activeBest(noun).includes(c.id)), 2)]);
    const nounChips = shuffle([noun, pick(usable.filter(x => x.id !== noun.id && !activeBest(x).includes(cl.id)) )].filter(Boolean));

    targetEl.replaceChildren(
      el('p', { class: 'question' }, 'Build the phrase:'),
      el('div', { class: 'target-en' }, englishTarget(num, clId, noun)));
    feedbackEl.replaceChildren();
    checkBtn.hidden = false;
    nextBtn.hidden = true;

    renderSlots();
    chipsEl.replaceChildren(
      chipRow('数字', 'shùzì', numChips.map(c => chip('num', c, hz(c.hanzi, c.pinyin)))),
      chipRow('量词', 'liàngcí', clChips.map(c => chip('cl', c, hz(c.hanzi, c.pinyin)))),
      chipRow('名词', 'míngcí', nounChips.map(c => chip('noun', c, hz(c.hanzi, c.pinyin)))));
  }

  function chipRow(label, py, chips) {
    return el('div', { class: 'chip-row' }, el('span', { class: 'chip-label' }, hz(label, py)), ...chips);
  }

  function chip(slot, value, node) {
    return el('button', { class: 'chip', onclick: (e) => {
      q.slots[slot] = value;
      for (const b of e.currentTarget.parentElement.querySelectorAll('.chip')) b.classList.remove('picked');
      e.currentTarget.classList.add('picked');
      renderSlots();
    } }, node);
  }

  function renderSlots() {
    const slotEl = (slot, label) => {
      const v = q.slots[slot];
      const rowIndex = { num: 0, cl: 1, noun: 2 }[slot];
      return el('button', { class: 'slot' + (v ? ' filled' : ''), onclick: () => {
        q.slots[slot] = null;
        const row = chipsEl.children[rowIndex];
        if (row) for (const b of row.querySelectorAll('.chip.picked')) b.classList.remove('picked');
        renderSlots();
      } }, v ? hz(v.hanzi, v.pinyin) : el('span', { class: 'slot-label' }, label));
    };
    slotsEl.replaceChildren(slotEl('num', '数字'), slotEl('cl', '量词'), slotEl('noun', '名词'));
  }

  function check() {
    const s = q.slots;
    if (!s.num || !s.cl || !s.noun) {
      feedbackEl.replaceChildren(el('p', { class: 'verdict half' }, 'Fill all three slots first.'));
      return;
    }
    total += 1;
    let verdict, why = el('p', {});
    if (s.num.hanzi === '二' && q.num.n === 2) {
      verdict = 'bad';
      why.append('Before a classifier, two is ', hz('两', 'liǎng'), ', not ', hz('二', 'èr'),
        '. ', hz('二', 'èr'), ' is for counting and math. Say ', hz('两个人', 'liǎng gè rén'), ', never 二个人.');
      recordAnswer(q.cl.id, 0);
    } else if (s.num.n !== q.num.n) {
      verdict = 'bad';
      why.append('The number is off. The target asks for ' + q.num.en + ', which is ', hz(q.num.hanzi, q.num.pinyin), '.');
    } else if (s.cl.id !== q.cl.id) {
      verdict = 'bad';
      why.append(hz(q.noun.hanzi, q.noun.pinyin), ' takes ', hz(q.cl.hanzi, q.cl.pinyin),
        '. It is for ', fmt(q.cl.frag), '.');
      recordAnswer(q.cl.id, 0);
      recordConfusion(q.cl.id, s.cl.id);
    } else if (s.noun.id !== q.noun.id) {
      verdict = 'bad';
      why.append('Wrong noun. The target asks for ', hz(q.noun.hanzi, q.noun.pinyin), ', "' + q.noun.en + '".');
    } else {
      verdict = 'ok';
      points += 1;
      why.append('That reads ', hz(q.num.hanzi + q.cl.hanzi + q.noun.hanzi, phrasePinyin(q.num, q.cl, q.noun)), '.');
      if (q.num.n === 1 && state.settings.toneChange) {
        why.append(' Note the tone of ', hz('一', 'yī'), ' shifts to ' + yiBefore(q.cl.pinyin) + ' before ',
          hz(q.cl.hanzi, q.cl.pinyin), '.');
      }
      recordAnswer(q.cl.id, 1);
    }
    scoreEl.textContent = 'Score ' + points + ' / ' + total;
    feedbackEl.replaceChildren(
      el('p', { class: 'verdict ' + verdict }, verdict === 'ok' ? '✓ Right' : '✕ Not quite'),
      el('div', { class: 'explain' }, why));
    if (verdict === 'ok') { checkBtn.hidden = true; nextBtn.hidden = false; nextBtn.focus(); }
  }

  next();
}
