/* =========================================================
   ⚙️ 에코 빌리지 설정 파일 — 선생님이 수정하는 곳은 여기뿐!
   ========================================================= */

/* 1) Firebase 설정
   Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹) > SDK 설정 및 구성 에서
   firebaseConfig 값을 그대로 복사해 붙여 넣으세요.
   apiKey 가 'YOUR_' 로 시작하면 '데모 모드'로 동작합니다.
   (데모 모드: 랭킹이 이 기기 브라우저에만 저장됨) */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCDMrPJ7QpYbK06gdTgDkRaXpq35j1m-YM",
  authDomain: "eco-village-73cc7.firebaseapp.com",
  projectId: "eco-village-73cc7",
  storageBucket: "eco-village-73cc7.firebasestorage.app",
  messagingSenderId: "740494577928",
  appId: "1:740494577928:web:01e6be063f82c5395cdcbd"
};

/* Firestore 컬렉션 이름 (학기마다 바꾸면 랭킹이 새로 시작돼요. 예: 'ecoVillage_2027_1') */
export const COLLECTION = "ecoVillageRanking";

/* 2) 게임 옵션 */
export const GAME = {
  SCHOOL_NAME: "배곧해솔중학교",
  TEACHER_NAME: "기술·가정 선생님",
  WRONG_PENALTY_SEC: 10,   // 오답 1번마다 기록에 더해지는 시간(초). 0이면 페널티 없음
  MASK_NAME: true,          // 랭킹 화면에서 이름 가운데 글자 가리기 (31201홍*동)
  NICKNAME_RULE: /^([1-3])(\d{2})(\d{2})([가-힣]{2,5})$/, // 학번5자리 + 한글이름
  COUPON: {
    title: "선생님의 깜짝 선물 쿠폰",
    item: "🍬 달콤한 간식 1개",
    howTo: "이 화면을 선생님께 보여 주세요!",
    expire: "이번 학기 기술·가정 수업 시간까지"
  }
};

/* 3) 🖼️ 이미지 교체
   assets/images/ 폴더에 그림 파일을 넣고 경로를 적으면 기본 그림 대신 사용돼요.
   비워 두면('') 코드로 그린 기본 그림이 나옵니다.
   캐릭터는 배경이 투명한 PNG(정사각형, 512x512 권장)를 추천해요. */
export const IMAGES = {
  char0: "",   // 초기: 꼬질꼬질 먼지 뭉치        예) "assets/images/char-0-dust.png"
  char1: "",   // 1단계: 새싹 찹쌀떡 요정          예) "assets/images/char-1-mochi.png"
  char2: "",   // 2단계: 태양광 모자 꼬마 정령     예) "assets/images/char-2-spirit.png"
  char3: "",   // 3단계: 꼬마 수소차              예) "assets/images/char-3-h2car.png"

  zone1: "",   // 1단계 동네 바닥 배경 (700x1300)   예) "assets/images/map-zone-1.png"
  zone2: "",   // 2단계 동네 바닥 배경 (1300x600)
  zone3: "",   // 3단계 동네 바닥 배경 (1300x600)

  gate1: "",   // 1단계 입구 건물 그림
  gate2: "",   // 2단계 입구 건물 그림
  gate3: "",   // 3단계 입구 건물 그림
  hall: "",    // 명예의 전당 건물 그림

  certificate: "", // 인증서 배경 그림 (가로형)
  coupon: ""       // 쿠폰 배경 그림 (가로형)
};
