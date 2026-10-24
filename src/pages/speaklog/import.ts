import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import type { Session, SessionsFile } from '../../lib/types.ts';
import { getCommittedSessions } from '../../data.ts';
import { checkSessions, nextSessionId, sortSessions } from '../../lib/session-checks.ts';
import type { Finding } from '../../lib/sensitive.ts';
import { href } from '../../base.ts';
import { speaklogHead } from '../../components/ui.ts';
import { formatDataFile, hideOutput, outputPanel, showOutput } from '../../components/json-output.ts';
import { addLocalSessions, clearLocalSessions, getLocalSessions } from '../../local-preview.ts';
import { activityCard } from './shared.ts';
import commonSchema from '../../../schemas/common.schema.json';
import sessionCardSchema from '../../../schemas/session-card.schema.json';

/** The example from the project brief. Format reference only; it is not real data. */
const EXAMPLE: Session = {
  id: '2026-10-23-001',
  date: '2026-10-23',
  type: 'speaking',
  duration_min: 18,
  topic: 'Australia trip',
  scores: { fluency: 3.2, grammar: 3.5, vocabulary: 3.4, communication: 4.0 },
  strength: 'Continuous storytelling',
  focus: 'Past tense consistency',
  corrections: [{ said: 'I very enjoy Sydney.', natural: 'I really enjoyed Sydney.', tag: 'past-tense' }],
  new_phrases: ['The highlight of the trip was...'],
  coach_note: 'Try telling longer stories without translating from Thai first.',
};

function compileValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  ajv.addSchema(commonSchema);
  return ajv.compile<Session>(sessionCardSchema);
}

