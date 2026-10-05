import test from 'node:test';
import assert from 'node:assert/strict';
import { trustPages } from '../src/trust-pages.js';

test('AdSense 재심사용 신뢰 페이지 5종을 정의', () => {
  assert.deepEqual(trustPages.map(page => page.slug), ['about', 'privacy', 'terms', 'contact', 'calculation-standards']);
  for (const page of trustPages) {
    assert.ok(page.title.length > 1);
    assert.ok(page.description.length > 20);
    assert.ok(page.body.includes('<section'));
  }
});

test('개인정보처리방침은 현재 실제 처리 상태를 설명', () => {
  const privacy = trustPages.find(page => page.slug === 'privacy').body;
  assert.match(privacy, /localStorage/);
  assert.match(privacy, /Google AdSense/);
  assert.match(privacy, /Google Analytics/);
  assert.match(privacy, /Frankfurter/);
});

test('문의 페이지는 공개 채널과 민감정보 주의를 제공', () => {
  const contact = trustPages.find(page => page.slug === 'contact').body;
  assert.match(contact, /github\.com\/ty548\/gyesanhaejwo\/issues/);
  assert.match(contact, /개인정보/);
});
