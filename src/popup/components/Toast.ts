let toastEl: HTMLElement | null = null;
let hideTimer: ReturnType<typeof setTimeout>;

export function showToast(message: string, duration = 1500): void {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'jar-toast';
    toastEl.style.opacity = '0';
    document.body.appendChild(toastEl);
  }

  clearTimeout(hideTimer);
  toastEl.textContent = message;
  toastEl.style.opacity = '1';

  hideTimer = setTimeout(() => {
    if (toastEl) toastEl.style.opacity = '0';
  }, duration);
}
