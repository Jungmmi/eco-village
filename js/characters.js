/* =========================================================
   🐣 쪼꼬미 캐릭터 (진화 4단계)
   config.js 의 IMAGES.char0~char3 에 그림 경로를 넣으면
   아래 기본 SVG 그림 대신 <img class="char-img char-stage-N"> 로 바뀝니다.
   ========================================================= */
import { IMAGES } from './config.js';

export const CHARACTERS = [
  { name: "꼬질꼬질 먼지 뭉치", desc: "아직은 꼬질꼬질… 깨끗한 에너지가 필요해!" },
  { name: "새싹 찹쌀떡 요정", desc: "머리에 새싹이 쏙! 뽀송뽀송해졌어요." },
  { name: "태양광 꼬마 정령", desc: "태양광 패널 모자를 쓰고 전기 스쿠터로 슝~" },
  { name: "꼬마 수소차 쪼꼬미", desc: "물만 내뿜는 꼬마 수소차를 탄 그린 마이스터!" }
];

/* 같은 화면에 그림이 여러 개 있어도 꼬이지 않게 고유 id 사용 */
let uidSeq = 0;

export function charMarkup(stage) {
  const img = IMAGES["char" + stage];
  if (img) {
    return `<img class="char-img char-stage-${stage}" src="${img}" alt="${CHARACTERS[stage].name}" draggable="false">`;
  }
  const u = "c" + stage + "_" + (uidSeq++);
  return `<div class="char-art char-stage-${stage}">${SVGS[stage](u)}</div>`;
}

const eyes = (lx, rx, y) => `
  <ellipse cx="${lx}" cy="${y}" rx="4.2" ry="5.4" fill="#2b2338"/>
  <ellipse cx="${rx}" cy="${y}" rx="4.2" ry="5.4" fill="#2b2338"/>
  <circle cx="${lx + 1.4}" cy="${y - 2}" r="1.7" fill="#fff"/>
  <circle cx="${rx + 1.4}" cy="${y - 2}" r="1.7" fill="#fff"/>`;

const blush = (lx, rx, y) => `
  <ellipse cx="${lx}" cy="${y}" rx="6.5" ry="3.6" fill="#ffadc6" opacity=".85"/>
  <ellipse cx="${rx}" cy="${y}" rx="6.5" ry="3.6" fill="#ffadc6" opacity=".85"/>`;

const mochiBody = (u) => `
  <path d="M60 38 C88 38 102 62 102 82 C102 100 84 106 60 106 C36 106 18 100 18 82 C18 62 32 38 60 38 Z"
        fill="url(#${u}m)" stroke="#f1cfdc" stroke-width="2"/>
  <ellipse cx="44" cy="54" rx="10" ry="5" fill="#fff" opacity=".9" transform="rotate(-25 44 54)"/>`;

const mochiDefs = (u) => `
  <radialGradient id="${u}m" cx="45%" cy="35%" r="75%">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#fff4f8"/><stop offset="1" stop-color="#fbdde8"/>
  </radialGradient>`;

const sparkle = (x, y, s, c) =>
  `<path class="twinkle" d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="${c}"/>`;

