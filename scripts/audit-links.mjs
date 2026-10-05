import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tools } from '../src/catalog.js';
import { trustPages } from '../src/trust-pages.js';

const dist = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const home = await readFile(path.join(dist, 'index.html'), 'utf8');
let checked = 0;
const slugs = ['', ...tools.map(tool => tool.slug), ...trustPages.map(page => page.slug)];
for (const slug of slugs) {
  const page = await readFile(path.join(dist, slug, 'index.html'), 'utf8');
  for (const [, href] of page.matchAll(/href="(\/[^"?]*)"/g)) {
    const [pathname, anchor] = href.split('#');
    const file = pathname.endsWith('/') ? path.join(dist, pathname, 'index.html') : path.join(dist, pathname);
    assert.ok((await stat(file)).isFile(), `${slug || 'home'}: ${href} 대상 없음`);
    if (anchor) {
      const target = pathname === '/' ? home : await readFile(file, 'utf8');
      assert.ok(target.includes(`id="${anchor}"`), `${slug || 'home'}: ${href} 앵커 없음`);
    }
    checked++;
  }
}
console.log(`Internal link audit PASS: ${checked} links across ${slugs.length} pages.`);
