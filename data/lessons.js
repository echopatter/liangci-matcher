// Lesson plan. Soft unlock: a lesson is suggested once the previous one is
// practiced, but never hard blocked ("practice anyway" is always offered).

export const LESSONS = [
  {
    id: 1,
    title: 'Lesson 1. The big five',
    blurb: 'The five classifiers you will meet first. The all purpose 个, plus books, flat things, animals, and long things.',
    cls: ['ge', 'ben', 'zhang', 'zhi', 'tiao'],
    modes: ['match', 'reverse', 'phrase'],
  },
  {
    id: 2,
    title: 'Lesson 2. Things you wear, drink, and ride',
    blurb: 'Clothes and matters, drinks by the cup or bottle, pieces and money, and vehicles.',
    cls: ['jian', 'bei', 'ping', 'kuai', 'liang'],
    modes: ['match', 'reverse', 'phrase'],
  },
  {
    id: 3,
    title: 'Lesson 3. People, pairs, places',
    blurb: 'Pairs, establishments, polite 位, household 口, plus the four structural classifiers that play by their own rules.',
    cls: ['shuang', 'jia', 'wei', 'kou'],
    modes: ['match', 'reverse', 'phrase', 'structural'],
  },
  {
    id: 4,
    title: 'Lesson 4. When context decides',
    blurb: 'The same noun can take different classifiers depending on the situation. Cup or bottle, one shoe or the pair. Also introduces 把 for chairs (an HSK3 tier word worth knowing early).',
    cls: ['ba'],
    modes: ['context', 'match'],
    stretch: true,
  },
  {
    id: 5,
    title: 'Lesson 5. The HSK3 pack',
    blurb: 'Ten more classifiers for machines, events, kinds, buildings, and one horse word you just have to memorize.',
    cls: ['ba', 'tai', 'chang', 'bu', 'zhong', 'ceng', 'duan', 'zuo', 'pian', 'pi'],
    modes: ['match', 'reverse', 'phrase', 'structural'],
    hsk3: true,
  },
];
