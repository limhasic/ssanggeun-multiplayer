import { judgeTwoLetterWord } from '../src/jamo-judge.js';

test('정확 일치는 🥕🥕', () => {
  expect(judgeTwoLetterWord('사과', '사과')).toEqual(['🥕', '🥕']);
});

test('틀린 경우 기본적으로 🍎 또는 혼합', () => {
  const r = judgeTwoLetterWord('사과', '호랑');
  expect(r.length).toBe(2);
});


