let toastTimeout = null;

export function showToast(message, duration = 2400) {
  let toastEl = document.getElementById('toast-notification');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast-notification';
    document.body.appendChild(toastEl);
  }

  toastEl.textContent = message;
  toastEl.classList.add('active');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('active');
  }, duration);
}
