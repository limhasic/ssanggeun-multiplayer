// 한글 자모 분해 및 두 글자 판정 로직(MVP)

const CHO = [
  'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'
];
const JUNG = [
  'ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'
];
const JONG = [
  '', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'
];

const COMPLEX_JONG = {
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅄ': ['ㅂ', 'ㅅ']
};

const COMPLEX_JUNG = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ']
};

function decomposeChar(ch) {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return { cho: ch, jung: '', jong: '' };
  const s = code - 0xac00;
  const cho = CHO[Math.floor(s / (21 * 28))];
  const jung = JUNG[Math.floor((s % (21 * 28)) / 28)];
  const jong = JONG[s % 28];
  return { cho, jung, jong };
}

function explodeJamo({ cho, jung, jong }) {
  const parts = [];
  parts.push(cho);
  if (COMPLEX_JUNG[jung]) parts.push(...COMPLEX_JUNG[jung]); else if (jung) parts.push(jung);
  if (COMPLEX_JONG[jong]) parts.push(...COMPLEX_JONG[jong]); else if (jong) parts.push(jong);
  return parts;
}

function judgeChar(secretCh, guessCh) {
  if (!secretCh || !guessCh) return '🍎';
  if (secretCh === guessCh) return '🥕';

  const s = decomposeChar(secretCh);
  const g = decomposeChar(guessCh);

  const choMatch = s.cho === g.cho;
  const jungMatch = s.jung === g.jung || (COMPLEX_JUNG[s.jung]?.some((j) => COMPLEX_JUNG[g.jung]?.includes(j) || j === g.jung));
  const jongSet = new Set(COMPLEX_JONG[s.jong] || (s.jong ? [s.jong] : []));
  const gJongSet = new Set(COMPLEX_JONG[g.jong] || (g.jong ? [g.jong] : []));
  const jongAny = [...gJongSet].some((j) => jongSet.has(j));

  if (choMatch && (jungMatch || jongAny)) return '🍄';

  const sAll = new Set(explodeJamo(s));
  const gAll = explodeJamo(g);
  const interCount = gAll.filter((j) => sAll.has(j)).length;

  if (!choMatch && interCount >= 2) return '🧄';
  if (interCount === 1) return '🍆';
  if (interCount === 0) return '🍎';
  return '🍌';
}

export function judgeTwoLetterWord(secret, guess) {
  const s = (secret || '').slice(0, 2);
  const g = (guess || '').slice(0, 2);
  const a = judgeChar(s[0], g[0]);
  const b = judgeChar(s[1], g[1]);
  return [a, b];
}

export function decompose(word) {
  return [...(word || '')].map(decomposeChar);
}


