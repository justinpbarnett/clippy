let toastEl: HTMLElement | null = null;
let hideTimer: ReturnType<typeof setTimeout>;

export function showToast(message: string, duration = 1500): void {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className =
      'fixed bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md text-xs ' +
      'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 ' +
      'shadow-lg transition-opacity duration-200 opacity-0 pointer-events-none z-50';
    document.body.appendChild(toastEl);
  }

  clearTimeout(hideTimer);
  toastEl.textContent = message;
  toastEl.classList.remove('opacity-0');
  toastEl.classList.add('opacity-100');

  hideTimer = setTimeout(() => {
    toastEl?.classList.remove('opacity-100');
    toastEl?.classList.add('opacity-0');
  }, duration);
}
