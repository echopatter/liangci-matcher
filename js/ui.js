// Small DOM helpers plus the hanzi + (pinyin) rendering engine.
// Copy strings use {汉字|hànzì} tokens; fmt() turns them into markup where the
// pinyin part is a .py span, hidden globally when the pinyin setting is off.

export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return n;
}

// One hanzi + pinyin unit: 张 (zhāng)
export function hz(hanzi, pinyin, cls = '') {
  return el('span', { class: 'hzp ' + cls },
    el('span', { class: 'hz', lang: 'zh' }, hanzi),
    pinyin ? el('span', { class: 'py' }, ' (' + pinyin + ')') : null);
}

// Format copy with {汉字|hànzì} tokens into a fragment.
export function fmt(text) {
  const frag = document.createDocumentFragment();
  const re = /\{([^|{}]+)\|([^|{}]+)\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) frag.append(text.slice(last, m.index));
    frag.append(hz(m[1], m[2]));
    last = re.lastIndex;
  }
  if (last < text.length) frag.append(text.slice(last));
  return frag;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

// Tone sandhi display for 一: yí before a 4th tone syllable, yì otherwise.
const TONE4 = /[àèìòùǜ]/;
export function yiBefore(pinyin) {
  return TONE4.test(pinyin.split(/\s/)[0]) ? 'yí' : 'yì';
}

// Keyboard hint with tiny filled key squares. Hidden on touch screens by CSS.
export function kbdHint(...parts) {
  const p = el('p', { class: 'kbd-hint' });
  for (const part of parts) {
    if (part && part.key) p.append(el('span', { class: 'kbd' }, part.key));
    else p.append(part);
  }
  return p;
}
