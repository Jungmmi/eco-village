/* =========================================================
   🎮 에코 빌리지 메인 로직
   맵 이동 → 퀴즈 → 진화 → 최종 보상 → 랭킹
   ========================================================= */
import { STAGES } from './questions.js';
import { CHARACTERS, charMarkup } from './characters.js';
import { sfx, setMuted, isMuted, unlockAudio } from './audio.js';
import { fx } from './effects.js';
import { saveRecord, fetchRecords, isOnline } from './db.js';
import { GAME, IMAGES } from './config.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- 맵 좌표 (CSS 와 같은 값) ---------- */
const WORLD = { w: 2000, h: 1300 };
const LAYOUT = {
  start: { x: 350, y: 1080 },
  gates: { 1: { x: 350, y: 575 }, 2: { x: 1480, y: 420 }, 3: { x: 1480, y: 1080 } },
  hall: { x: 1000, y: 735 },
  zones: { 2: { x: 700, y: 0, w: 1300, h: 600 }, 3: { x: 700, y: 700, w: 1300, h: 600 } }
};
const SPEED = 300; // px/s
const NEAR = 105;

/* ---------- 상태 ---------- */
const state = {
  started: false, finished: false,
  cleared: 0,                     // 클리어한 단계 수 (= 캐릭터 진화 단계)
  wrongTotal: 0,
  elapsed: 0, runStart: 0, running: false,
  player: { x: LAYOUT.start.x, y: LAYOUT.start.y, face: 1 },
  keys: new Set(), target: null, pending: null,
  modal: null, quiz: {}, nearId: null, saved: false, myNick: null,
  cam: { x: 0, y: 0 }
};

/* ---------- 타이머 ---------- */
const now = () => performance.now();
const elapsedMs = () => state.elapsed + (state.running ? now() - state.runStart : 0);
function resumeTimer() { if (!state.running) { state.running = true; state.runStart = now(); } }
function pauseTimer() { if (state.running) { state.elapsed += now() - state.runStart; state.running = false; } }
function fmt(ms) {
  const t = Math.max(0, ms) / 1000, m = Math.floor(t / 60), s = t - m * 60;
  return String(m).padStart(2, "0") + ":" + s.toFixed(1).padStart(4, "0");
}

/* =========================================================
   초기화
   ========================================================= */
function applyImages() {
  [1, 2, 3].forEach((n) => {
    if (IMAGES["zone" + n]) { const z = $(".zone-" + n); z.style.backgroundImage = `url("${IMAGES["zone" + n]}")`; z.classList.add("has-img"); }
    if (IMAGES["gate" + n]) { const g = $("#gate-" + n); const im = g.querySelector(".gate-img"); im.src = IMAGES["gate" + n]; im.hidden = false; g.classList.add("has-img"); }
  });
  if (IMAGES.hall) { const im = $(".hall-img"); im.src = IMAGES.hall; im.hidden = false; $("#hall").classList.add("has-img"); }
  if (IMAGES.certificate) { const c = $("#certificate"); c.style.backgroundImage = `url("${IMAGES.certificate}")`; c.classList.add("has-img"); }
  if (IMAGES.coupon) $("#coupon").style.backgroundImage = `url("${IMAGES.coupon}")`;
}

function placeBuildings() {
  [1, 2, 3].forEach((n) => {
    const g = $("#gate-" + n), p = LAYOUT.gates[n];
    g.style.left = p.x + "px"; g.style.top = p.y + "px"; g.style.zIndex = p.y + 100;
    const mm = $(`.mm-gate[data-g="${n}"]`);
    mm.style.left = (p.x / WORLD.w) * 100 + "%"; mm.style.top = ((p.y - 40) / WORLD.h) * 100 + "%";
  });
  const h = $("#hall");
  h.style.left = LAYOUT.hall.x + "px"; h.style.top = LAYOUT.hall.y + "px"; h.style.zIndex = LAYOUT.hall.y + 100;
}

