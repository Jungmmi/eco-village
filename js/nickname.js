/* =========================================================
   🚫 닉네임 검사: 형식(학번 5자리 + 이름) + 욕설·비속어·패드립 차단
   막고 싶은 단어가 더 있으면 BAD_WORDS 에 추가하세요.
   ========================================================= */
import { GAME } from './config.js';

const BAD_WORDS = [
  // 욕설
  "시발", "씨발", "씨바", "시바", "쉬발", "쓰발", "씌발", "시팔", "씨팔", "ㅅㅂ", "ㅆㅂ", "ㅅㅃ",
  "씹", "좆", "좃", "존나", "졸라", "ㅈㄴ", "개새", "개색", "개세끼", "새끼", "새기", "ㅅㄲ",
  "병신", "븅신", "빙신", "ㅂㅅ", "미친", "미쳤", "ㅁㅊ", "지랄", "ㅈㄹ", "염병", "썅", "쌍놈", "쌍년",
  "등신", "닥쳐", "꺼져", "호로", "후레", "찐따", "또라이", "돌아이", "멍청", "바보", "죽어", "죽여",
  // 패드립
  "느금", "니미", "니엄", "니애미", "니애비", "느그", "애미", "애비", "에미", "엠창", "엄창", "니아빠", "니엄마",
  // 성적·혐오 표현
  "섹스", "보지", "자지", "걸레", "창녀", "변태", "일베", "틀딱", "한남", "한녀", "김치녀"
];

/* 띄어쓰기, 숫자, 특수문자를 빼고 검사 → '시 1 발', '시.발' 같은 우회도 잡아요 */
const normalize = (s) => s.toLowerCase().replace(/[\s\d~!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`·ㆍ]/g, "");

export function hasBadWord(raw) {
  const n = normalize(raw);
  return BAD_WORDS.some((w) => n.includes(w));
}

/* 결과: { ok: true, info } 또는 { ok: false, bad: true/false, msg } */
export function checkNickname(raw) {
  const nick = String(raw || "").replace(/\s/g, "");
  if (!nick) return { ok: false, msg: "학번과 이름을 입력해 주세요! (예: 31201홍길동)" };
  if (hasBadWord(nick)) {
    return { ok: false, bad: true, msg: "🚨 욕설, 비속어, 남을 놀리는 말은 쓸 수 없어요! 바르고 고운 말로 내 학번과 이름을 적어 주세요." };
  }
  const m = nick.match(GAME.NICKNAME_RULE);
  if (!m) return { ok: false, msg: "학번 5자리 + 이름으로 입력해 주세요! (예: 31201홍길동)" };
  return {
    ok: true,
    info: { nickname: nick, grade: +m[1], classNo: +m[2], studentNo: +m[3], name: m[4], classKey: `${+m[1]}-${+m[2]}` }
  };
}
