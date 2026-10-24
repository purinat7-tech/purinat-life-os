import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, safeExternalUrl } from '../src/lib/html.ts';
import { normalizePath } from '../src/lib/routes.ts';

test('html escapes interpolated data', () => {
  const memory = '<img src=x onerror="alert(1)"> & "quotes"';
  assert.equal(html`<p title="${memory}">${memory}</p>`.value, '<p title="&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &quot;quotes&quot;">&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &quot;quotes&quot;</p>');
  assert.equal(html`${['a', html`<b>b</b>`, null, false]}`.value, 'a<b>b</b>');
  assert.equal(html`${raw('<svg></svg>')}`.value, '<svg></svg>');
});

test('only http(s) links from data are rendered', () => {
  assert.equal(safeExternalUrl('https://en.wikipedia.org/wiki/Hornby_Lighthouse'), 'https://en.wikipedia.org/wiki/Hornby_Lighthouse');
  assert.equal(safeExternalUrl('javascript:alert(1)'), null);
  assert.equal(safeExternalUrl(undefined), null);
});

test('route paths are normalised', () => {
  assert.equal(normalizePath('/speaklog/import/'), '/speaklog/import');
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath('/miles/index.html'), '/miles');
  assert.equal(normalizePath('/miles?trip=x#y'), '/miles');
});