const SVGS = [
  /* 0. 꼬질꼬질 먼지 뭉치 */
  (u) => `<svg class="char-svg" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <radialGradient id="${u}g" cx="40%" cy="35%" r="70%">
        <stop offset="0" stop-color="#d4cfdc"/><stop offset=".6" stop-color="#a39cb1"/><stop offset="1" stop-color="#77708a"/>
      </radialGradient>
      <filter id="${u}f" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4"/>
        <feDisplacementMap in="SourceGraphic" scale="10" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <g filter="url(#${u}f)">
      <circle cx="60" cy="72" r="36" fill="url(#${u}g)"/>
      <circle cx="36" cy="54" r="13" fill="#aaa3b7"/><circle cx="84" cy="52" r="14" fill="#aaa3b7"/>
      <circle cx="60" cy="40" r="12" fill="#b3adbf"/>
    </g>
    <ellipse cx="40" cy="90" rx="7" ry="4" fill="#5d5670" opacity=".35"/>
    <ellipse cx="82" cy="86" rx="5" ry="3" fill="#5d5670" opacity=".3"/>
    <ellipse cx="66" cy="54" rx="4" ry="2.4" fill="#5d5670" opacity=".3"/>
    ${eyes(48, 72, 72)}
    <path d="M53 84 q3.5 3 7 0 q3.5 3 7 0" stroke="#2b2338" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M94 36 q6 9 0 12.5 q-6 -3.5 0 -12.5z" fill="#a9ddff" stroke="#fff" stroke-width="1"/>
    <g class="specks" fill="#8d869e">
      <circle cx="16" cy="44" r="2.6"/><circle cx="104" cy="70" r="2.2"/><circle cx="22" cy="96" r="1.8"/><circle cx="98" cy="100" r="2.6"/>
    </g>
  </svg>`,

  /* 1. 새싹 찹쌀떡 요정 */
  (u) => `<svg class="char-svg" viewBox="0 0 120 120" aria-hidden="true">
    <defs>${mochiDefs(u)}</defs>
    <g class="wing wing-l"><ellipse cx="20" cy="62" rx="11" ry="18" transform="rotate(-28 20 62)" fill="#d4f0ff" stroke="#fff" stroke-width="1.5" opacity=".9"/></g>
    <g class="wing wing-r"><ellipse cx="100" cy="62" rx="11" ry="18" transform="rotate(28 100 62)" fill="#d4f0ff" stroke="#fff" stroke-width="1.5" opacity=".9"/></g>
    ${mochiBody(u)}
    <g class="sprout">
      <path d="M60 39 Q57 28 60 18" stroke="#5fc879" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M59 22 C47 10 35 16 37 23 C43 30 54 29 59 22Z" fill="#8fe6a0" stroke="#5fc879" stroke-width="1.4"/>
      <path d="M61 20 C72 6 87 12 85 20 C79 28 67 27 61 20Z" fill="#a8f0b4" stroke="#5fc879" stroke-width="1.4"/>
    </g>
    ${eyes(47, 73, 74)}
    ${blush(36, 84, 85)}
    <path d="M55 84 q5 5 10 0" stroke="#2b2338" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${sparkle(14, 30, 6, "#fff38f")}${sparkle(106, 34, 5, "#ffb6e6")}${sparkle(104, 104, 4, "#9ff5ff")}
  </svg>`,

  /* 2. 태양광 패널 모자 + 전기 스쿠터 꼬마 정령 */
  (u) => `<svg class="char-svg" viewBox="0 0 120 120" aria-hidden="true">
    <defs>${mochiDefs(u)}
      <linearGradient id="${u}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6aa2ff"/><stop offset="1" stop-color="#3656c9"/></linearGradient>
      <linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff9ad5"/><stop offset="1" stop-color="#b79bff"/></linearGradient>
    </defs>
    <g class="scooter">
      <path d="M88 99 L98 60" stroke="#7d6cf2" stroke-width="5" stroke-linecap="round"/>
      <path d="M91 60 L107 57" stroke="#5a4bd0" stroke-width="5" stroke-linecap="round"/>
      <rect x="16" y="94" width="78" height="9" rx="4.5" fill="url(#${u}s)" stroke="#fff" stroke-width="1.4"/>
      <path d="M52 95 l-5 5 h4 l-3 5 l8 -7 h-4 l3 -3z" fill="#fff36b"/>
      <g class="wheel"><circle cx="28" cy="107" r="9" fill="#4b4160"/><circle cx="28" cy="107" r="3.6" fill="#ffe36e"/></g>
      <g class="wheel"><circle cx="92" cy="107" r="9" fill="#4b4160"/><circle cx="92" cy="107" r="3.6" fill="#ffe36e"/></g>
    </g>
    <g transform="translate(6 8) scale(.83)">${mochiBody(u)}
      ${eyes(47, 73, 74)}${blush(36, 84, 85)}
      <path d="M54 83 q6 6 12 0" stroke="#2b2338" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </g>
    <g class="solar-hat" transform="rotate(-9 56 30)">
      <rect x="53" y="33" width="6" height="7" rx="1.5" fill="#9aa3c0"/>
      <rect x="28" y="18" width="56" height="16" rx="3" fill="url(#${u}p)" stroke="#2c48a8" stroke-width="1.6"/>
      <path d="M42 18 V34 M56 18 V34 M70 18 V34 M28 26 H84" stroke="#a9c8ff" stroke-width="1.1"/>
      <path class="panel-shine" d="M32 20 L40 20 L34 32 L28 32Z" fill="#fff" opacity=".55"/>
    </g>
    ${sparkle(14, 26, 6, "#fff38f")}${sparkle(108, 26, 5, "#9ff5ff")}
  </svg>`,

  /* 3. 꼬마 수소차 */
  (u) => `<svg class="char-svg" viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6f7e4"/><stop offset="1" stop-color="#58d1c1"/></linearGradient>
      <linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1fbff"/><stop offset="1" stop-color="#bfe7ff"/></linearGradient>
      ${mochiDefs(u)}
    </defs>
    <g class="drops" fill="#8fd8ff" stroke="#fff" stroke-width=".8">
      <path d="M8 86 q4 6 0 9 q-4 -3 0 -9z"/><path d="M2 74 q3 5 0 7 q-3 -2 0 -7z"/><path d="M12 70 q2.5 4 0 6 q-2.5 -2 0 -6z"/>
    </g>
    <g class="sprout">
      <path d="M70 38 Q68 30 70 22" stroke="#5fc879" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M69 25 C60 16 50 20 52 26 C56 31 65 30 69 25Z" fill="#8fe6a0" stroke="#5fc879" stroke-width="1.2"/>
      <path d="M71 24 C79 14 90 18 89 24 C84 30 75 29 71 24Z" fill="#a8f0b4" stroke="#5fc879" stroke-width="1.2"/>
    </g>
    <path d="M14 90 C14 74 26 66 40 64 L46 50 C50 41 59 37 70 37 C84 37 94 45 98 58 C106 62 111 72 111 84 C111 96 105 100 97 100 L24 100 C18 100 14 97 14 90 Z"
          fill="url(#${u}b)" stroke="#3fb8a7" stroke-width="2"/>
    <path d="M18 84 C40 80 80 80 110 82" stroke="#ffa3d4" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M48 63 C51 50 59 45 70 45 C82 45 90 52 93 63 Z" fill="url(#${u}w)" stroke="#fff" stroke-width="2"/>
    <ellipse cx="70" cy="64" rx="15" ry="11" fill="url(#${u}m)"/>
    <ellipse cx="64" cy="59" rx="2.4" ry="3" fill="#2b2338"/><ellipse cx="76" cy="59" rx="2.4" ry="3" fill="#2b2338"/>
    <circle cx="64.8" cy="58" r=".9" fill="#fff"/><circle cx="76.8" cy="58" r=".9" fill="#fff"/>
    <ellipse cx="59" cy="63" rx="3.4" ry="2" fill="#ffadc6"/><ellipse cx="81" cy="63" rx="3.4" ry="2" fill="#ffadc6"/>
    <path d="M67.5 62.5 q2.5 2.5 5 0" stroke="#2b2338" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M52 50 C55 47 58 46 61 46" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".9"/>
    <circle cx="38" cy="78" r="9" fill="#fff" stroke="#3fb8a7" stroke-width="1.6"/>
    <text x="38" y="81.5" text-anchor="middle" font-size="9" font-weight="800" fill="#21a08f" font-family="sans-serif">H₂</text>
    <ellipse class="headlight" cx="106" cy="76" rx="4" ry="5" fill="#fff6a6" stroke="#fff" stroke-width="1"/>
    <g class="wheel"><circle cx="36" cy="100" r="11" fill="#4b4160"/><circle cx="36" cy="100" r="5" fill="#c9f7ef"/><circle cx="36" cy="100" r="1.8" fill="#4b4160"/></g>
    <g class="wheel"><circle cx="90" cy="100" r="11" fill="#4b4160"/><circle cx="90" cy="100" r="5" fill="#c9f7ef"/><circle cx="90" cy="100" r="1.8" fill="#4b4160"/></g>
    ${sparkle(104, 40, 6, "#fff38f")}${sparkle(20, 50, 5, "#ffb6e6")}${sparkle(112, 104, 4, "#9ff5ff")}
  </svg>`
];
