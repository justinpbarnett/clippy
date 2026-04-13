import { MessageType, type UserSettings, type ClipEntry } from '../lib/types';
import { DEFAULT_SETTINGS, MAX_CONTENT_LENGTH } from '../lib/constants';
import { sendMessage } from '../lib/messages';
import { applyTextSize } from '../lib/text-size';

const root = document.getElementById('app')!;

const STYLE = `
  *,*::before,*::after{box-sizing:border-box}
  :root{
    --j-surface:#0D0A06;--j-glass:#141009;--j-raised:#1C1509;
    --j-border:#2C1D0A;--j-amber:#C87A38;--j-gold:#E8A848;
    --j-cream:#EED9B5;--j-muted:#9A7A52;--j-dim:#5A4030;
    --j-text-scale:1;
  }
  :root[data-clipjar-text-size='large']{--j-text-scale:1.2}
  :root[data-clipjar-text-size='x-large']{--j-text-scale:1.35}
  body{
    background:var(--j-surface);color:var(--j-cream);margin:0;
    font-family:ui-sans-serif,system-ui,sans-serif;
    font-size:calc(14px * var(--j-text-scale));-webkit-font-smoothing:antialiased;
    min-height:100vh;
  }
  .opts-wrap{max-width:480px;margin:0 auto;padding:40px 24px 60px}
  .opts-header{display:flex;align-items:center;gap:10px;margin-bottom:40px;padding-bottom:20px;border-bottom:1px solid var(--j-border)}
  .opts-logo{display:flex;align-items:center;gap:8px}
  .opts-jar{color:var(--j-amber)}
  .opts-wordmark{font-size:calc(15px * var(--j-text-scale));font-weight:700;color:var(--j-amber);letter-spacing:0.14em;text-transform:uppercase}
  .opts-title{font-size:calc(11px * var(--j-text-scale));color:var(--j-dim);letter-spacing:0.12em;text-transform:uppercase;margin-left:auto}
  .opts-section{margin-bottom:32px}
  .opts-section-label{font-size:calc(9.5px * var(--j-text-scale));font-weight:700;color:var(--j-gold);letter-spacing:0.14em;text-transform:uppercase;margin-bottom:14px}
  .opts-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--j-border)}
  .opts-row:last-child{border-bottom:none}
  .opts-row-label{font-size:calc(13px * var(--j-text-scale));color:var(--j-cream)}
  .opts-input{
    background:var(--j-raised);border:1px solid var(--j-border);border-radius:3px;
    padding:5px 10px;color:var(--j-cream);font-size:calc(12px * var(--j-text-scale));font-family:ui-monospace,monospace;
    outline:none;transition:border-color 0.15s;
  }
  .opts-input:focus{border-color:var(--j-amber)}
  .opts-input-num{width:80px;text-align:center}
  .opts-select{
    background:var(--j-raised);border:1px solid var(--j-border);border-radius:3px;
    padding:5px 10px;color:var(--j-cream);font-size:calc(12px * var(--j-text-scale));font-family:inherit;
    outline:none;cursor:pointer;transition:border-color 0.15s;
  }
  .opts-select:focus{border-color:var(--j-amber)}
  .opts-toggle{position:relative;width:calc(36px * var(--j-text-scale));height:calc(20px * var(--j-text-scale));cursor:pointer}
  .opts-toggle input{opacity:0;width:0;height:0;position:absolute}
  .opts-toggle-track{
    position:absolute;inset:0;border-radius:calc(10px * var(--j-text-scale));background:var(--j-border);
    transition:background 0.2s;
  }
  .opts-toggle input:checked ~ .opts-toggle-track{background:var(--j-amber)}
  .opts-toggle-thumb{
    position:absolute;top:calc(3px * var(--j-text-scale));left:calc(3px * var(--j-text-scale));width:calc(14px * var(--j-text-scale));height:calc(14px * var(--j-text-scale));border-radius:50%;
    background:var(--j-dim);transition:transform 0.2s,background 0.2s;
  }
  .opts-toggle input:checked ~ .opts-toggle-thumb{transform:translateX(calc(16px * var(--j-text-scale)));background:var(--j-surface)}
  .opts-btn{
    padding:8px 18px;font-size:calc(11px * var(--j-text-scale));font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
    border-radius:2px;border:none;cursor:pointer;transition:background 0.15s;font-family:inherit;
  }
  .opts-btn-primary{background:var(--j-amber);color:var(--j-surface)}
  .opts-btn-primary:hover{background:var(--j-gold)}
  .opts-btn-ghost{background:var(--j-glass);color:var(--j-muted);border:1px solid var(--j-border)}
  .opts-btn-ghost:hover{border-color:var(--j-amber);color:var(--j-cream)}
  .opts-status{margin-top:10px;font-size:calc(11px * var(--j-text-scale));color:var(--j-muted);font-family:ui-monospace,monospace;min-height:18px}
`;

