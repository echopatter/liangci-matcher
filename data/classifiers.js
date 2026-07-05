// Classifier inventory with the semantic logic the "Why?" engine uses.
// Pairing logic transcribed from the project's verified seed table,
// cross-checked against CC-CEDICT CL fields (machine check only) and
// classifier senses in 《现代汉语词典》 (商务印书馆, 7th ed.).
// `hsk` band tags may only come from GF 0025-2021 (《国际中文教育中文水平等级标准》).
// No row below has been verified against that wordlist yet, so every `hsk` is null.
// `tier` drives gameplay gating instead: 'core' (HSK1-2 seed), 'structural', 'hsk3'.
// `frag` is a lowercase sentence fragment the explanation engine drops into
// "X is for {frag}." Keep it plain, no dashes, under one clause where possible.

export const CLASSIFIERS = {
  ge: {
    id: 'ge', hanzi: '个', pinyin: 'gè', en: 'general',
    frag: 'almost anything, people and most objects. It is always understood, but a specific classifier usually scores better',
    group: 'general', tier: 'core', lesson: 1, hsk: null,
    confusions: ['wei'],
  },
  wei: {
    id: 'wei', hanzi: '位', pinyin: 'wèi', en: 'people (polite)',
    frag: 'people you want to show respect to, like teachers, doctors, and guests',
    group: 'people', tier: 'core', lesson: 3, hsk: null,
    confusions: ['ge', 'kou'],
  },
  kou: {
    id: 'kou', hanzi: '口', pinyin: 'kǒu', en: 'household members',
    frag: 'counting the people in a household, as in {家里有四口人|jiā li yǒu sì kǒu rén}',
    group: 'people', tier: 'core', lesson: 3, hsk: null,
    confusions: ['ge', 'wei'],
  },
  ben: {
    id: 'ben', hanzi: '本', pinyin: 'běn', en: 'bound volumes',
    frag: 'bound volumes, anything with pages you flip, like books and magazines',
    group: 'volume', tier: 'core', lesson: 1, hsk: null,
    confusions: ['zhang', 'pian'],
  },
  zhang: {
    id: 'zhang', hanzi: '张', pinyin: 'zhāng', en: 'flat things',
    frag: 'flat, sheet like things, like paper, tables, beds, tickets, photos, and maps',
    group: 'flat', tier: 'core', lesson: 1, hsk: null,
    confusions: ['tiao', 'ben'],
  },
  tiao: {
    id: 'tiao', hanzi: '条', pinyin: 'tiáo', en: 'long flexible things',
    frag: 'long, thin, flexible things, like fish, pants, roads, and rivers',
    group: 'long', tier: 'core', lesson: 1, hsk: null,
    confusions: ['zhang', 'zhi', 'jian'],
  },
  zhi: {
    id: 'zhi', hanzi: '只', pinyin: 'zhī', en: 'animals; one of a pair',
    frag: 'most animals, and one item out of a natural pair, like one shoe or one hand',
    group: 'animal', tier: 'core', lesson: 1, hsk: null,
    confusions: ['tiao', 'shuang'],
  },
  jian: {
    id: 'jian', hanzi: '件', pinyin: 'jiàn', en: 'clothing (torso); matters',
    frag: 'clothing worn on the torso, like shirts, and also matters or affairs ({事情|shìqing})',
    group: 'clothing', tier: 'core', lesson: 2, hsk: null,
    confusions: ['tiao'],
  },
  bei: {
    id: 'bei', hanzi: '杯', pinyin: 'bēi', en: 'cups of drink',
    frag: 'a cup or glass of a drink. The drink is measured by its container',
    group: 'container', tier: 'core', lesson: 2, hsk: null,
    confusions: ['ping'],
  },
  ping: {
    id: 'ping', hanzi: '瓶', pinyin: 'píng', en: 'bottles',
    frag: 'a bottle of something',
    group: 'container', tier: 'core', lesson: 2, hsk: null,
    confusions: ['bei'],
  },
  kuai: {
    id: 'kuai', hanzi: '块', pinyin: 'kuài', en: 'chunks; money',
    frag: 'chunks and pieces, like a piece of bread, and also units of money',
    group: 'chunk', tier: 'core', lesson: 2, hsk: null,
    confusions: ['zhang'],
  },
  liang: {
    id: 'liang', hanzi: '辆', pinyin: 'liàng', en: 'vehicles',
    frag: 'wheeled vehicles, like cars, taxis, and bikes',
    group: 'vehicle', tier: 'core', lesson: 2, hsk: null,
    confusions: ['tai'],
  },
  shuang: {
    id: 'shuang', hanzi: '双', pinyin: 'shuāng', en: 'natural pairs',
    frag: 'natural pairs, like shoes, chopsticks, and eyes',
    group: 'pair', tier: 'core', lesson: 3, hsk: null,
    confusions: ['zhi'],
  },
  jia: {
    id: 'jia', hanzi: '家', pinyin: 'jiā', en: 'establishments',
    frag: 'establishments, like shops, restaurants, hospitals, and companies',
    group: 'place', tier: 'core', lesson: 3, hsk: null,
    confusions: ['zuo'],
  },

  // Structural classifiers. These do not classify nouns the normal way,
  // so they live in the structural lesson, not the match drill.
  sui: {
    id: 'sui', hanzi: '岁', pinyin: 'suì', en: 'years of age',
    frag: 'years of age. It follows the number directly, with no noun after it',
    group: 'structural', tier: 'structural', lesson: 3, hsk: null,
    confusions: [],
  },
  ci: {
    id: 'ci', hanzi: '次', pinyin: 'cì', en: 'times (occurrences)',
    frag: 'how many times an action happens, as in {我去过两次|wǒ qùguo liǎng cì}',
    group: 'structural', tier: 'structural', lesson: 3, hsk: null,
    confusions: ['bian'],
  },
  xie: {
    id: 'xie', hanzi: '些', pinyin: 'xiē', en: 'a small amount',
    frag: 'a small, unspecified amount, {一些|yìxiē} plus a noun',
    group: 'structural', tier: 'structural', lesson: 3, hsk: null,
    confusions: ['dianr'],
  },
  dianr: {
    id: 'dianr', hanzi: '点儿', pinyin: 'diǎnr', en: 'a little',
    frag: 'a little bit of something, {一点儿|yìdiǎnr} plus a noun, usually something you cannot count',
    group: 'structural', tier: 'structural', lesson: 3, hsk: null,
    confusions: ['xie'],
  },

  // HSK3 extended tier. Behind the extended tier toggle, off by default.
  ba: {
    id: 'ba', hanzi: '把', pinyin: 'bǎ', en: 'things with handles',
    frag: 'things you grip by a handle, like chairs, umbrellas, and knives',
    group: 'handle', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['zhang'],
  },
  tai: {
    id: 'tai', hanzi: '台', pinyin: 'tái', en: 'machines',
    frag: 'machines and appliances, like computers, TVs, and washing machines',
    group: 'machine', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['liang', 'bu'],
  },
  chang: {
    id: 'chang', hanzi: '场', pinyin: 'chǎng', en: 'events',
    frag: 'events that run their course, like rain, matches, film showings, and exams',
    group: 'event', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['bu', 'ci'],
  },
  bu: {
    id: 'bu', hanzi: '部', pinyin: 'bù', en: 'films, phones, works',
    frag: 'films, phones, and complete works',
    group: 'event', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['chang', 'tai'],
  },
  zhong: {
    id: 'zhong', hanzi: '种', pinyin: 'zhǒng', en: 'kinds, types',
    frag: 'kinds and types of things, not the things themselves',
    group: 'kind', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['ge'],
  },
  ceng: {
    id: 'ceng', hanzi: '层', pinyin: 'céng', en: 'floors, layers',
    frag: 'floors and layers, like the floors of a building',
    group: 'layer', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['zuo'],
  },
  duan: {
    id: 'duan', hanzi: '段', pinyin: 'duàn', en: 'stretches, sections',
    frag: 'a stretch or section of something, like time, a road, or speech',
    group: 'section', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['tiao'],
  },
  zuo: {
    id: 'zuo', hanzi: '座', pinyin: 'zuò', en: 'large immovable things',
    frag: 'large things that sit in place, like mountains, bridges, cities, and buildings',
    group: 'big', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['ceng', 'jia'],
  },
  pian: {
    id: 'pian', hanzi: '篇', pinyin: 'piān', en: 'articles, essays',
    frag: 'articles and essays',
    group: 'text', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['ben', 'zhang'],
  },
  pi: {
    id: 'pi', hanzi: '匹', pinyin: 'pǐ', en: 'horses',
    frag: 'horses. This pairing is memorized, not derived from shape',
    group: 'horse', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['zhi'],
  },
  bian: {
    id: 'bian', hanzi: '遍', pinyin: 'biàn', en: 'times (start to finish)',
    frag: 'doing something from start to finish one full time, as in {再说一遍|zài shuō yí biàn}',
    group: 'structural', tier: 'hsk3', lesson: 5, hsk: null,
    confusions: ['ci'],
  },
};

export const CL_LIST = Object.values(CLASSIFIERS);

// Seeded confusion pairs for the custom drill and the progress screen.
export const CONFUSION_PAIRS = [
  { a: 'zhang', b: 'tiao', label: 'flat vs long', tier: 'core' },
  { a: 'zhi', b: 'tiao', label: 'animals', tier: 'core' },
  { a: 'jian', b: 'tiao', label: 'shirt vs pants', tier: 'core' },
  { a: 'bei', b: 'ping', label: 'cup vs bottle', tier: 'core' },
  { a: 'ge', b: 'wei', label: 'casual vs polite', tier: 'core' },
  { a: 'zuo', b: 'ceng', label: 'building vs floor', tier: 'hsk3' },
  { a: 'bu', b: 'chang', label: 'the film vs the showing', tier: 'hsk3' },
  { a: 'duan', b: 'tiao', label: 'a stretch vs the whole road', tier: 'hsk3' },
  { a: 'ci', b: 'bian', label: 'times vs full run throughs', tier: 'hsk3' },
];