/* 장식물 자동 배치 (원하는 위치·종류로 자유롭게 바꿔도 돼요) */
function seeded(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function buildDecor() {
  const box = $("#decor");
  const rnd = seeded(20261107);
  const avoid = [LAYOUT.start, LAYOUT.hall, ...Object.values(LAYOUT.gates)];
  const ok = (x, y) =>
    avoid.every((a) => Math.hypot(a.x - x, a.y - y) > 170) &&
    !(y > 575 && y < 735) &&                    // 큰길
    !(x > 270 && x < 430 && y > 700) &&         // 골목길
    Math.hypot(x - 1000, y - 650) > 230 &&      // 광장
    !(y < 160 && x < 380) && !(x > 1230 && x < 1660 && ((y < 170) || (y > 700 && y < 870))); // 표지판 자리

  const kinds = {
    1: [["🌳", "sway"], ["🌲", "sway"], ["🏡", ""], ["🏠", ""], ["🌷", "small sway"], ["🌼", "small sway"], ["🐈", "small"], ["🚲", "small"], ["🗑️", "small"], ["🌸", "sway"]],
    2: [["turbine"], ["turbine"], ["solar"], ["solar"], ["🌳", "sway"], ["⛰️", "big"], ["🌻", "sway"], ["🌾", "small sway"]],
    3: [["tower"], ["tower"], ["charger"], ["h2"], ["🏢", "big"], ["🚉", "big"], ["🌴", "sway"], ["🚏", "small"]]
  };
  const areas = { 1: [30, 670, 120, 1280], 2: [740, 1980, 150, 560], 3: [740, 1980, 780, 1280] };
  const counts = { 1: 34, 2: 24, 3: 22 };
  const towerColors = [["#c8b4ff", "#ff9fd8"], ["#9ff3dc", "#6fc7ff"], ["#ffd2b0", "#ff9ad5"], ["#a9dcff", "#c9b6ff"]];

  let html = "";
  for (const z of [1, 2, 3]) {
    const [x0, x1, y0, y1] = areas[z];
    let placed = 0, tries = 0;
    const pts = [];
    while (placed < counts[z] && tries++ < 4000) {
      const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0);
      if (!ok(x, y) || pts.some((p) => Math.hypot(p.x - x, p.y - y) < 85)) continue;
      pts.push({ x, y }); placed++;
      const [k, cls = ""] = kinds[z][(rnd() * kinds[z].length) | 0];
      const st = `left:${x | 0}px;top:${y | 0}px;z-index:${(y | 0) + 100};`;
      if (k === "turbine") html += `<div class="decor turbine" style="${st}"><div class="t-pole"></div><div class="t-hub"><div class="t-blades" style="animation-duration:${(1.6 + rnd() * 2).toFixed(2)}s"><i></i><i></i><i></i></div></div></div>`;
      else if (k === "solar") html += `<div class="decor solar" style="${st}"><div class="panel" style="animation-delay:-${(rnd() * 3).toFixed(1)}s"></div><div class="leg"></div></div>`;
      else if (k === "tower") { const [c1, c2] = towerColors[(rnd() * 4) | 0]; html += `<div class="decor tower" style="${st}height:${(110 + rnd() * 90) | 0}px;--tc1:${c1};--tc2:${c2}"></div>`; }
      else if (k === "charger") html += `<div class="decor charger" style="${st}">⚡</div>`;
      else if (k === "h2") html += `<div class="decor charger h2" style="${st}">H₂</div>`;
      else html += `<div class="decor ${cls}" style="${st}animation-delay:-${(rnd() * 4).toFixed(1)}s">${k}</div>`;
    }
  }
  box.innerHTML = html;
}

function renderCharacter() {
  const s = state.cleared;
  $("#player-sprite").innerHTML = charMarkup(s);
  $("#hud-portrait").innerHTML = charMarkup(s);
  $("#hud-name").textContent = CHARACTERS[s].name;
  $$(".stage-dot").forEach((d) => d.classList.toggle("done", +d.dataset.s <= s));
}

function refreshLocks() {
  [1, 2, 3].forEach((n) => {
    const g = $("#gate-" + n);
    g.classList.toggle("locked", n > state.cleared + 1);
    g.classList.toggle("cleared", n <= state.cleared);
  });
  [2, 3].forEach((n) => {
    const locked = n > state.cleared + 1;
    $(".zone-" + n).classList.toggle("locked", locked);
    $(".mm-z" + n).classList.toggle("locked", locked);
  });
}

/* =========================================================
   이동 & 카메라
   ========================================================= */
function blocked(x, y) {
  for (const n of [2, 3]) {
    if (n <= state.cleared + 1) continue;
    const z = LAYOUT.zones[n];
    if (x > z.x && x < z.x + z.w && y > z.y + 8 && y < z.y + z.h + 40 && !(n === 3 && y < z.y + 40)) return true;
  }
  return false;
}

