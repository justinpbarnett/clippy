import { sendMessage } from '../../lib/messages';
import { MessageType } from '../../lib/types';
import type { Store } from '../../lib/store';
import type { PopupState } from '../state';
import { showToast } from './Toast';

export interface SnippetEditorElement extends HTMLElement {
  show: () => void;
  hide: () => void;
}

export function renderSnippetEditor(
  container: HTMLElement,
  store: Store<PopupState>,
  onSaved: () => void,
): SnippetEditorElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'hidden px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50';

  const form = document.createElement('form');
  form.className = 'flex flex-col gap-2';

  const row = document.createElement('div');
  row.className = 'flex gap-2';

  const shortcutInput = document.createElement('input');
  shortcutInput.type = 'text';
  shortcutInput.placeholder = ':shortcut';
  shortcutInput.className =
    'w-24 px-2 py-1 rounded text-xs bg-white dark:bg-gray-700 ' +
    'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none ' +
    'focus:border-blue-500 font-mono';

  const contentInput = document.createElement('input');
  contentInput.type = 'text';
  contentInput.placeholder = 'Expansion text';
  contentInput.className =
    'flex-1 px-2 py-1 rounded text-xs bg-white dark:bg-gray-700 ' +
    'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none ' +
    'focus:border-blue-500';

  row.appendChild(shortcutInput);
  row.appendChild(contentInput);

  const btnRow = document.createElement('div');
  btnRow.className = 'flex justify-end gap-2';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300';
  cancelBtn.addEventListener('click', () => hide());

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.textContent = 'Save';
  saveBtn.className =
    'px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(saveBtn);

  form.appendChild(row);
  form.appendChild(btnRow);
  wrapper.appendChild(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const shortcut = shortcutInput.value.trim();
    const content = contentInput.value.trim();

    if (!shortcut || !content) return;

    const finalShortcut = shortcut.startsWith(':') ? shortcut : ':' + shortcut;

    await sendMessage({
      type: MessageType.SAVE_SNIPPET,
      payload: { shortcut: finalShortcut, content },
    });

    showToast('Snippet saved');
    shortcutInput.value = '';
    contentInput.value = '';
    hide();
    onSaved();
  });

  function show() {
    wrapper.classList.remove('hidden');
    requestAnimationFrame(() => shortcutInput.focus());
  }

  function hide() {
    wrapper.classList.add('hidden');
    shortcutInput.value = '';
    contentInput.value = '';
  }

  // Show editor when on snippets tab (via a button)
  store.subscribe((state) => {
    if (state.activeTab !== 'snippets') hide();
  });

  container.appendChild(wrapper);

  const el = wrapper as unknown as SnippetEditorElement;
  el.show = show;
  el.hide = hide;
  return el;
}
