'use strict';

const display = document.getElementById('display');
const inputH = document.getElementById('input-h');
const inputM = document.getElementById('input-m');
const inputS = document.getElementById('input-s');
const statusEl = document.getElementById('status');
const btnToggle = document.getElementById('btn-toggle');
const btnStop = document.getElementById('btn-stop');
const btnOmen = document.getElementById('btn-omen');
const btnQuit = document.getElementById('btn-quit');
const btnModeDuration = document.getElementById('btn-mode-duration');
const btnModeTarget = document.getElementById('btn-mode-target');
const modeLabel = document.getElementById('mode-label');

const MODE = { DURATION: 'duration', TARGET: 'target' };

let mode = MODE.DURATION;
let timerId = null;
let running = false;
let paused = false;

let remainingMs = 0;        // 剩餘時間（顯示用）
let runStartedAt = 0;       // 本次開始的效能基準時間
let runBaseRemaining = 0;   // 本次開始時的剩餘時間
let targetDate = null;      // 目標時間模式下的目標時刻
let durationStartWallMs = 0; // 持續時間模式啟動時的牆鐘時間
let submittedDurationMs = 0; // 使用者提交的持續時間長度

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function readFields() {
  const toNum = (el, dft) => {
    const v = el.value.trim();
    return v === '' ? dft : Number(v);
  };
  const h = toNum(inputH, 0);
  const m = toNum(inputM, 0);
  const s = toNum(inputS, 0);
  return { h, m, s };
}

function validateFields() {
  const { h, m, s } = readFields();
  if (!Number.isInteger(h) || !Number.isInteger(m) || !Number.isInteger(s)) return false;
  if (h < 0 || m < 0 || s < 0 || m > 59 || s > 59) return false;
  return true;
}

function setFieldsHMS(h, m, s) {
  inputH.value = String(h);
  inputM.value = String(m);
  inputS.value = String(s);
}

function setFieldsFromMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  setFieldsHMS(h, m, s);
}

function setFieldsFromDate(d) {
  setFieldsHMS(pad2(d.getHours()), pad2(d.getMinutes()), pad2(d.getSeconds()));
}

// 目前剩餘時間的精確值（暫停時為凍結值）
function exactRemaining() {
  if (paused) return remainingMs;
  return Math.max(0, computeRemaining());
}

// 讀取輸入框目前的持續時間長度（毫秒）
function fieldsToDurationMs() {
  const { h, m, s } = readFields();
  return (h * 3600 + m * 60 + s) * 1000;
}

function showStatus(msg) {
  statusEl.textContent = msg || '';
  if (msg && typeof showToast === 'function') {
    showToast(msg);
  }
}

function setRunningClass(on) {
  display.classList.toggle('running', on);
}

function setFinishedClass(on) {
  display.classList.toggle('finished', on);
}

function clearTicker() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function updateDisplay() {
  display.textContent = formatHMS(remainingMs);
}

function computeRemaining() {
  if (mode === MODE.DURATION) {
    const elapsed = performance.now() - runStartedAt;
    return runBaseRemaining - elapsed;
  }
  if (!targetDate) return remainingMs;
  return targetDate.getTime() - Date.now();
}

function tick() {
  const rem = computeRemaining();
  if (rem <= 0) {
    remainingMs = 0;
    updateDisplay();
    stopTicker();
    setRunningClass(false);
    setFinishedClass(true);
    updateToggleBtn();
    showStatus('時間到！');
    return;
  }
  remainingMs = rem;
  updateDisplay();
}

function startTicker() {
  clearTicker();
  setFinishedClass(false);
  timerId = setInterval(tick, 250);
  tick();
}

function stopTicker() {
  clearTicker();
  setRunningClass(false);
}