let last = now(), stepT = 0;
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  const p = state.player;
  let moving = false;

  if (state.started && !state.modal) {
    let dx = 0, dy = 0;
    const k = state.keys;
    if (k.has("ArrowLeft") || k.has("a")) dx -= 1;
    if (k.has("ArrowRight") || k.has("d")) dx += 1;
    if (k.has("ArrowUp") || k.has("w")) dy -= 1;
    if (k.has("ArrowDown") || k.has("s")) dy += 1;

    if (dx || dy) { state.target = null; state.pending = null; }
    else if (state.target) {
      const vx = state.target.x - p.x, vy = state.target.y - p.y, d = Math.hypot(vx, vy);
      if (d < 6) {
        state.target = null;
        const fn = state.pending; state.pending = null;
        if (fn) fn();
      } else { dx = vx / d; dy = vy / d; }
    }
    if (dx || dy) {
      const len = Math.hypot(dx, dy); dx /= len; dy /= len;
      const nx = Math.min(WORLD.w - 40, Math.max(40, p.x + dx * SPEED * dt));
      const ny = Math.min(WORLD.h - 10, Math.max(110, p.y + dy * SPEED * dt));
      let mv = false;
      if (!blocked(nx, p.y)) { p.x = nx; mv = true; }
      if (!blocked(p.x, ny)) { p.y = ny; mv = true; }
      if (!mv) { state.target = null; state.pending = null; }
      if (Math.abs(dx) > 0.1) p.face = dx < 0 ? -1 : 1;
      moving = mv;
      if (blocked(p.x + dx * 30, p.y + dy * 30)) hintLocked();
      stepT += dt; if (moving && stepT > 0.32) { stepT = 0; sfx.step(); }
    }
  }

  const el = $("#player");
  el.style.left = p.x + "px"; el.style.top = p.y + "px"; el.style.zIndex = (p.y | 0) + 101;
  el.classList.toggle("walking", moving);
  el.classList.toggle("face-left", p.face < 0);

  updateCamera();
  updateNear();
  const mm = $("#mm-player");
  mm.style.left = (p.x / WORLD.w) * 100 + "%"; mm.style.top = (p.y / WORLD.h) * 100 + "%";
  requestAnimationFrame(loop);
}

function updateCamera() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const tx = WORLD.w <= vw ? (WORLD.w - vw) / 2 : Math.min(WORLD.w - vw, Math.max(0, state.player.x - vw / 2));
  const ty = WORLD.h <= vh ? (WORLD.h - vh) / 2 : Math.min(WORLD.h - vh, Math.max(0, state.player.y - 60 - vh / 2));
  state.cam.x += (tx - state.cam.x) * 0.12;
  state.cam.y += (ty - state.cam.y) * 0.12;
  $("#world").style.transform = `translate3d(${-state.cam.x.toFixed(1)}px, ${-state.cam.y.toFixed(1)}px, 0)`;
}

function interactables() {
  return [
    ...[1, 2, 3].map((n) => ({ id: "gate-" + n, x: LAYOUT.gates[n].x, y: LAYOUT.gates[n].y + 40, act: () => enterGate(n) })),
    { id: "hall", x: LAYOUT.hall.x, y: LAYOUT.hall.y + 40, act: () => openRank() }
  ];
}
function updateNear() {
  const p = state.player;
  let near = null;
  for (const it of interactables()) if (Math.hypot(it.x - p.x, it.y - p.y) < NEAR) near = it;
  const id = near && !state.modal ? near.id : null;
  if (id !== state.nearId) {
    $$(".building").forEach((b) => b.classList.toggle("near", b.id === id));
    state.nearId = id;
  }
}

let lockHintT = 0;
function hintLocked() {
  if (now() - lockHintT < 2500) return;
  lockHintT = now();
  say(state.cleared === 0 ? "여긴 아직 안개가 자욱해… 1단계부터 클리어하자!" : "앞 단계를 먼저 클리어해야 들어갈 수 있어!");
}

let sayT;
function say(text, ms = 2600) {
  const b = $("#player-bubble");
  b.textContent = text; b.classList.add("show");
  clearTimeout(sayT); sayT = setTimeout(() => b.classList.remove("show"), ms);
}

function toast(msg, ms = 2400) {
  const t = $("#toast"); t.innerHTML = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), ms);
}

/* 클릭으로 이동 */
function screenToWorld(cx, cy) { return { x: cx + state.cam.x, y: cy + state.cam.y }; }
function walkTo(x, y, then) {
  state.target = { x: Math.min(WORLD.w - 40, Math.max(40, x)), y: Math.min(WORLD.h - 10, Math.max(110, y)) };
  state.pending = then || null;
}
function onMapClick(e) {
  if (!state.started || state.modal) return;
  unlockAudio();
  const bld = e.target.closest(".building");
  if (bld) {
    const it = interactables().find((i) => i.id === bld.id);
    if (Math.hypot(it.x - state.player.x, it.y - state.player.y) < NEAR) it.act();
    else walkTo(it.x, it.y, it.act);
    return;
  }
  const zl = e.target.closest(".zone-lock");
  if (zl) { sfx.locked(); hintLocked(); toast("🔒 " + zl.textContent.replace("🔒", "").trim()); }
  const w = screenToWorld(e.clientX, e.clientY);
  walkTo(w.x, w.y);
  const m = $("#click-marker");
  m.style.left = w.x + "px"; m.style.top = w.y + "px";
  m.classList.remove("ping"); void m.offsetWidth; m.classList.add("ping");
}

