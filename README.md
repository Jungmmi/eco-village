# 🌱 에코 빌리지: 쪼꼬미의 그린시티 프로젝트

중학교 기술·가정 **[신재생 에너지와 친환경 자동차]** 단원 학습 게임입니다.
백엔드 서버 없이 **GitHub Pages(정적 호스팅) + Firebase Firestore(랭킹 DB)** 만으로 동작합니다.

---

## 1. 폴더 구조

```
eco-village/
├── index.html          ← 화면 뼈대 (맵, HUD, 퀴즈/진화/보상/랭킹 팝업)
├── css/
│   └── style.css       ← 파스텔 + 글래스모피즘 + 네온 글로우 + 모든 애니메이션
├── js/
│   ├── config.js       ← ⚙️ 선생님이 고치는 곳 (Firebase 키, 쿠폰 문구, 이미지 경로, 오답 페널티)
│   ├── questions.js    ← 📝 문항 24개 (단계별 8문항, 힌트·해설 포함)
│   ├── characters.js   ← 🐣 쪼꼬미 진화 4단계 기본 그림(SVG)
│   ├── game.js         ← 🎮 맵 이동, 퀴즈, 진화, 최종 보상, 랭킹 로직
│   ├── effects.js      ← ✨ 파티클, 색종이, 폭죽 (Canvas)
│   ├── audio.js        ← 🔊 효과음 (Web Audio로 합성, 음원 파일 불필요)
│   └── db.js           ← 🏆 Firestore 저장/불러오기 (설정 전에는 데모 모드)
├── assets/
│   ├── images/         ← 나중에 교체할 캐릭터·맵·인증서 그림
│   └── sounds/         ← (선택) 직접 녹음한 효과음
└── README.md
```

## 2. 게임 흐름

| 단계 | 동네 | 난이도 | 주제 | 클리어 시 진화 |
|---|---|---|---|---|
| 시작 | – | – | – | 꼬질꼬질 먼지 뭉치 |
| 1 | 뚜벅이 골목길 | Easy | 기초 신재생 에너지 (정의, 중요성, 특징, 분류) | 새싹 찹쌀떡 요정 |
| 2 | 에코 에너지 밸리 | Normal | 발전 원리 (연료 전지, 수소, 석탄 가스화, 태양열, 수력, 지열, 파력) | 태양광 모자 + 전기 스쿠터 꼬마 정령 |
| 3 | 퓨처 모빌리티 시티 | Hard | 친환경 자동차 (하이브리드, 전기차, 수소차, 축전지, 대기 전력) | 꼬마 수소차 (초화려 진화 + 팡파르) |
| 중앙 | 명예의 전당 | – | 전교 / 반별 랭킹 | – |

- **조작**: 방향키 / WASD / 화면 클릭(터치)으로 이동 → 건물 앞에서 `SPACE`(또는 건물 클릭)
- **퀴즈**: 숫자키 `1~4`로도 답 선택, 정답 해설에서 `Enter`로 다음 문제
- **오답**: 게임 오버 없음. 화면 흔들림 + 귀여운 효과음 + 캐릭터 말풍선 힌트
- **기록**: 소요 시간 + 오답 1개당 10초(`config.js`에서 변경, 0이면 끔). 진화 연출 시간은 기록에서 제외
- **랭킹**: 같은 학번이름은 최고 기록 1개만 표시. 이름 가운데 글자 가림(`MASK_NAME`)

---

## 3. 내 컴퓨터에서 먼저 실행해 보기

`index.html`을 더블클릭하면 **동작하지 않습니다.** (JS 모듈은 보안상 웹 서버에서만 열려요)

- VS Code → 확장 프로그램 **Live Server** 설치 → `index.html` 우클릭 → *Open with Live Server*
- 또는 폴더에서 터미널을 열고 `python -m http.server 8000` → 브라우저에서 `http://localhost:8000`

Firebase 설정 전에는 **🧪 데모 모드**로 돌아가며, 랭킹은 그 브라우저에만 저장됩니다.

---

## 4. Firebase 설정 (랭킹 DB) — 약 10분

### ① 프로젝트 만들기
1. https://console.firebase.google.com 접속 → **프로젝트 추가**
2. 이름 예: `eco-village` → Google 애널리틱스는 **사용 안 함** → 만들기

### ② 웹 앱 등록하고 설정값 복사
1. 프로젝트 개요 화면의 **`</>`(웹)** 아이콘 클릭
2. 앱 닉네임 `eco-village-web` → *Firebase 호스팅 설정*은 체크하지 않음 → 앱 등록
3. 화면에 나오는 `const firebaseConfig = { ... }` 안의 값 6개를 복사
4. `js/config.js` 의 `FIREBASE_CONFIG` 에 붙여 넣기

```js
export const FIREBASE_CONFIG = {
  apiKey: "AIza....",
  authDomain: "eco-village-xxxx.firebaseapp.com",
  projectId: "eco-village-xxxx",
  storageBucket: "eco-village-xxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcd..."
};
```
> apiKey는 공개되어도 괜찮은 '주소' 역할입니다. 실제 보호는 아래 **보안 규칙**이 담당해요.

### ③ Firestore 데이터베이스 만들기
1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**
2. 위치: **asia-northeast3 (서울)** 선택
3. **프로덕션 모드**로 시작 → 사용 설정