async function init() {
  const savedSettings = await sendMessage<Partial<UserSettings> | null>({
    type: MessageType.GET_SETTINGS,
    payload: undefined,
  });
  const settings = { ...DEFAULT_SETTINGS, ...(savedSettings ?? {}) };

  // Inject styles
  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);
  applyTextSize(settings.textSize);

  root.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'opts-wrap';

  // Header
  const header = document.createElement('div');
  header.className = 'opts-header';
  header.innerHTML = `
    <div class="opts-logo">
      <svg class="opts-jar" width="14" height="18" viewBox="0 0 13 17" fill="none">
        <rect x="2" y="0.5" width="9" height="2.5" rx="0.8" fill="currentColor" opacity="0.85"/>
        <rect x="3.5" y="3" width="6" height="1.5" fill="currentColor" opacity="0.55"/>
        <path d="M1.5 4.5L1 14Q1 15.5 2.5 15.5H10.5Q12 15.5 12 14L11.5 4.5Z" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-opacity="0.65" stroke-width="0.9"/>
        <line x1="3.5" y1="6" x2="3" y2="13.5" stroke="currentColor" stroke-width="0.9" opacity="0.25" stroke-linecap="round"/>
      </svg>
      <span class="opts-wordmark">Clipjar</span>
    </div>
    <span class="opts-title">Settings</span>
  `;
  wrap.appendChild(header);

  // Preferences section
  const prefsSection = document.createElement('div');
  prefsSection.className = 'opts-section';
  const prefsLabel = document.createElement('div');
  prefsLabel.className = 'opts-section-label';
  prefsLabel.textContent = 'Preferences';
  prefsSection.appendChild(prefsLabel);

  addNumberSetting(prefsSection, 'Max clipboard history', 'maxHistory', settings.maxHistory, 100, 10000);
  addSelectSetting(prefsSection, 'Theme', 'theme', settings.theme, [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ]);
  addSelectSetting(prefsSection, 'Text size', 'textSize', settings.textSize, [
    { value: 'normal', label: 'Default' },
    { value: 'large', label: 'Large' },
    { value: 'x-large', label: 'Extra large' },
  ]);
  addSelectSetting(prefsSection, 'Default tab', 'defaultTab', settings.defaultTab, [
    { value: 'all', label: 'All' },
    { value: 'favorites', label: 'Favorites' },
    { value: 'snippets', label: 'Snippets' },
  ]);
  wrap.appendChild(prefsSection);

  // Behavior section
  const behaviorSection = document.createElement('div');
  behaviorSection.className = 'opts-section';
  const behaviorLabel = document.createElement('div');
  behaviorLabel.className = 'opts-section-label';
  behaviorLabel.textContent = 'Behavior';
  behaviorSection.appendChild(behaviorLabel);

  addToggleSetting(behaviorSection, 'Skip password fields', 'skipPasswordFields', settings.skipPasswordFields);
  addToggleSetting(behaviorSection, 'Enable snippet expansion', 'enableSnippetExpansion', settings.enableSnippetExpansion);
  addToggleSetting(behaviorSection, 'Track source URLs', 'enableSourceTracking', settings.enableSourceTracking);
  wrap.appendChild(behaviorSection);

  // Data section
  const dataSection = document.createElement('div');
  dataSection.className = 'opts-section';
  const dataLabel = document.createElement('div');
  dataLabel.className = 'opts-section-label';
  dataLabel.textContent = 'Data';
  dataSection.appendChild(dataLabel);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px';

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export All';
  exportBtn.className = 'opts-btn opts-btn-primary';
  exportBtn.addEventListener('click', () => handleExport(statusEl));

  const importBtn = document.createElement('button');
  importBtn.textContent = 'Import';
  importBtn.className = 'opts-btn opts-btn-ghost';
  importBtn.addEventListener('click', () => handleImport(statusEl));

  btnRow.appendChild(exportBtn);
  btnRow.appendChild(importBtn);
  dataSection.appendChild(btnRow);

  const statusEl = document.createElement('p');
  statusEl.id = 'ie-status';
  statusEl.className = 'opts-status';
  dataSection.appendChild(statusEl);

  wrap.appendChild(dataSection);
  root.appendChild(wrap);
}

function addNumberSetting(container: HTMLElement, label: string, key: string, value: number, min: number, max: number) {
  const row = createRow(label);
  const input = document.createElement('input');
  input.type = 'number';
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  input.className = 'opts-input opts-input-num';
  input.addEventListener('change', () => {
    const num = Math.max(min, Math.min(max, parseInt(input.value) || DEFAULT_SETTINGS.maxHistory));
    saveSetting(key, num);
  });
  row.appendChild(input);
  container.appendChild(row);
}

function addSelectSetting(container: HTMLElement, label: string, key: string, value: string, options: { value: string; label: string }[]) {
  const row = createRow(label);
  const select = document.createElement('select');
  select.className = 'opts-select';
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
  const row = createRow(label);
  const toggle = document.createElement('label');
  toggle.className = 'opts-toggle';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  input.addEventListener('change', () => saveSetting(key, input.checked));
  const track = document.createElement('span');
  track.className = 'opts-toggle-track';
  const thumb = document.createElement('span');
  thumb.className = 'opts-toggle-thumb';
  toggle.appendChild(input);
  toggle.appendChild(track);
  toggle.appendChild(thumb);
  row.appendChild(toggle);
  container.appendChild(row);
}

function createRow(label: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'opts-row';
  const labelEl = document.createElement('span');
  labelEl.textContent = label;
  labelEl.className = 'opts-row-label';
  row.appendChild(labelEl);
  return row;
}

async function saveSetting(key: string, value: unknown) {
  if (key === 'textSize') applyTextSize(value);
  await sendMessage({ type: MessageType.UPDATE_SETTINGS, payload: { [key]: value } as Partial<UserSettings> });
}

async function handleExport(statusEl: HTMLElement) {
  const data = await sendMessage<{ clips: ClipEntry[]; settings: UserSettings; clipCount: number }>({
    type: MessageType.EXPORT_DATA,
    payload: undefined,
  });
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clipjar-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  statusEl.textContent = `Exported ${data.clipCount} clips`;
}

function handleImport(statusEl: HTMLElement) {
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
      if (data.settings && typeof data.settings === 'object' && 'textSize' in data.settings) {
        applyTextSize((data.settings as Partial<UserSettings>).textSize);
      }
      statusEl.textContent = `Imported ${result.imported} new clips`;
    } catch (err) {
      statusEl.textContent = `Import failed: ${err instanceof Error ? err.message : 'unknown error'}`;
    }
  });
  input.click();
}

init();