function enterGate(n) {
  if (n > state.cleared + 1) { sfx.locked(); toast(`🔒 ${n - 1}단계를 먼저 클리어해야 열려요!`); return; }
  if (n <= state.cleared) { sfx.click(); toast(`✅ 이미 클리어한 동네예요! (${STAGES[n - 1].name})`); say("다음 동네로 가 보자! ➜"); return; }
  openQuiz(n);
}

/* =========================================================
   모달 공통
   ========================================================= */
function openModal(id) { state.modal = id; $("#" + id).classList.add("show"); state.keys.clear(); }
function closeModal(id) { $("#" + id).classList.remove("show"); if (state.modal === id) state.modal = null; }

/* =========================================================
   퀴즈
   ========================================================= */
let activeQuiz = 1;
function openQuiz(n) {
  sfx.open();
  activeQuiz = n;
  const stage = STAGES[n - 1];
  if (!state.quiz[n]) state.quiz[n] = { order: shuffle(stage.questions.map((_, i) => i)), idx: 0 };
  $("#quiz-chip").textContent = `STAGE ${n} · ${stage.name}`;
  $("#hint-avatar").innerHTML = charMarkup(state.cleared);
  openModal("quiz-modal");
  renderQuestion(n);
}

function renderQuestion(n) {
  const qs = state.quiz[n], stage = STAGES[n - 1];
  const q = stage.questions[qs.order[qs.idx]];
  qs.current = { n, q, answered: false };
  $("#quiz-count").textContent = `${qs.idx + 1} / ${stage.questions.length}`;
  $("#quiz-progress").innerHTML = stage.questions.map((_, i) => `<i class="${i < qs.idx ? "done" : i === qs.idx ? "now" : ""}"></i>`).join("");
  const vis = $("#quiz-visual");
  vis.textContent = q.visual || stage.emoji; vis.hidden = !q.visual;
  $("#quiz-q").textContent = q.q;
  $("#hint-area").classList.remove("show");
  $("#explain-pop").classList.remove("show");

  const opts = shuffle(q.options.map((text, i) => ({ text, correct: i === 0 })));
  const box = $("#quiz-options");
  box.innerHTML = "";
  opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = `<span class="num">${i + 1}</span><span class="txt"></span>`;
    b.querySelector(".txt").textContent = o.text;
    b.addEventListener("click", () => answer(b, o.correct));
    box.appendChild(b);
  });
}

const CHEERS = ["정답이에요! ✨", "완벽해요! 🌟", "천재 컨설턴트! 💖", "대박! 정답! 🎉", "역시 최고야! 🌈"];
const BOOS = ["앗, 아깝다! 😵", "음… 다시 생각해 볼까? 🤔", "괜찮아, 힌트 줄게! 💡"];

function answer(btn, correct) {
  const cur = state.quiz[activeQuiz]?.current;
  if (!cur || cur.answered || btn.disabled) return;
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;

  if (correct) {
    cur.answered = true;
    sfx.correct();
    btn.classList.add("correct");
    $$(".opt").forEach((b) => (b.disabled = true));
    setTimeout(() => {
      const qs = state.quiz[cur.n], total = STAGES[cur.n - 1].questions.length;
      $("#explain-title").textContent = CHEERS[(Math.random() * CHEERS.length) | 0];
      $("#explain-text").textContent = cur.q.explain;
      $("#btn-next").textContent = qs.idx + 1 >= total ? "🎉 단계 클리어! ➜" : "다음 문제로 ➜";
      $("#explain-pop").classList.add("show");
    }, 550);
  } else {
    sfx.wrong();
    state.wrongTotal++;
    btn.classList.add("wrong");
    btn.disabled = true;
    const app = $("#app"), card = $("#quiz-card");
    app.classList.remove("shake"); card.classList.remove("shake");
    void app.offsetWidth; app.classList.add("shake"); card.classList.add("shake");
    $("#hint-text").textContent = `${BOOS[(Math.random() * BOOS.length) | 0]} ${cur.q.hint}`;
    const ha = $("#hint-area"); ha.classList.remove("show"); void ha.offsetWidth; ha.classList.add("show");
    if (GAME.WRONG_PENALTY_SEC > 0) {
      const f = document.createElement("div");
      f.className = "penalty-float"; f.textContent = `+${GAME.WRONG_PENALTY_SEC}초`;
      f.style.left = (btn.offsetLeft + btn.offsetWidth - 70) + "px"; f.style.top = btn.offsetTop + "px";
      card.appendChild(f); setTimeout(() => f.remove(), 1000);
    }
    setTimeout(() => { if (card.scrollHeight > card.clientHeight) card.scrollTo({ top: card.scrollHeight, behavior: "smooth" }); }, 100);
  }
}

