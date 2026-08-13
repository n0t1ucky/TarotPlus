'use strict';

const tokenInput = document.getElementById('api-token');
const btnReset = document.getElementById('btn-reset-omen');
const unlimitedSwitch = document.getElementById('unlimited-switch');
const msg = document.getElementById('msg');

const TOKEN_KEY = 'api.token';
const UNLIMITED_KEY = 'omen.unlimited';

function showMsg(text, isError) {
  msg.textContent = text;
  msg.classList.toggle('error', !!isError);
}

// 載入已儲存的 token
tokenInput.value = localStorage.getItem(TOKEN_KEY) || '';

// 目前僅儲存，暫不設定邏輯
tokenInput.addEventListener('input', () => {
  localStorage.setItem(TOKEN_KEY, tokenInput.value);
});

// 無限抽卡開關
unlimitedSwitch.checked = localStorage.getItem(UNLIMITED_KEY) === '1';
unlimitedSwitch.addEventListener('change', () => {
  localStorage.setItem(UNLIMITED_KEY, unlimitedSwitch.checked ? '1' : '0');
});

btnReset.addEventListener('click', () => {
  try {
    window.api.resetOmen();
    showMsg('今日抽牌機會已重置，可在主視窗重新抽牌');
  } catch (e) {
    showMsg('重置失敗：' + e.message, true);
  }
});