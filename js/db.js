/* =========================================================
   🏆 랭킹 저장소 (Firebase Firestore)
   config.js 에 Firebase 설정이 없으면 '데모 모드'로
   이 브라우저(localStorage)에만 저장합니다.
   ========================================================= */
import { FIREBASE_CONFIG, COLLECTION } from './config.js';

const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const LOCAL_KEY = "ecoVillage_localRanking";

export const isOnline = () =>
  !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !String(FIREBASE_CONFIG.apiKey).startsWith("YOUR"));

let db = null, F = null, initPromise = null;

async function init() {
  if (!isOnline()) return false;
  if (!initPromise) {
    initPromise = (async () => {
      const appMod = await import(SDK + "firebase-app.js");
      F = await import(SDK + "firebase-firestore.js");
      const app = appMod.initializeApp(FIREBASE_CONFIG);
      db = F.getFirestore(app);
      return true;
    })();
  }
  return initPromise;
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}

/* 기록 저장: { nickname, grade, classNo, studentNo, name, classKey, timeMs, rawTimeMs, wrongCount } */
export async function saveRecord(rec) {
  if (await init()) {
    await F.addDoc(F.collection(db, COLLECTION), { ...rec, createdAt: F.serverTimestamp() });
    return "online";
  }
  const list = readLocal();
  list.push({ ...rec, createdAt: Date.now() });
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch {}
  return "local";
}

/* 기록 불러오기: 빠른 순 상위 500개 (반별 필터는 화면에서 처리 → 색인 설정 불필요) */
export async function fetchRecords() {
  if (await init()) {
    const q = F.query(F.collection(db, COLLECTION), F.orderBy("timeMs", "asc"), F.limit(500));
    const snap = await F.getDocs(q);
    return snap.docs.map((d) => d.data());
  }
  return readLocal().sort((a, b) => a.timeMs - b.timeMs);
}