const page: PageHandler = async ({ today }) => {
  const committed = await getCommittedSessions();
  const localCount = getLocalSessions().length;

  return {
    title: 'Import a Session Card · SPEAKLOG',
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog/import', 'Import a Session Card', 'Paste a Session Card, check it against the schema, preview it, and get the merged JSON to commit.')}
      <div class="banner" role="note"><span><strong>This page does not publish anything.</strong> The public site changes only when you commit the merged file to <span class="code">data/speaklog/sessions.json</span> and the GitHub Action deploys it.</span></div>
      <ol class="steps" style="list-style:none;padding:0;margin:0">
        <li class="step">
          <div class="field">
            <label for="card-input">Session Card JSON (one card, or an array of cards)</label>
            <span class="hint" id="card-hint">Scores are 0–5. Required: id (date-NNN), date, type, duration_min, topic. Next free id for today: <span class="code">${nextSessionId(today, committed)}</span>. Schema: <a href="${href('/about')}#session-card">Session Card format</a>.</span>
            <textarea id="card-input" aria-describedby="card-hint" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
          </div>
          <div class="btn-row mt">
            <button class="btn primary" type="button" data-action="validate">Validate and preview</button>
            <button class="btn" type="button" data-action="example">Load example</button>
            <button class="btn" type="button" data-action="clear">Clear</button>
          </div>
        </li>
        <li class="step"><h2 style="font-size:1.2rem;margin-bottom:8px">Check</h2><div id="check" class="stack" aria-live="polite"><p class="note">Results appear here.</p></div></li>
        <li class="step"><h2 style="font-size:1.2rem;margin-bottom:8px">Preview</h2><div id="preview" class="feed"><p class="note">A valid card is previewed here exactly as it will look in the feed.</p></div></li>
        <li class="step">
          <h2 style="font-size:1.2rem;margin-bottom:8px">Merged sessions.json</h2>
          <p class="note" style="margin-bottom:10px">Replace <span class="code">data/speaklog/sessions.json</span> with this, then commit and push. ${committed.length} committed session(s) + the new card(s), sorted by date.</p>
          ${outputPanel('merged-output', 'sessions.json', 'Merged sessions.json')}
        </li>
        <li class="step">
          <h2 style="font-size:1.2rem;margin-bottom:8px">Optional: preview on this device</h2>
          <p class="note" style="margin-bottom:10px">Stores the card in this browser only (localStorage) so you can see it on the dashboard before committing. Other visitors never see it.</p>
          <div class="btn-row"><button class="btn" type="button" data-action="local" disabled>Preview on this device</button>
          <button class="btn" type="button" data-action="clear-local" ${localCount ? '' : html`disabled`}>Clear local preview (${localCount})</button></div>
          <p class="note mt" role="status" data-local-status></p>
        </li>
      </ol>
    `,
    mount(root) {
      const input = root.querySelector<HTMLTextAreaElement>('#card-input');
      const check = root.querySelector<HTMLElement>('#check');
      const preview = root.querySelector<HTMLElement>('#preview');
      const localBtn = root.querySelector<HTMLButtonElement>('[data-action="local"]');
      const clearLocalBtn = root.querySelector<HTMLButtonElement>('[data-action="clear-local"]');
      const localStatus = root.querySelector<HTMLElement>('[data-local-status]');
      if (!input || !check || !preview || !localBtn || !clearLocalBtn) return;
      let validate: ReturnType<typeof compileValidator> | undefined;
      let validCards: Session[] = [];

      const showFindings = (title: string, findings: Finding[], ok: boolean) => {
        const errors = findings.filter((f) => f.level === 'error');
        const warnings = findings.filter((f) => f.level === 'warning');
        check.innerHTML = html`<div class="result ${ok ? 'ok' : 'err'}">
          <strong>${title}</strong>
          ${errors.length ? html`<ul>${errors.map((f) => html`<li><span class="code">${f.path}</span> ${f.message}</li>`)}</ul>` : ''}
          ${warnings.length ? html`<p class="mt"><strong>Warnings</strong></p><ul>${warnings.map((f) => html`<li><span class="code">${f.path}</span> ${f.message}</li>`)}</ul>` : ''}
        </div>`.value;
      };

      const reset = () => {
        validCards = [];
        localBtn.disabled = true;
        preview.innerHTML = '<p class="note">A valid card is previewed here exactly as it will look in the feed.</p>';
        hideOutput(root, 'merged-output');
      };

      const run = () => {
        reset();
        const text = input.value.trim();
        if (!text) {
          showFindings('Paste a Session Card first.', [], false);
          return;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch (error) {
          showFindings('This is not valid JSON.', [{ level: 'error', path: '$', message: error instanceof Error ? error.message : String(error) }], false);
          return;
        }
        const cards: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
        if (!cards.length) {
          showFindings('The array is empty.', [], false);
          return;
        }
        validate ??= compileValidator();
        const findings: Finding[] = [];
        cards.forEach((card, i) => {
          if (!validate!(card)) {
            for (const e of validate!.errors ?? []) {
              const extra = e.keyword === 'additionalProperties' ? ` "${String((e.params as { additionalProperty?: string }).additionalProperty)}"` : e.keyword === 'enum' ? `: ${((e.params as { allowedValues?: unknown[] }).allowedValues ?? []).join(', ')}` : '';
              const pointer = e.instancePath.split('/').slice(1).map((seg) => (/^\d+$/.test(seg) ? `[${seg}]` : `.${seg}`)).join('');
              findings.push({ level: 'error', path: `$[${i}]${pointer}`, message: `${e.message ?? 'is invalid'}${extra}` });
            }
          }
        });
        if (findings.some((f) => f.level === 'error')) {
          showFindings(`Schema check failed (${findings.length} problem${findings.length === 1 ? '' : 's'}).`, findings, false);
          return;
        }
        const typed = cards as Session[];
        findings.push(...checkSessions(typed, committed, today));
        if (findings.some((f) => f.level === 'error')) {
          showFindings('The card matches the schema, but there are problems to fix.', findings, false);
          return;
        }
        validCards = typed;
        showFindings(`Valid: ${typed.length} card${typed.length === 1 ? '' : 's'}.`, findings, true);
        preview.innerHTML = typed.map((c) => activityCard(c, false, { link: false, level: 3 }).value).join('');
        const merged: SessionsFile & { $schema: string } = {
          $schema: '../../schemas/sessions.schema.json',
          schema_version: 1,
          sessions: sortSessions([...committed, ...typed]),
        };
        showOutput(root, 'merged-output', formatDataFile(merged), 'sessions.json');
        localBtn.disabled = false;
      };

      root.querySelector('[data-action="validate"]')?.addEventListener('click', run);
      root.querySelector('[data-action="example"]')?.addEventListener('click', () => {
        input.value = JSON.stringify(EXAMPLE, null, 2);
        reset();
        check.innerHTML = '<p class="note">Example loaded. It is the format reference from the project brief, not a real session. Press “Validate and preview”.</p>';
        input.focus();
      });
      root.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
        input.value = '';
        reset();
        check.innerHTML = '<p class="note">Results appear here.</p>';
        input.focus();
      });
      localBtn.addEventListener('click', () => {
        if (!validCards.length) return;
        addLocalSessions(validCards);
        const n = getLocalSessions().length;
        clearLocalBtn.disabled = false;
        clearLocalBtn.textContent = `Clear local preview (${n})`;
        if (localStatus) localStatus.innerHTML = html`Saved on this device only. <a href="${href('/speaklog')}">Open the dashboard</a> to see it with a “Local preview” label.`.value;
      });
      clearLocalBtn.addEventListener('click', () => {
        clearLocalSessions();
        clearLocalBtn.disabled = true;
        clearLocalBtn.textContent = 'Clear local preview (0)';
        if (localStatus) localStatus.textContent = 'Local preview cleared.';
      });
    },
  };
};

export default page;
