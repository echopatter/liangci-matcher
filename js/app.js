// Liangci Matcher: router and screens.

import { CLASSIFIERS, CL_LIST, CONFUSION_PAIRS } from '../data/classifiers.js';
import { NOUNS } from '../data/nouns.js';
import { FACTS } from '../data/facts.js';
import { LESSONS } from '../data/lessons.js';
import { state, save, mastery, exportJSON, importJSON, resetAll } from './state.js';
import { el, hz, fmt, shuffle, pick, sample, kbdHint } from './ui.js';
import { runQuiz, genMatch, genReverse, makeContextGen, activeTiers, activeNouns, drillableClassifiers, activeBest } from './drills.js';
import { renderPhraseBuilder } from './phrase.js';

const screen = document.getElementById('screen');

// ---- settings application ----

function applySettings() {
  document.documentElement.dataset.theme = state.settings.theme;
  document.body.classList.toggle('nopy', !state.settings.pinyin);
}

// ---- lesson helpers ----

function visibleLessons() {
  return LESSONS.filter(l => !l.hsk3 || state.settings.hsk3);
}

function lessonMastery(lesson) {
  const scores = lesson.cls.map(id => {
    const m = mastery(id);
    return m.attempts >= 3 ? m.score : 0;
  });
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

function unlocked(lesson) {
  const idx = LESSONS.findIndex(l => l.id === lesson.id);
  if (idx <= 0) return true;
  return lessonMastery(LESSONS[idx - 1]) >= 0.6;
}

function optionSetForLesson(id) {
  const ids = drillableClassifiers().filter(c => c.lesson <= id).map(c => c.id);
  if (id >= 4 && !ids.includes('ba')) ids.push('ba'); // stretch preview of 把
  return ids;
}

function poolForLesson(id, { focusOnly = false } = {}) {
  const nouns = activeNouns().concat(
    // the stretch chair is always drillable from lesson 4 on
    NOUNS.filter(n => n.tier === 'stretch' && !activeNouns().includes(n)));
  const focus = nouns.filter(n => n.lesson === id);
  if (focusOnly) return focus;
  const review = sample(nouns.filter(n => n.lesson < id), 5);
  return focus.concat(review);
}

// ---- screens ----

function renderHome() {
  const wrap = el('div', {});

  if (state.settings.facts && FACTS.length) {
    let factIdx = Math.floor(Math.random() * FACTS.length);
    const factText = el('p', { class: 'fact-text' }, fmt(FACTS[factIdx].text));
    wrap.append(el('div', { class: 'fact-box' },
      el('p', { class: 'fact-kicker' }, 'Did you know?'),
      factText,
      el('p', { class: 'fact-actions' },
        el('button', { class: 'linklike', onclick: () => {
          factIdx = (factIdx + 1) % FACTS.length;
          factText.replaceChildren(fmt(FACTS[factIdx].text));
        } }, 'Show me another'))));
  }

  // Mode cards drill everything up to the furthest suggested lesson.
  const lessons = visibleLessons();
  let cur = lessons[0];
  for (const l of lessons) if (unlocked(l)) cur = l;

  const modes = el('div', { class: 'stack' },
    modeCard('Match drill', 'see a noun, pick the classifier, adaptive distractors', '#/match/' + cur.id),
    modeCard('Reverse drill', 'see a classifier, pick the noun it pairs with', '#/reverse/' + cur.id),
    modeCard('Phrase builder', 'assemble {数字|shùzì} + {量词|liàngcí} + {名词|míngcí} chips into a phrase', '#/phrase/' + cur.id),
    modeCard('Context clash', 'same noun, different situation: cup or bottle, one shoe or the pair', '#/context'),
    modeCard('Custom drill', 'pick exactly the classifiers to practice', '#/custom'),
    modeCard('Common confusions', 'drill confusable pairs like {张|zhāng} and {条|tiáo}', '#/custom'));
  wrap.append(modes);

  wrap.append(kbdHint('Practicing on a computer? The keys work too. ', { key: '1' }, ' to ', { key: '4' },
    ' pick an answer, ', { key: 'enter' }, ' moves on.'));

  wrap.append(el('h3', {}, 'Lesson path'));
  const path = el('div', {});
  for (const lesson of lessons) {
    const clsLine = el('p', { class: 'path-cls' });
    lesson.cls.forEach((id, i) => {
      if (i) clsLine.append(' ');
      clsLine.append(hz(CLASSIFIERS[id].hanzi, CLASSIFIERS[id].pinyin));
    });
    path.append(el('div', { class: 'path-row' },
      el('div', {},
        el('p', { class: 'path-title' }, el('strong', {}, 'L' + lesson.id + ' '), lesson.title.replace(/^Lesson \d+\. /, '')),
        clsLine),
      el('a', { class: 'btn compact', href: '#/lesson/' + lesson.id }, 'Open')));
  }
  wrap.append(path);

  screen.append(wrap);
}

function modeCard(title, sub, href) {
  return el('a', { class: 'mode-card', href },
    el('h2', {}, title),
    el('p', {}, fmt(sub)));
}

function renderLesson(id) {
  const lesson = LESSONS.find(l => l.id === id);
  if (!lesson) return renderHome();
  const wrap = el('div', { class: 'stack' });

  wrap.append(el('a', { class: 'back', href: '#/home' }, '← All lessons'));
  wrap.append(el('h2', {}, lesson.title));
  wrap.append(el('p', { class: 'blurb' }, lesson.blurb));

  const clCards = el('div', { class: 'stack tight' });
  for (const clId of lesson.cls) {
    const c = CLASSIFIERS[clId];
    clCards.append(el('div', { class: 'card cl-card' },
      el('div', { class: 'cl-card-head' }, hz(c.hanzi, c.pinyin, 'cl-big'),
        el('span', { class: 'cl-en' }, c.en)),
      el('p', { class: 'cl-rule' }, 'For ', fmt(c.frag), '.')));
  }
  wrap.append(clCards);

  const modes = el('div', { class: 'mode-row' });
  const modeDefs = {
    match: ['Match drill', '#/match/' + id],
    reverse: ['Reverse drill', '#/reverse/' + id],
    phrase: ['Phrase builder', '#/phrase/' + id],
    context: ['Context clash', '#/context'],
    structural: ['Structural classifiers', '#/structural'],
  };
  for (const mode of lesson.modes) {
    const [label, href] = modeDefs[mode];
    modes.append(el('a', { class: 'btn primary', href }, label));
  }
  wrap.append(el('h3', {}, 'Practice'), modes);

  screen.append(wrap);
}

function renderMatch(id) {
  const pool = poolForLesson(id);
  const optionSet = optionSetForLesson(id);
  runQuiz(screen, {
    title: 'Match drill',
    gen: () => genMatch(pool, optionSet),
    backHash: '#/lesson/' + id,
  });
}

function renderReverse(id) {
  const lesson = LESSONS.find(l => l.id === id);
  const pool = poolForLesson(id);
  runQuiz(screen, {
    title: 'Reverse drill',
    gen: () => genReverse(pool, lesson.cls),
    backHash: '#/lesson/' + id,
  });
}

function renderPhrase(id) {
  renderPhraseBuilder(screen, poolForLesson(id), optionSetForLesson(id), '#/lesson/' + id);
}

function renderContext() {
  const gen = makeContextGen();
  runQuiz(screen, { title: 'Context clash', gen, backHash: '#/lesson/4' });
}

function renderCustom() {
  const wrap = el('div', { class: 'stack' });
  wrap.append(el('a', { class: 'back', href: '#/home' }, '← Home'));
  wrap.append(el('h2', {}, 'Custom drill'));

  const selected = new Set();
  const boxes = el('div', { class: 'check-grid' });
  for (const c of drillableClassifiers()) {
    const input = el('input', { type: 'checkbox', id: 'ck-' + c.id,
      onchange: (e) => e.target.checked ? selected.add(c.id) : selected.delete(c.id) });
    boxes.append(el('label', { class: 'check-pill', for: 'ck-' + c.id }, input,
      hz(c.hanzi, c.pinyin), el('span', { class: 'cl-en' }, ' ' + c.en)));
  }

  const pairRow = el('div', { class: 'mode-row' });
  const tiers = activeTiers();
  for (const p of CONFUSION_PAIRS.filter(p => tiers.includes(p.tier) &&
      CLASSIFIERS[p.a].group !== 'structural' && CLASSIFIERS[p.b].group !== 'structural')) {
    pairRow.append(el('button', { class: 'btn', onclick: () => start([p.a, p.b]) },
      hz(CLASSIFIERS[p.a].hanzi, CLASSIFIERS[p.a].pinyin), ' vs ',
      hz(CLASSIFIERS[p.b].hanzi, CLASSIFIERS[p.b].pinyin),
      el('span', { class: 'cl-en' }, ' ' + p.label)));
  }

  wrap.append(
    el('h3', {}, 'Pick classifiers'), boxes,
    el('button', { class: 'btn primary', onclick: () => {
      if (selected.size === 0) return;
      start([...selected]);
    } }, 'Start drill'),
    el('h3', {}, 'Common confusions'), pairRow);
  screen.append(wrap);

  function start(clIds) {
    const pool = activeNouns().filter(n =>
      activeBest(n).some(id => clIds.includes(id)));
    if (!pool.length) return;
    // Options come from the selection first; fill up from everything unlocked.
    const optionSet = [...new Set([...clIds, ...drillableClassifiers().map(c => c.id)])];
    screen.replaceChildren();
    runQuiz(screen, { title: 'Custom drill', gen: () => genMatch(pool, optionSet), backHash: '#/custom' });
  }
}

// ---- structural classifiers lesson ----

const STRUCTURAL_CARDS = [
  { cl: 'sui', pattern: 'person + number + 岁', example: '{他八岁|tā bā suì}', exampleEn: 'he is eight',
    note: 'Age. The number comes right before {岁|suì}, and no noun follows it.' },
  { cl: 'ci', pattern: 'verb + number + 次', example: '{我去过两次|wǒ qùguo liǎng cì}', exampleEn: 'I have been there twice',
    note: 'Counts how many times an action happens, not a thing.' },
  { cl: 'xie', pattern: '一些 + noun', example: '{一些水|yìxiē shuǐ}', exampleEn: 'some water',
    note: 'A small, unspecified amount. Works with countable and uncountable nouns.' },
  { cl: 'dianr', pattern: '一点儿 + noun', example: '{一点儿水|yìdiǎnr shuǐ}', exampleEn: 'a little water',
    note: 'A little bit, usually with things you cannot count.' },
  { cl: 'bian', pattern: 'verb + number + 遍', example: '{再说一遍|zài shuō yí biàn}', exampleEn: 'say it through once more',
    note: '{次|cì} counts how many times something happens. {遍|biàn} means the whole thing from start to finish each time.', hsk3: true },
];

const STRUCTURAL_CHECK = [
  { q: '他今年八__。', qPy: 'tā jīnnián bā __', en: 'He is eight this year.',
    options: ['sui', 'ci', 'ge', 'xie'], correct: 'sui',
    why: 'Age is number + {岁|suì}, nothing after it.' },
  { q: '我去过北京三__。', qPy: 'wǒ qùguo Běijīng sān __', en: 'I have been to Beijing three times.',
    options: ['ci', 'sui', 'xie', 'ge'], correct: 'ci',
    why: 'Times an action happens take {次|cì} after the verb.' },
  { q: '我会说一点__汉语。', qPy: 'wǒ huì shuō yìdiǎn__ Hànyǔ', en: 'I speak a little Chinese.',
    options: ['dianr', 'sui', 'ci', 'ge'], correct: 'dianr',
    why: '{一点儿|yìdiǎnr} means a little bit of something you cannot count.' },
  { q: '我买了一__苹果。', qPy: 'wǒ mǎi le yì__ píngguǒ', en: 'I bought some apples.',
    options: ['xie', 'sui', 'ci', 'shuang'], correct: 'xie',
    why: '{一些|yìxiē} is a small, unspecified amount.' },
  { q: '这个课文我读了三__,从头到尾。', qPy: 'zhège kèwén wǒ dú le sān __, cóng tóu dào wěi', en: 'I read this text three times, start to finish.',
    options: ['bian', 'ci', 'sui', 'xie'], correct: 'bian', hsk3: true,
    near: { ci: '{次|cì} counts occurrences and would be heard here too, but "start to finish" stresses the full run through, and that is {遍|biàn}.' },
    why: '{遍|biàn} means each time was the whole thing from start to finish.' },
];

function renderStructural() {
  const wrap = el('div', { class: 'stack' });
  wrap.append(el('a', { class: 'back', href: '#/lesson/3' }, '← Lesson 3'));
  wrap.append(el('h2', {}, 'Structural classifiers'));
  wrap.append(el('p', { class: 'blurb' },
    fmt('{岁|suì}, {次|cì}, {些|xiē}, and {点儿|diǎnr} do not classify nouns the way {个|gè} or {张|zhāng} do. They measure age, repetitions, and amounts, so they get their own patterns.')));

  const hsk3 = state.settings.hsk3;
  for (const cardDef of STRUCTURAL_CARDS) {
    if (cardDef.hsk3 && !hsk3) continue;
    const c = CLASSIFIERS[cardDef.cl];
    wrap.append(el('div', { class: 'card cl-card' },
      el('div', { class: 'cl-card-head' }, hz(c.hanzi, c.pinyin, 'cl-big'), el('span', { class: 'cl-en' }, c.en)),
      el('p', { class: 'pattern' }, cardDef.pattern),
      el('p', {}, fmt(cardDef.example), ', ' + cardDef.exampleEn + '.'),
      el('p', { class: 'cl-rule' }, fmt(cardDef.note))));
  }

  wrap.append(el('h3', {}, 'Quick check'));
  for (const item of STRUCTURAL_CHECK) {
    if (item.hsk3 && !hsk3) continue;
    const feedback = el('div', { class: 'quiz-feedback', 'aria-live': 'polite' });
    const optsRow = el('div', { class: 'mode-row' });
    let done = false;
    for (const optId of shuffle(item.options)) {
      const c = CLASSIFIERS[optId];
      optsRow.append(el('button', { class: 'btn opt-mini', onclick: (e) => {
        if (done) return;
        done = true;
        for (const b of optsRow.querySelectorAll('button')) b.disabled = true;
        if (optId === item.correct) {
          e.currentTarget.classList.add('correct');
          feedback.append(el('p', { class: 'verdict ok' }, '✓ Right'),
            el('div', { class: 'explain' }, el('p', {}, fmt(item.why))));
        } else if (item.near && item.near[optId]) {
          e.currentTarget.classList.add('half');
          feedback.append(el('p', { class: 'verdict half' }, 'Close'),
            el('div', { class: 'explain' }, el('p', {}, fmt(item.near[optId]))));
        } else {
          e.currentTarget.classList.add('wrong');
          optsRow.querySelectorAll('button').forEach(b => {
            if (b.dataset.cl === item.correct) b.classList.add('correct');
          });
          feedback.append(el('p', { class: 'verdict bad' }, '✕ Not this one'),
            el('div', { class: 'explain' }, el('p', {}, fmt(item.why))));
        }
      }, 'data-cl': optId }, hz(c.hanzi, c.pinyin)));
    }
    wrap.append(el('div', { class: 'card' },
      el('p', { class: 'check-q' }, hz(item.q, item.qPy)),
      el('p', { class: 'gloss' }, item.en),
      optsRow, feedback));
  }

  screen.append(wrap);
}

// ---- progress ----

function renderProgress() {
  const wrap = el('div', { class: 'stack' });
  wrap.append(el('a', { class: 'back', href: '#/home' }, '← Home'));
  wrap.append(el('h2', {}, 'Progress'));

  wrap.append(el('h3', {}, 'Mastery per classifier'));
  const grid = el('div', { class: 'heatmap' });
  const tiers = activeTiers();
  for (const c of CL_LIST.filter(c => tiers.includes(c.tier) || (c.tier === 'structural'))) {
    const m = mastery(c.id);
    grid.append(el('div', { class: 'heat-tile', title: c.en },
      el('span', { class: 'hz', lang: 'zh' }, c.hanzi),
      el('span', { class: 'py tiny' }, c.pinyin),
      el('div', { class: 'meter' }, el('div', { style: 'width:' + Math.round(m.score * 100) + '%' })),
      el('span', { class: 'tiny' }, m.attempts === 0 ? 'not yet' : m.attempts + ' answered')));
  }
  wrap.append(grid);

  wrap.append(el('h3', {}, 'Your confusions'));
  const entries = Object.entries(state.confusion).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (entries.length) {
    const list = el('ul', { class: 'confusion-list' });
    for (const [k, n] of entries) {
      const [expId, choId] = k.split('>');
      const a = CLASSIFIERS[expId], b = CLASSIFIERS[choId];
      if (!a || !b) continue;
      list.append(el('li', {}, hz(a.hanzi, a.pinyin), ' answered as ', hz(b.hanzi, b.pinyin),
        ', ' + n + (n === 1 ? ' time' : ' times')));
    }
    wrap.append(list);
  } else {
    wrap.append(el('p', { class: 'blurb' }, 'Nothing yet. Wrong answers will show up here so you can drill them.'));
  }

  wrap.append(el('h3', {}, 'Worth watching'));
  const seedList = el('ul', { class: 'confusion-list' });
  for (const p of CONFUSION_PAIRS.filter(p => tiers.includes(p.tier))) {
    const a = CLASSIFIERS[p.a], b = CLASSIFIERS[p.b];
    seedList.append(el('li', {}, hz(a.hanzi, a.pinyin), ' vs ', hz(b.hanzi, b.pinyin), ', ' + p.label));
  }
  wrap.append(seedList);

  wrap.append(el('h3', {}, 'Move your progress'));
  const importInput = el('input', { type: 'file', accept: 'application/json', hidden: true,
    onchange: (e) => {
      const f = e.target.files[0];
      if (f) importJSON(f, (err) => {
        alert(err || 'Progress imported.');
        if (!err) location.reload();
      });
    } });
  wrap.append(el('p', { class: 'blurb' }, 'Progress lives in this browser only. Export it as JSON to back it up or carry it to another device.'));
  wrap.append(el('div', { class: 'mode-row' },
    el('button', { class: 'btn', onclick: exportJSON }, 'Export (JSON)'),
    el('button', { class: 'btn', onclick: () => importInput.click() }, 'Import'),
    importInput));

  screen.append(wrap);
}

// ---- settings ----

function toggleRow(title, sub, key) {
  const input = el('input', { type: 'checkbox', onchange: (e) => {
    state.settings[key] = e.target.checked;
    save();
    applySettings();
  } });
  input.checked = state.settings[key];
  return el('label', { class: 'set-row' },
    el('span', {},
      el('p', { class: 'set-title' }, title),
      el('p', { class: 'set-sub' }, fmt(sub))),
    input);
}

function renderSettings() {
  const wrap = el('div', {});
  wrap.append(el('h2', {}, 'Settings'));

  const hsk3Cls = ['ba', 'tai', 'chang', 'bu', 'zhong', 'ceng', 'duan', 'zuo', 'pian', 'pi']
    .map(id => '{' + CLASSIFIERS[id].hanzi + '|' + CLASSIFIERS[id].pinyin + '}').join(', ');

  wrap.append(
    toggleRow('Show pinyin', 'tone marked pinyin after every hanzi', 'pinyin'),
    toggleRow('English glosses', 'english hints under the nouns in drills', 'english'),
    toggleRow('Extended HSK3 tier', hsk3Cls + ', plus {遍|biàn} in the structural lesson', 'hsk3'),
    toggleRow('"Did you know?"', 'one curated fact on the home screen, sourced only', 'facts'),
    toggleRow('Tone change of 一', 'show yí gè vs yì běn in the phrase builder', 'toneChange'),
  );

  const themeSel = el('select', { onchange: (e) => { state.settings.theme = e.target.value; save(); applySettings(); } },
    ...['auto', 'light', 'dark'].map(t => {
      const o = el('option', { value: t }, t);
      if (state.settings.theme === t) o.setAttribute('selected', '');
      return o;
    }));
  wrap.append(el('label', { class: 'set-row' },
    el('span', {},
      el('p', { class: 'set-title' }, 'Theme'),
      el('p', { class: 'set-sub' }, 'auto follows your system')),
    themeSel));

  wrap.append(el('p', { class: 'storage-note' },
    'All progress is saved in this browser instantly after every answer (localStorage). It stays until you press Reset, import another file, or clear this site\'s browser data; private windows drop it when they close. Progress is per browser and per device, so use Export and Import on the Progress screen to move it.'));

  wrap.append(el('button', { class: 'btn', onclick: () => {
    if (confirm('Wipe all progress and settings on this device?')) resetAll();
  } }, 'Reset everything'));

  screen.append(wrap);
}

// ---- router ----

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const name = parts[0] || 'home';
  const arg = parseInt(parts[1], 10);
  screen.replaceChildren();
  applySettings();
  switch (name) {
    case 'lesson': renderLesson(arg); break;
    case 'match': renderMatch(arg); break;
    case 'reverse': renderReverse(arg); break;
    case 'phrase': renderPhrase(arg); break;
    case 'context': renderContext(); break;
    case 'custom': renderCustom(); break;
    case 'structural': renderStructural(); break;
    case 'progress': renderProgress(); break;
    case 'settings': renderSettings(); break;
    default: renderHome();
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
