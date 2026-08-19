'use strict';

// 顯示提示彈窗：改為獨立通知視窗顯示，避免主視窗過小被裁切。
// 自動消失（預設 3 秒）與點擊關閉皆由通知視窗端處理。
function showToast(message, durationMs) {
  if (!message) return;
  const ttl = durationMs || 3000;
  try {
    window.api.showToast(message, ttl);
  } catch (e) {
    // IPC 不可用時靜默失敗，不影響主流程
  }
}
