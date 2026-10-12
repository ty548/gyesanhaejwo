import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tools, categories } from '../src/catalog.js';
import { forms } from '../src/forms.js';
const coinSlugs = ['coin-average', 'coin-profit'];
test('코인 계산기 메타데이터·분리된 카테고리·입력 양식', () => {
  assert.ok(categories.some(item => item.id === 'crypto'));
  for (const slug of coinSlugs) {
    const tool = tools.find(item => item.slug === slug);
    assert.equal(tool.category, 'crypto');
    assert.ok(tool.description.length > 35);
    assert.ok(forms[slug]?.length > 3);
  }
});
test('정적 빌더는 별도 코인 모듈을 배포 에셋에 복사하고 코인 페이지 가이드를 제공', async () => {
  const builder = await readFile(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
  assert.match(builder, /'coin\.js', 'app\.js'/);
  assert.match(builder, /'coin-average': \[/);
  assert.match(builder, /'coin-profit': \[/);
  assert.match(builder, /crypto/);
});