function nextQuestion() {
  const n = activeQuiz, qs = state.quiz[n];
  if (!qs || !qs.current?.answered) return;
  sfx.click();
  qs.idx++;
  if (qs.idx >= STAGES[n - 1].questions.length) { qs.done = true; closeModal("quiz-modal"); stageClear(n); }
  else renderQuestion(n);
}

/* =========================================================
   진화 연출
   ========================================================= */
async function stageClear(n) {
  pauseTimer();
  const grand = n === 3;
  const ov = $("#evo-overlay");
  ov.className = "overlay evo-overlay show" + (grand ? " grand" : "");
  state.modal = "evo-overlay";
  $("#evo-old").innerHTML = charMarkup(n - 1);
  $("#evo-new").innerHTML = charMarkup(n);
  $("#evo-old").style.opacity = 1; $("#evo-new").style.opacity = 0;
  $("#evo-pre").textContent = grand ? "✨ 쪼꼬미에게서 엄청난 에너지가…!!! ✨" : "어라…? 쪼꼬미의 상태가…!?";
  $("#evo-pre").style.opacity = 1;

  const cx = window.innerWidth / 2, cy = window.innerHeight * 0.45;
  await sleep(700);
  sfx.evolve(grand);
  ov.classList.add("charging");
  const chargeLen = grand ? 3200 : 2400;
  const convergeId = setInterval(() => fx.converge(cx, cy, grand ? 40 : 25), 180);

  // 실루엣 깜빡깜빡 (점점 빠르게)
  const t0 = now();
  let showNew = false;
  while (now() - t0 < chargeLen - 150) {
    const prog = (now() - t0) / chargeLen;
    if (prog > 0.35) {
      ov.classList.add("silhouette");
      showNew = !showNew;
      $("#evo-old").style.opacity = showNew ? 0 : 1;
      $("#evo-new").style.opacity = showNew ? 1 : 0;
    }
    await sleep(Math.max(55, 300 * (1 - prog)));
  }
  clearInterval(convergeId);

  // 팡!
  ov.classList.remove("charging", "silhouette");
  ov.classList.add("boom", "done");
  $("#evo-pre").style.opacity = 0;
  $("#evo-old").style.opacity = 0; $("#evo-new").style.opacity = 1;
  fx.burst(cx, cy, { count: grand ? 220 : 140, speed: grand ? 16 : 12, life: 90 });
  fx.confetti(grand ? 260 : 140);
  if (grand) { sfx.fanfare(); fx.fireworks(4200, 220); }
  else setTimeout(() => { fx.rocket(cx - 200); fx.rocket(cx + 200); }, 200);

  state.cleared = n;
  $("#evo-title").textContent = grand ? "🎊 최종 진화 성공! 🎊" : "진화 성공!";
  $("#evo-name").textContent = CHARACTERS[n].name;
  $("#evo-desc").textContent = CHARACTERS[n].desc + (grand ? "" : ` 이제 ${STAGES[n].name}에 갈 수 있어요!`);
  $("#btn-evo-ok").textContent = grand ? "🏅 보상 받으러 가기 ➜" : "좋아, 계속 가자! ➜";
  renderCharacter();
}

function afterEvolution() {
  const n = state.cleared;
  $("#evo-overlay").className = "overlay evo-overlay";
  state.modal = null;
  if (n >= 3) { finale(); return; }
  resumeTimer();
  const z = $(".zone-" + (n + 1));
  z.classList.add("unlocking");
  refreshLocks();
  sfx.unlock();
  setTimeout(() => z.classList.remove("unlocking"), 1500);
  toast(`🔓 <b>${STAGES[n].name}</b> 동네가 열렸어요!`, 3000);
  say(`${STAGES[n].name}로 출발! ➜`);
  const g = LAYOUT.gates[n + 1];
  const s = { x: g.x - state.cam.x, y: g.y - state.cam.y - 60 };
  if (s.x > 0 && s.y > 0 && s.x < innerWidth && s.y < innerHeight) fx.burst(s.x, s.y, { count: 60 });
}

/* =========================================================
   최종 클리어 & 보상
   ========================================================= */