function startCountdown() {
  if (paused) {
    // 從暫停狀態恢復
    runStartedAt = performance.now();
    runBaseRemaining = remainingMs;
    paused = false;
    running = true;
    startTicker();
    setRunningClass(true);
    updateToggleBtn();
    showStatus('');
    return;
  }

  if (!validateFields()) {
    showStatus('請輸入有效時間 (hh:mm:ss)');
    return;
  }

  const { h, m, s } = readFields();

  if (mode === MODE.DURATION) {
    const totalSeconds = h * 3600 + m * 60 + s;
    if (totalSeconds <= 0) {
      showStatus('時間長度需大於 0');
      return;
    }
    remainingMs = totalSeconds * 1000;
    targetDate = null;
    durationStartWallMs = Date.now();
    submittedDurationMs = remainingMs;
  } else {
    // 目標時間：把 hh:mm:ss 解釋為今天的目標時刻
    const now = new Date();
    targetDate = new Date(now);
    targetDate.setHours(h, m, s, 0);
    // 若目標時刻已過，推到明天
    if (targetDate.getTime() <= now.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    remainingMs = targetDate.getTime() - now.getTime();
    durationStartWallMs = 0;
    submittedDurationMs = 0;
  }

  runStartedAt = performance.now();
  runBaseRemaining = remainingMs;
  paused = false;
  running = true;
  startTicker();
  setRunningClass(true);
  updateToggleBtn();
  showStatus('');
}

function pauseCountdown() {
  if (!running || paused) return;
  const rem = computeRemaining();
  remainingMs = Math.max(0, rem);
  paused = true;
  running = false;
  stopTicker();
  updateDisplay();
  updateToggleBtn();
  showStatus('已暫停');
}

function updateToggleBtn() {
  if (running) {
    btnToggle.textContent = '暫停';
    btnToggle.classList.add('paused');
  } else {
    btnToggle.textContent = '開始';
    btnToggle.classList.remove('paused');
  }
}

function stopCountdown() {
  clearTicker();
  running = false;
  paused = false;
  targetDate = null;
  remainingMs = 0;
  durationStartWallMs = 0;
  submittedDurationMs = 0;
  updateDisplay();
  setRunningClass(false);
  setFinishedClass(false);
  updateToggleBtn();
  inputH.value = '';
  inputM.value = '';
  inputS.value = '';
  showStatus('');
}

function setMode(next) {
  if (next === mode) return;

  if (next === MODE.TARGET) {
    // 持續時間 → 目標時間：輸入框顯示「開始倒計時的時間 + 持續時間」的目標時刻
    if (running || paused) {
      // 不中斷倒計時：保留剩餘時間，換算目標時刻供輸入框顯示
      const rem = exactRemaining();
      remainingMs = rem;
      const now = new Date();
      // 基於目前剩餘時間重建目標時刻，使計時連續不跳動
      targetDate = new Date(now.getTime() + rem);
      const submitNow = new Date(now);
      const targetForInput = submittedDurationMs > 0
        ? new Date(durationStartWallMs + submittedDurationMs)
        : new Date(submitNow.getTime() + rem);
      setFieldsFromDate(targetForInput);
    } else {
      // 未計時：直接以輸入的持續時間換算目標時刻
      const now = new Date();
      const target = new Date(now.getTime() + fieldsToDurationMs());
      setFieldsFromDate(target);
    }
  } else {
    // 目標時間 → 持續時間：輸入框顯示到目標時間的剩餘時間
    if (running || paused) {
      const rem = exactRemaining();
      remainingMs = rem;
      // 重建持續時間基準，使計時連續
      runStartedAt = performance.now();
      runBaseRemaining = rem;
      setFieldsFromMs(rem);
    } else if (targetDate) {
      setFieldsFromMs(Math.max(0, targetDate.getTime() - Date.now()));
    } else {
      // 空閒且無目標時刻：保留輸入框現值
    }
  }

  mode = next;
  btnModeDuration.classList.toggle('active', next === MODE.DURATION);
  btnModeTarget.classList.toggle('active', next === MODE.TARGET);
  modeLabel.textContent = next === MODE.DURATION ? '持續時間模式' : '目標時間模式';
  updateDisplay();
}

function focusFirstInput() {
  inputH.focus();
  inputH.select();
}

// 輸入框：只允許數字，限制 2 字元
function restrictDigits(el) {
  el.value = el.value.replace(/\D/g, '').slice(0, 2);
}
inputH.addEventListener('input', () => restrictDigits(inputH));
inputM.addEventListener('input', () => restrictDigits(inputM));
inputS.addEventListener('input', () => restrictDigits(inputS));

// Enter 或欄位填滿後自動跳到下一個欄位
function bindFieldNav(el, next) {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startCountdown();
    if (e.key.length === 1 && /\d/.test(e.key) && el.value.length >= 2 && next) {
      next.focus();
      next.select();
    }
  });
}
bindFieldNav(inputH, inputM);
bindFieldNav(inputM, inputS);
bindFieldNav(inputS, null);

