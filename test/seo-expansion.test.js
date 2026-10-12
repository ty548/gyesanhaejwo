import test from 'node:test';
import assert from 'node:assert/strict';
import { tools } from '../src/catalog.js';
import { forms } from '../src/forms.js';
import { calculators } from '../src/calculations.js';
const legacySlugs = ['loan', 'severance', 'salary', 'hourly', 'savings', 'vat', 'dsr-ltv', 'apartment-cost', 'commercial-property', 'exchange', 'date-diff', 'date-offset', 'dday', 'business-days', 'work-time', 'playback-speed', 'work-clock', 'salary-clock', 'calculator'];
test('기존 21개 도구 URL 보존, 코인 계산기 2개 추가, 중복 없음', () => {
  assert.equal(tools.length, 23);
  const slugs = tools.map(t => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of [...legacySlugs, 'salary-reverse', 'discount', 'coin-average', 'coin-profit']) {
    assert.ok(slugs.includes(slug), 'missing ' + slug);
    assert.ok(slug === 'calculator' || typeof calculators[slug] === 'function', 'missing calculation ' + slug);
    if (slug !== 'calculator') assert.ok(Array.isArray(forms[slug]), 'missing form ' + slug);
  }
  assert.equal(slugs.filter(slug => slug.includes('hourly')).length, 1, '주휴수당 페이지는 기존 /hourly/ 재사용');
});