function finale() {
  pauseTimer();
  state.finished = true;
  const raw = elapsedMs(), pen = state.wrongTotal * GAME.WRONG_PENALTY_SEC * 1000;
  state.final = { raw, total: raw + pen };
  $("#timer").textContent = fmt(raw);
  $("#final-raw").textContent = fmt(raw);
  $("#final-penalty").textContent = `+${state.wrongTotal * GAME.WRONG_PENALTY_SEC}초 (오답 ${state.wrongTotal}개)`;
  $("#final-total").textContent = fmt(state.final.total);
  $("#reward").classList.remove("show");
  $("#final-form").style.display = "";
  openModal("final-overlay");
  sfx.fanfare();
  fx.fireworks(7000, 200);
  fx.confetti(220);
  setTimeout(() => $("#nick-input").focus(), 600);
}

function parseNick(raw) {
  const nick = raw.replace(/\s/g, "");
  const m = nick.match(GAME.NICKNAME_RULE);
  if (!m) return null;
  return { nickname: nick, grade: +m[1], classNo: +m[2], studentNo: +m[3], name: m[4], classKey: `${+m[1]}-${+m[2]}` };
}

async function saveFinal() {
  if (state.saved) return;
  const info = parseNick($("#nick-input").value);
  const msg = $("#form-msg");
  if (!info) { msg.textContent = "학번 5자리 + 이름으로 입력해 주세요! (예: 31201홍길동)"; sfx.wrong(); $("#nick-input").classList.add("shake"); setTimeout(() => $("#nick-input").classList.remove("shake"), 500); return; }
  const btn = $("#btn-save");
  btn.disabled = true; btn.textContent = "저장 중… ⏳"; msg.textContent = "";
  try {
    const mode = await saveRecord({ ...info, timeMs: Math.round(state.final.total), rawTimeMs: Math.round(state.final.raw), wrongCount: state.wrongTotal });
    state.saved = true; state.myNick = info.nickname;
    refreshBoard();
    showReward(info, mode);
  } catch (err) {
    console.error(err);
    msg.textContent = "앗, 저장에 실패했어요. 인터넷 연결을 확인하고 다시 눌러 주세요!";
    btn.disabled = false; btn.textContent = "기록 저장 ✨";
  }
}

function showReward(info, mode) {
  $("#final-form").style.display = "none";
  $("#cert-name").textContent = `${info.grade}${String(info.classNo).padStart(2, "0")}${String(info.studentNo).padStart(2, "0")} ${info.name}`;
  $("#cert-time").textContent = fmt(state.final.total);
  const d = new Date();
  $("#cert-date").textContent = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  $("#cert-sign").textContent = `${GAME.SCHOOL_NAME} ${GAME.TEACHER_NAME}`;
  $("#coupon-title").textContent = GAME.COUPON.title;
  $("#coupon-item").textContent = GAME.COUPON.item;
  $("#coupon-how").textContent = GAME.COUPON.howTo;
  $("#coupon-exp").textContent = "사용 기한: " + GAME.COUPON.expire;
  const code = "G-" + info.nickname.slice(0, 5) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  $("#coupon-code").textContent = code;
  $("#reward").classList.add("show");
  sfx.fanfare();
  fx.fireworks(4500, 180);
  fx.confetti(200);
  toast(mode === "online" ? "🏆 명예의 전당에 기록이 올라갔어요!" : "🧪 데모 모드: 이 기기에만 기록이 저장됐어요", 3500);
}

async function downloadCert() {
  const btn = $("#btn-download");
  btn.disabled = true; btn.textContent = "이미지 만드는 중… ⏳";
  try {
    if (!window.html2canvas) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;left:-9999px;top:0;width:760px;padding:20px;display:flex;flex-direction:column;gap:16px;background:#2a1850";
    wrap.appendChild($("#certificate").cloneNode(true));
    wrap.appendChild($("#coupon").cloneNode(true));
    wrap.querySelectorAll("*").forEach((el) => (el.style.animation = "none"));
    [...wrap.children].forEach((el) => (el.style.animation = "none"));
    document.body.appendChild(wrap);
    const canvas = await window.html2canvas(wrap, { scale: 2, backgroundColor: "#2a1850", useCORS: true });
    wrap.remove();
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `그린마이스터_${state.myNick || "인증서"}.png`;
    a.click();
  } catch (e) {
    console.error(e);
    toast("이미지 저장이 어려워요. 화면을 캡처해 주세요! 📸");
  }
  btn.disabled = false; btn.textContent = "📸 인증서 이미지 저장";
}

/* =========================================================
   명예의 전당
   ========================================================= */
let rankCache = null, rankTab = "school";
const mask = (name) => !GAME.MASK_NAME || name.length < 2 ? name : name.length === 2 ? name[0] + "*" : name[0] + "*".repeat(name.length - 2) + name[name.length - 1];

