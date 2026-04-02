import { MessageType, type UserSettings, type ClipEntry } from '../lib/types';
import { DEFAULT_SETTINGS, MAX_CONTENT_LENGTH } from '../lib/constants';
import { sendMessage } from '../lib/messages';

const root = document.getElementById('app')!;

async function init() {
  const settings = await sendMessage<UserSettings>({
    type: MessageType.GET_SETTINGS,
    payload: undefined,
  });

  root.innerHTML = '';
  root.className = 'max-w-lg mx-auto p-6 font-sans';

  const title = document.createElement('h1');
  title.textContent = 'Clippy Settings';
  title.className = 'text-2xl font-bold mb-6 text-gray-900';
  root.appendChild(title);

  // Settings form
  const form = document.createElement('div');
  form.className = 'space-y-4';

  addNumberSetting(form, 'Max clipboard history', 'maxHistory', settings.maxHistory, 100, 10000);
  addSelectSetting(form, 'Theme', 'theme', settings.theme, [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ]);
  addToggleSetting(form, 'Skip password fields', 'skipPasswordFields', settings.skipPasswordFields);
  addToggleSetting(form, 'Enable snippet expansion', 'enableSnippetExpansion', settings.enableSnippetExpansion);
  addToggleSetting(form, 'Track source URLs', 'enableSourceTracking', settings.enableSourceTracking);
  addSelectSetting(form, 'Default tab', 'defaultTab', settings.defaultTab, [
    { value: 'all', label: 'All' },
    { value: 'favorites', label: 'Favorites' },
    { value: 'snippets', label: 'Snippets' },
  ]);

  root.appendChild(form);

  // Import/Export section
  const ieSection = document.createElement('div');
  ieSection.className = 'mt-8 pt-6 border-t border-gray-200';

  const ieTitle = document.createElement('h2');
  ieTitle.textContent = 'Data';
  ieTitle.className = 'text-lg font-semibold mb-4 text-gray-900';
  ieSection.appendChild(ieTitle);

  const btnRow = document.createElement('div');
  btnRow.className = 'flex gap-3';

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export All Data';
  exportBtn.className = 'px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600';
  exportBtn.addEventListener('click', handleExport);

  const importBtn = document.createElement('button');
  importBtn.textContent = 'Import Data';
  importBtn.className = 'px-4 py-2 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300';
  importBtn.addEventListener('click', handleImport);

  btnRow.appendChild(exportBtn);
  btnRow.appendChild(importBtn);
  ieSection.appendChild(btnRow);

  const statusEl = document.createElement('p');
  statusEl.id = 'ie-status';
  statusEl.className = 'mt-2 text-sm text-gray-500';
  ieSection.appendChild(statusEl);

  root.appendChild(ieSection);
}

function addNumberSetting(container: HTMLElement, label: string, key: string, value: number, min: number, max: number) {
  const row = createSettingRow(label);
  const input = document.createElement('input');
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.className = 'w-24 px-2 py-1 border border-gray-300 rounded text-sm';
  input.addEventListener('change', () => {
    const num = Math.max(min, Math.min(max, parseInt(input.value) || DEFAULT_SETTINGS.maxHistory));
    saveSetting(key, num);
  });
  row.appendChild(input);
  container.appendChild(row);
}

function addSelectSetting(container: HTMLElement, label: string, key: string, value: string, options: { value: string; label: string }[]) {
  const row = createSettingRow(label);
  const select = document.createElement('select');
  select.className = 'px-2 py-1 border border-gray-300 rounded text-sm';
  for (const opt of options) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    option.selected = opt.value === value;
    select.appendChild(option);
  }
  select.addEventListener('change', () => saveSetting(key, select.value));
  row.appendChild(select);
  container.appendChild(row);
}

function addToggleSetting(container: HTMLElement, label: string, key: string, value: boolean) {
  const row = createSettingRow(label);
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  input.className = 'w-4 h-4 accent-blue-500';
  input.addEventListener('change', () => saveSetting(key, input.checked));
  row.appendChild(input);
  container.appendChild(row);
}

function createSettingRow(label: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'flex items-center justify-between';
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.className = 'text-sm text-gray-700';
  row.appendChild(labelEl);
  return row;
}

async function saveSetting(key: string, value: unknown) {
  await sendMessage({ type: MessageType.UPDATE_SETTINGS, payload: { [key]: value } as Partial<UserSettings> });
}

async function handleExport() {
  const data = await sendMessage<{ clips: ClipEntry[]; settings: UserSettings; clipCount: number }>({
    type: MessageType.EXPORT_DATA,
    payload: undefined,
  });
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clippy-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  const status = document.getElementById('ie-status');
  if (status) status.textContent = `Exported ${data.clipCount} clips`;
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') throw new Error('Invalid backup file');
      if (!Array.isArray(data.clips)) throw new Error('Invalid backup: missing clips array');
      data.clips = data.clips.map((c: ClipEntry) => ({
        ...c,
        content: typeof c.content === 'string' ? c.content.slice(0, MAX_CONTENT_LENGTH) : '',
      }));

      const result = await sendMessage<{ imported: number }>({
        type: MessageType.IMPORT_DATA,
        payload: { clips: data.clips, settings: data.settings },
      });

      const status = document.getElementById('ie-status');
      if (status) status.textContent = `Imported ${result.imported} new clips`;
    } catch (err) {
      const status = document.getElementById('ie-status');
      if (status) status.textContent = `Import failed: ${err}`;
    }
  });
  input.click();
}

init();
