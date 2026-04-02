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
  wrapper.className = 'jar-editor hidden';

  const form = document.createElement('form');

  const row = document.createElement('div');
  row.className = 'jar-editor-row';

  const shortcutInput = document.createElement('input');
  shortcutInput.type = 'text';
  shortcutInput.placeholder = ':shortcut';
  shortcutInput.className = 'jar-input jar-input-shortcut';

  const contentInput = document.createElement('input');
  contentInput.type = 'text';
  contentInput.placeholder = 'Expansion text';
  contentInput.className = 'jar-input jar-input-expand';

  row.appendChild(shortcutInput);
  row.appendChild(contentInput);

  const btnRow = document.createElement('div');
  btnRow.className = 'jar-editor-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'jar-btn-cancel';
  cancelBtn.addEventListener('click', () => hide());

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.textContent = 'Save';
  saveBtn.className = 'jar-btn-save';

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

  store.subscribe((state) => {
    if (state.activeTab !== 'snippets') hide();
  });

  container.appendChild(wrapper);

  const el = wrapper as unknown as SnippetEditorElement;
  el.show = show;
  el.hide = hide;
  return el;
}
