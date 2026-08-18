'use strict';

let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

// 顯示提示彈窗：預設 3 秒後消失；點擊立即關閉
function showToast(message, durationMs) {
  if (!message) return;
  const ttl = durationMs || 3000;
  const container = getToastContainer();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  let timer = null;
  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(timer);
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 300);
  };

  toast.addEventListener('click', dismiss);
  timer = setTimeout(dismiss, ttl);
}