btnToggle.addEventListener('click', () => (running ? pauseCountdown() : startCountdown()));
btnStop.addEventListener('click', stopCountdown);
btnQuit.addEventListener('click', () => {
  stopCountdown();
  window.close();
});
btnModeDuration.addEventListener('click', () => setMode(MODE.DURATION));
btnModeTarget.addEventListener('click', () => setMode(MODE.TARGET));

// ---- 塔羅運勢 ----
const MAJOR_ARCANA = [
  '愚者', '魔術師', '女祭司', '皇后', '皇帝', '教皇', '戀人', '戰車',
  '力量', '隱者', '命運之輪', '正義', '倒吊人', '死神', '節制', '惡魔',
  '高塔', '星星', '月亮', '太陽', '審判', '世界'
];

const MINOR_RANKS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍者', '騎士', '王后', '國王'];
const MINOR_SUITS = ['權杖', '聖杯', '寶劍', '錢幣'];

function buildDeck() {
  const deck = MAJOR_ARCANA.map((card, idx) => ({ idx, card }));
  let num = MAJOR_ARCANA.length;
  for (const suit of MINOR_SUITS) {
    for (const rank of MINOR_RANKS) {
      deck.push({ idx: num, card: `${suit}${rank}` });
      num++;
    }
  }
  return deck;
}

const FULL_DECK = buildDeck();

const OMEN_KEY = 'tarot.lastDraw';

// 每日重置基準：凌晨 4:00。日期鍵為「目前時間 - 4 小時」的日期字串
function omenDayKey() {
  const d = new Date();
  d.setHours(d.getHours() - 4);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function drawOmen() {
  const deck = [...FULL_DECK];
  // Fisher-Yates 洗牌後取前 3 張，避免重複
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, 3).map(({ idx, card }) => {
    const upright = Math.random() < 0.5;
    return `${idx}-${card}${upright ? '+' : '-'}`;
  });
}

function showOmen() {
  const unlimited = localStorage.getItem('omen.unlimited') === '1';
  const today = omenDayKey();
  statusEl.classList.add('omen');
  if (!unlimited && localStorage.getItem(OMEN_KEY) === today) {
    showStatus('今日已抽過，凌晨 4:00 後可再抽');
    return;
  }
  const cards = drawOmen();
  const joined = cards.join(', ');
  localStorage.setItem(OMEN_KEY, today);
  localStorage.setItem('tarot.lastCards', joined);
  showStatus(joined);
  try {
    window.api.historyAdd({ cards: joined });
  } catch (e) {
    // 歷史記錄寫入失敗不影響抽牌
  }
}

btnOmen.addEventListener('click', showOmen);

// 設定視窗按下「重置今日抽牌機會」時清空紀錄
window.api.onOmenReset(() => {
  localStorage.removeItem(OMEN_KEY);
  localStorage.removeItem('tarot.lastCards');
  statusEl.classList.add('omen');
  showStatus('今日抽牌機會已重置');
});

// 依據窗口尺寸應用緊湊佈局
function applyPresetClass(name) {
  document.body.classList.toggle('compact', name === 'compact');
}

async function init() {
  // 依目前窗口尺寸設定佈局
  try {
    const { current } = await window.api.windowGetCurrentPreset();
    applyPresetClass(current);
  } catch (e) {
    // 忽略
  }
  window.api.onWindowPresetChanged(applyPresetClass);

  // 啟動時從主行程讀取目前時區時間（僅顯示於狀態列，不彈 toast）
  try {
    const t = await window.api.getCurrentTime();
    const d = new Date(t.local);
    const pad = (n) => String(n).padStart(2, '0');
    statusEl.textContent = `啟動於 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} (時區偏移 ${t.timezoneOffsetMinutes} 分)`;
  } catch (e) {
    statusEl.textContent = '無法讀取目前時間';
  }
  updateDisplay();
  inputM.value = '25';
  inputH.focus();
  inputH.select();
}

init();