/* 기록 불러오기: 한 사람당 최고 기록 1개, 빠른 순 */
async function getRanking() {
  const recs = await fetchRecords();
  const best = new Map();
  recs.forEach((r) => { if (!best.has(r.nickname) || best.get(r.nickname).timeMs > r.timeMs) best.set(r.nickname, r); });
  return [...best.values()].sort((a, b) => a.timeMs - b.timeMs);
}

/* 화면에 항상 보이는 TOP 10 랭킹 */
function renderBoard(list) {
  const medal = ["🥇", "🥈", "🥉"];
  let html = "";
  for (let i = 0; i < 10; i++) {
    const r = list[i];
    html += r
      ? `<li class="${r.nickname === state.myNick ? "me" : ""}"><span class="b-no">${medal[i] || i + 1}</span><span class="b-name">${String(r.nickname).replace(r.name, mask(r.name)).replace(/[<>&]/g, "")}</span><span class="b-time">${fmt(r.timeMs)}</span></li>`
      : `<li class="empty"><span class="b-no">${medal[i] || i + 1}</span><span class="b-name">도전자를 기다려요</span><span class="b-time">--:--.-</span></li>`;
  }
  $("#board-list").innerHTML = html;
}
async function refreshBoard() {
  try { renderBoard(await getRanking()); }
  catch (e) { console.error(e); $("#board-list").innerHTML = `<li class="empty"><span class="b-name">랭킹을 불러오지 못했어요</span></li>`; }
}

async function openRank() {
  sfx.open();
  const wasFinal = state.modal === "final-overlay";
  if (wasFinal) $("#final-overlay").classList.remove("show");
  openModal("rank-modal");
  rankCache = null;
  $("#rank-mode").textContent = isOnline() ? "🌐 실시간 랭킹 · 최종 기록(오답 페널티 포함) 빠른 순 · 1인 최고 기록" : "🧪 데모 모드 · 이 기기에 저장된 기록만 보여요 (Firebase 설정 전)";
  $("#rank-list").innerHTML = `<li class="rank-empty"><div class="spinner"></div>불러오는 중…</li>`;
  try {
    rankCache = await getRanking();
    renderBoard(rankCache);
    const sel = $("#class-select");
    const classes = [...new Set(rankCache.map((r) => r.classKey))].sort((a, b) => { const [g1, c1] = a.split("-").map(Number), [g2, c2] = b.split("-").map(Number); return g1 - g2 || c1 - c2; });
    const mine = state.myNick ? parseNick(state.myNick)?.classKey : null;
    sel.innerHTML = classes.map((c) => { const [g, k] = c.split("-"); return `<option value="${c}" ${c === mine ? "selected" : ""}>${g}학년 ${k}반</option>`; }).join("");
    renderRank();
  } catch (e) {
    console.error(e);
    $("#rank-list").innerHTML = `<li class="rank-empty">랭킹을 불러오지 못했어요 😢<br><small>Firebase 설정과 보안 규칙을 확인해 주세요.</small></li>`;
  }
}

function renderRank() {
  if (!rankCache) return;
  const sel = $("#class-select");
  sel.hidden = rankTab !== "class" || !sel.options.length;
  let list = rankCache;
  if (rankTab === "class") list = list.filter((r) => r.classKey === sel.value);
  /* 항상 1위~10위 칸을 보여 주고, 빈 자리는 '도전자 대기 중'으로 표시 */
  const TOP = 10;
  list = list.slice(0, TOP);
  const medal = ["🥇", "🥈", "🥉"];
  let html = "";
  for (let i = 0; i < TOP; i++) {
    const r = list[i];
    const no = `<span class="rank-no">${medal[i] || i + 1}</span>`;
    html += r
      ? `<li class="${r.nickname === state.myNick ? "me" : ""}">${no}
        <span class="rank-nick">${String(r.nickname).replace(r.name, mask(r.name)).replace(/[<>&]/g, "")}<small>${r.grade}학년 ${r.classNo}반 · 오답 ${r.wrongCount ?? 0}개</small></span>
        <span class="rank-time">${fmt(r.timeMs)}</span></li>`
      : `<li class="rank-slot">${no}<span class="rank-nick">도전자를 기다려요</span><span class="rank-time">--:--.-</span></li>`;
  }
  $("#rank-list").innerHTML = html;
}

function closeRank() {
  closeModal("rank-modal");
  if (state.finished && !state.restarted) { $("#final-overlay").classList.add("show"); state.modal = "final-overlay"; }
  else if (!state.started) state.modal = "start-screen";
}

/* =========================================================
   시작 / 재시작
   ========================================================= */
