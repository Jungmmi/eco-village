/* =========================================================
   🔊 효과음 (Web Audio API로 직접 합성 → 음원 파일 없이도 소리 남!)
   직접 녹음한 mp3를 쓰고 싶다면 assets/sounds/ 에 넣고
   SOUND_FILES 에 경로를 적으세요. (예: correct: "assets/sounds/correct.mp3")
   ========================================================= */
const SOUND_FILES = { correct: "", wrong: "", evolve: "", fanfare: "" };

let ctx = null, master = null, muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function unlockAudio() { ac(); }
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.55; }
export function isMuted() { return muted; }

function playFile(key) {
  if (!SOUND_FILES[key] || muted) return false;
  const a = new Audio(SOUND_FILES[key]);
  a.volume = 0.7; a.play().catch(() => {});
  return true;
}

function tone({ f, f2, t = 0, d = 0.2, type = "sine", g = 0.25, attack = 0.012, vib = 0 }) {
  const c = ac(); if (!c || muted) return;
  const st = c.currentTime + t;
  const o = c.createOscillator(), gn = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, st);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, st + d);
  if (vib) {
    const l = c.createOscillator(), lg = c.createGain();
    l.frequency.value = 18; lg.gain.value = vib;
    l.connect(lg).connect(o.frequency); l.start(st); l.stop(st + d + 0.05);
  }
  gn.gain.setValueAtTime(0.0001, st);
  gn.gain.exponentialRampToValueAtTime(g, st + attack);
  gn.gain.exponentialRampToValueAtTime(0.0001, st + d);
  o.connect(gn).connect(master);
  o.start(st); o.stop(st + d + 0.05);
}

function noise({ t = 0, d = 0.4, g = 0.2, freq = 1800, q = 0.8 }) {
  const c = ac(); if (!c || muted) return;
  const st = c.currentTime + t;
  const len = Math.floor(c.sampleRate * d);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = q;
  const gn = c.createGain(); gn.gain.value = g;
  src.connect(bp).connect(gn).connect(master);
  src.start(st);
}

const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093, G4: 392 };

export const sfx = {
  click() { tone({ f: 700, f2: 980, d: 0.07, type: "triangle", g: 0.12 }); },
  step() { tone({ f: 240, f2: 180, d: 0.05, type: "sine", g: 0.04 }); },
  open() { [N.G5, N.C6].forEach((f, i) => tone({ f, t: i * 0.06, d: 0.18, type: "triangle", g: 0.12 })); },

  /* 맑고 경쾌한 정답음: 반짝 아르페지오 */
  correct() {
    if (playFile("correct")) return;
    [N.C6, N.E6, N.G6, N.C7].forEach((f, i) => tone({ f, t: i * 0.065, d: 0.4, type: "triangle", g: 0.2 }));
    tone({ f: 3136, t: 0.26, d: 0.55, type: "sine", g: 0.07 });
    tone({ f: 4186, t: 0.32, d: 0.45, type: "sine", g: 0.05 });
  },

  /* 귀여운 오답음: 뿌잉~ */
  wrong() {
    if (playFile("wrong")) return;
    tone({ f: 520, f2: 260, d: 0.22, type: "triangle", g: 0.2, vib: 25 });
    tone({ f: 380, f2: 170, t: 0.2, d: 0.32, type: "triangle", g: 0.2, vib: 30 });
  },

  locked() {
    tone({ f: 180, d: 0.12, type: "square", g: 0.06 });
    tone({ f: 150, t: 0.14, d: 0.16, type: "square", g: 0.06 });
  },

  unlock() {
    [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, i) => tone({ f, t: i * 0.08, d: 0.35, type: "sine", g: 0.16 }));
  },

  pop() { noise({ d: 0.5, g: 0.35, freq: 600 + Math.random() * 1600 }); },
  whoosh() { noise({ d: 0.6, g: 0.12, freq: 3000, q: 0.4 }); },

  /* 진화: 상승 스윕 + 반짝이 + 화음 */
  evolve(grand = false) {
    if (playFile("evolve")) return;
    const len = grand ? 3.2 : 2.4;
    tone({ f: 180, f2: 1400, d: len, type: "sine", g: 0.12, attack: 0.3 });
    tone({ f: 270, f2: 2100, d: len, type: "triangle", g: 0.05, attack: 0.3 });
    for (let i = 0; i < (grand ? 26 : 16); i++) {
      tone({ f: 1500 + Math.random() * 2500, t: 0.2 + Math.random() * (len - 0.3), d: 0.18, type: "sine", g: 0.05 });
    }
    const t0 = len + 0.05;
    [N.C5, N.E5, N.G5, N.C6].forEach((f) => tone({ f, t: t0, d: 1.4, type: "triangle", g: 0.12 }));
    tone({ f: N.C7, t: t0, d: 1.2, type: "sine", g: 0.06 });
    noise({ t: t0, d: 0.8, g: 0.2, freq: 5000, q: 0.3 });
  },

  /* 최종 팡파르 */
  fanfare() {
    if (playFile("fanfare")) return;
    const seq = [[N.G4, 0], [N.C5, 0.14], [N.E5, 0.28], [N.G5, 0.42], [N.E5, 0.62], [N.G5, 0.76]];
    seq.forEach(([f, t]) => { tone({ f, t, d: 0.22, type: "square", g: 0.06 }); tone({ f: f * 2, t, d: 0.22, type: "triangle", g: 0.08 }); });
    [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f) => tone({ f, t: 0.95, d: 1.8, type: "triangle", g: 0.1 }));
    tone({ f: N.C7, t: 0.95, d: 1.6, type: "sine", g: 0.06 });
  }
};
