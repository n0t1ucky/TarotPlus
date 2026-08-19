const toastEl = document.getElementById('toast');

window.api.onToastShow((message) => {
  toastEl.textContent = message;
  const contentWidth = toastEl.getBoundingClientRect().width + 28;
  window.api.resize(contentWidth);
});

toastEl.addEventListener('click', () => {
  window.api.dismiss();
});