function startGame() {
  unlockAudio(); sfx.unlock();
  $("#start-screen").classList.remove("show");
  state.modal = null; state.started = true;
  state.elapsed = 0; resumeTimer();
  setTimeout(() => say("우리 동네를 깨끗하게 바꾸러 가자! 위쪽 1단계 건물로 고고! 🌱", 4000), 500);
}

function restart() { location.reload(); }

/* =========================================================
   이벤트
   ========================================================= */
function bind() {
  $("#viewport").addEventListener("click", onMapClick);
  $("#btn-start").addEventListener("click", startGame);
  $("#btn-start-rank").addEventListener("click", () => { unlockAudio(); $("#start-screen").classList.remove("show"); openRank(); });
  $("#btn-rank").addEventListener("click", () => { if (!state.modal) openRank(); });
  $("#btn-sound").addEventListener("click", (e) => { setMuted(!isMuted()); e.currentTarget.textContent = isMuted() ? "🔇" : "🔊"; });
  $("#quiz-close").addEventListener("click", () => { closeModal("quiz-modal"); say("준비되면 다시 도전하자! 💪"); });
  $("#btn-next").addEventListener("click", nextQuestion);
  $("#btn-evo-ok").addEventListener("click", afterEvolution);
  $("#btn-save").addEventListener("click", saveFinal);
  $("#nick-input").addEventListener("keydown", (e) => { if (e.key === "Enter") saveFinal(); e.stopPropagation(); });
  $("#btn-download").addEventListener("click", downloadCert);
  $("#btn-final-rank").addEventListener("click", openRank);
  $("#btn-restart").addEventListener("click", restart);
  $("#rank-close").addEventListener("click", () => {
    closeRank();
    if (!state.started) $("#start-screen").classList.add("show");
  });
  $$(".tab").forEach((t) => t.addEventListener("click", () => {
    sfx.click(); rankTab = t.dataset.tab;
    $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
    renderRank();
  }));
  $("#class-select").addEventListener("change", renderRank);
  /* TOP 10 패널 접기/펼치기 (좁은 화면에서는 처음에 접힘) */
  const hr = $("#hud-rank");
  const setFold = (f) => { hr.classList.toggle("folded", f); $("#rank-toggle-icon").textContent = f ? "＋" : "－"; };
  setFold(window.innerWidth < 640);
  $("#rank-toggle").addEventListener("click", () => { sfx.click(); setFold(!hr.classList.contains("folded")); });
  $("#board-more").addEventListener("click", () => { if (!state.modal) openRank(); });

  const MOVE = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  window.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (state.modal === "quiz-modal") {
      if ($("#explain-pop").classList.contains("show")) { if (k === "Enter" || k === " ") { e.preventDefault(); nextQuestion(); } }
      else if (/^[1-4]$/.test(k)) { const b = $$(".opt")[+k - 1]; if (b) b.click(); }
      else if (k === "Escape") $("#quiz-close").click();
      return;
    }
    if (state.modal === "rank-modal" && k === "Escape") { $("#rank-close").click(); return; }
    if (state.modal === "evo-overlay" && (k === "Enter") && $("#evo-overlay").classList.contains("done")) { afterEvolution(); return; }
    if (state.modal) return;
    if (MOVE.includes(k) || (k.length === 1 && "wasd".includes(k))) { state.keys.add(k); e.preventDefault(); unlockAudio(); }
    if ((k === " " || k === "Enter") && state.started) {
      e.preventDefault();
      const it = interactables().find((i) => i.id === state.nearId);
      if (it) it.act();
    }
  });
  window.addEventListener("keyup", (e) => state.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  window.addEventListener("blur", () => state.keys.clear());

  /* 브라우저가 화면을 몰래 스크롤해 맵이 밀리는 것 방지 */
  ["#app", "#viewport"].forEach((sel) => { const el = $(sel); el.addEventListener("scroll", () => { el.scrollTop = 0; el.scrollLeft = 0; }); });
  window.addEventListener("scroll", () => window.scrollTo(0, 0));

  setInterval(() => { if (state.started && !state.finished) $("#timer").textContent = fmt(elapsedMs()); }, 100);
}

/* ---------- 시작 ---------- */
function init() {
  applyImages();
  placeBuildings();
  buildDecor();
  renderCharacter();
  refreshLocks();
  $("#start-char").innerHTML = charMarkup(0);
  $("#start-mode").textContent = isOnline() ? "🌐 실시간 명예의 전당 연결됨" : "🧪 데모 모드 (Firebase 설정 전: 기록은 이 기기에만 저장돼요)";
  state.modal = "start-screen";
  bind();
  renderBoard([]);
  refreshBoard();
  setInterval(() => { if (!document.hidden) refreshBoard(); }, 60000); // 1분마다 새로고침
  requestAnimationFrame((t) => { last = t; loop(t); });
}
init();
