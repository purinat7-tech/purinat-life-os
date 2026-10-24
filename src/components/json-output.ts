import { html, type SafeHtml } from '../lib/html.ts';
import { icons } from './icons.ts';

/** Read-only output with Copy and Download buttons. Nothing is sent anywhere. */
export function outputPanel(id: string, filename: string, label: string): SafeHtml {
  return html`<div class="stack" id="${id}" hidden>
    <div class="btn-row">
      <button class="btn primary" type="button" data-copy>${icons.copy} Copy JSON</button>
      <button class="btn" type="button" data-download>${icons.download} Download ${filename}</button>
    </div>
    <pre class="output" tabindex="0" aria-label="${label}"><code></code></pre>
    <p class="note" role="status" data-status></p>
  </div>`;
}

export function showOutput(root: HTMLElement, id: string, text: string, filename: string): void {
  const panel = root.querySelector<HTMLElement>(`#${id}`);
  if (!panel) return;
  panel.hidden = false;
  const code = panel.querySelector('code');
  if (code) code.textContent = text;
  const status = panel.querySelector<HTMLElement>('[data-status]');
  const say = (msg: string) => {
    if (status) status.textContent = msg;
  };
  say('');

  const copy = panel.querySelector<HTMLButtonElement>('[data-copy]');
  const download = panel.querySelector<HTMLButtonElement>('[data-download]');
  if (copy) {
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(text);
        say('Copied. Paste it into the file in your repository and commit.');
      } catch {
        const range = document.createRange();
        if (code) range.selectNodeContents(code);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        say('Copy was blocked by the browser. The text is selected: press Ctrl+C / ⌘C.');
      }
    };
  }
  if (download) {
    download.onclick = () => {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say(`Downloaded ${filename}. Replace the file in your repository and commit.`);
    };
  }
}

export function hideOutput(root: HTMLElement, id: string): void {
  const panel = root.querySelector<HTMLElement>(`#${id}`);
  if (panel) panel.hidden = true;
}

/** Formats a data file the same way as the files in /data (2 spaces + final newline). */
export function formatDataFile(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