### ④ 보안 규칙 붙여 넣기 (중요!)
Firestore → **규칙** 탭 → 아래 내용으로 바꾸고 **게시**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ecoVillageRanking/{docId} {
      // 누구나 랭킹 보기 가능
      allow read: if true;

      // 새 기록 추가만 가능 (형식 검사)
      allow create: if
        request.resource.data.keys().hasOnly(['nickname','grade','classNo','studentNo','name','classKey','timeMs','rawTimeMs','wrongCount','createdAt'])
        && request.resource.data.nickname is string
        && request.resource.data.nickname.size() <= 12
        && request.resource.data.grade is int && request.resource.data.grade >= 1 && request.resource.data.grade <= 3
        && request.resource.data.classNo is int
        && request.resource.data.timeMs is number
        && request.resource.data.timeMs > 30000          // 30초 미만 기록은 거부
        && request.resource.data.timeMs < 7200000        // 2시간 이상 기록은 거부
        && request.resource.data.wrongCount is int
        && request.resource.data.createdAt == request.time;

      // 학생은 수정·삭제 불가 (선생님은 콘솔에서 직접 삭제)
      allow update, delete: if false;
    }
  }
}
```
> `config.js`의 `COLLECTION` 이름을 바꿨다면 규칙의 `ecoVillageRanking`도 똑같이 바꿔 주세요.

### ⑤ 확인
게임을 한 번 끝까지 클리어 → Firestore **데이터** 탭에 `ecoVillageRanking` 컬렉션과 문서가 생기면 성공!

### DB 구조

```
ecoVillageRanking (컬렉션)
 └─ 자동ID (문서)
     ├─ nickname   : "31201홍길동"   (string)  학번5자리+이름
     ├─ grade      : 3               (number)  학년
     ├─ classNo    : 12              (number)  반
     ├─ studentNo  : 1               (number)  번호
     ├─ name       : "홍길동"         (string)
     ├─ classKey   : "3-12"          (string)  반별 랭킹 필터용
     ├─ timeMs     : 245300          (number)  최종 기록(ms) = 소요시간 + 오답 페널티 → 랭킹 기준
     ├─ rawTimeMs  : 185300          (number)  순수 소요 시간(ms)
     ├─ wrongCount : 6               (number)  오답 수
     └─ createdAt  : Timestamp       (서버 시간)
```

- 랭킹은 `timeMs` 오름차순 상위 500개를 불러온 뒤 **반별 필터는 화면에서** 처리 → 별도 색인(Index) 설정이 필요 없어요.
- 새 학기에 랭킹을 초기화하려면: 콘솔에서 컬렉션 삭제, 또는 `config.js`의 `COLLECTION`을 `ecoVillage_2027_1`처럼 바꾸고 규칙도 맞춰 수정.
- 무료 요금제(Spark)로 한 학교 사용량은 충분합니다. (하루 읽기 5만 회 / 쓰기 2만 회)

> ⚠️ 보안 규칙상 랭킹은 누구나 읽을 수 있어서, 게임 화면에서 이름을 가려도 DB에는 실명이 저장됩니다.
> 실명이 부담스러우면 학생들에게 `31201홍길동` 대신 `31201길동`처럼 이름 일부만 쓰게 안내해 주세요.

---

## 5. GitHub Pages에 올리기

1. GitHub에서 **New repository** → 이름 예: `eco-village` → **Public** → Create
2. **Add file → Upload files** → `eco-village` 폴더 **안의** 파일과 폴더를 모두 끌어다 놓기 → Commit
   (저장소 첫 화면에 `index.html`이 바로 보여야 해요)
3. 저장소 **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `/(root)` → Save
4. 1~2분 뒤 `https://내아이디.github.io/eco-village/` 주소로 접속! (학생들에게는 이 주소나 QR코드를 공유)

---

## 6. 이미지 교체하기 🖼️

`assets/images/`에 그림을 넣고 `js/config.js`의 `IMAGES`에 경로만 적으면 끝!

| 키 | 위치 | 권장 크기 |
|---|---|---|
| `char0`~`char3` | 캐릭터 진화 4단계 (플레이어, HUD, 힌트, 진화 화면에 모두 적용) | 512×512 투명 PNG |
| `zone1` / `zone2` / `zone3` | 동네 바닥 배경 | 700×1300 / 1300×600 / 1300×600 |
| `gate1`~`gate3` | 단계 입구 건물 | 300×260 투명 PNG |
| `hall` | 명예의 전당 건물 | 420×340 투명 PNG |
| `certificate` / `coupon` | 인증서·쿠폰 배경 | 가로형 1400×800 |

HTML에서 찾을 때는 이 클래스명을 보세요:
`.zone-1 .zone-2 .zone-3`, `.gate-img`, `.hall-img`, `.player-sprite`, `.char-img .char-stage-0~3`, `.certificate`, `.coupon`

장식물(나무, 풍력 발전기, 태양광 패널, 충전소 등)은 `game.js`의 `buildDecor()`에서 종류와 개수를 바꿀 수 있어요.

## 7. 문항 고치기 📝

`js/questions.js`에서 수정합니다. **`options`의 첫 번째가 정답**이고, 화면에서는 자동으로 섞여요.

```js
{
  visual: "☀️🔥 → 🛁",                 // 문제 위에 크게 뜨는 그림
  q: "문제 내용",
  options: ["정답", "오답1", "오답2", "오답3"],
  hint: "틀렸을 때 말풍선 힌트",
  explain: "맞혔을 때 한 줄 해설"
}
```

## 8. 효과음 바꾸기 (선택)

기본 효과음은 코드로 합성해서 파일이 필요 없어요. 직접 만든 mp3를 쓰려면
`assets/sounds/`에 넣고 `js/audio.js` 맨 위 `SOUND_FILES`에 경로를 적으세요.
