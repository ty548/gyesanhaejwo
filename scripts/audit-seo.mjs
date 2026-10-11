import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tools, categories } from '../src/catalog.js';
import { trustPages } from '../src/trust-pages.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = path.join(root, 'dist');
const read = file => readFile(path.join(dist, file), 'utf8');
const sitemap = await read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const origin = 'https://calc.memorimap.kr';
const expected = ['/', ...tools.map(tool => `/${tool.slug}/`), ...trustPages.map(page => `/${page.slug}/`)];
assert.equal(new Set(tools.map(tool => tool.slug)).size, tools.length, 'duplicate calculator slug');
assert.equal(tools.length, 21, 'existing 19 calculators plus exactly two new calculators');
assert.equal(expected.length, 27, 'existing 25 URLs plus exactly two new URLs');
for (const slug of ['salary', 'hourly', 'calculator', 'salary-reverse', 'discount']) assert.ok(expected.includes(`/${slug}/`), `missing required slug: ${slug}`);
assert.equal(urls.length, expected.length);
assert.deepEqual(new Set(urls), new Set(expected.map(url => origin + url)));
assert.ok(!sitemap.includes('gyesanhaejwo.vercel.app'), 'old domain remains in sitemap');

const schemaOf = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(match => JSON.parse(match[1]));
const home = await read('index.html');
assert.match(home, /<h1>무료 온라인 <em>계산기<\/em><\/h1>/);
assert.match(home, /<meta name="google-site-verification" content="M87cSaYmzx1g5y_fo6LFVriQayr94mz8lCJIzb09aq4">/);
const naverVerificationTag = '<meta name="naver-site-verification" content="8477e7e34e2c7a87d3f245841051d52404cc2e48">';
const adsenseVerificationTag = '<meta name="google-adsense-account" content="ca-pub-4865485908744524">';
assert.equal(home.split(naverVerificationTag).length - 1, 1, 'Naver verification tag must appear exactly once');
assert.ok(home.indexOf(naverVerificationTag) < home.indexOf('</head>'), 'Naver verification tag must be in head');
assert.equal(home.split(adsenseVerificationTag).length - 1, 1, 'AdSense verification tag must appear exactly once on home');
for (const page of trustPages) assert.ok(home.includes(`href="/${page.slug}/"`), `home: footer link missing for ${page.slug}`);
assert.match(home, new RegExp(`<link rel="canonical" href="${origin}/"`));
assert.ok(home.includes(`<meta property="og:url" content="${origin}/"`));
assert.match(home, /href="\/calculator\/"/);
assert.ok(!home.includes('gyesanhaejwo.vercel.app'), 'old domain remains on home page');
const [website] = schemaOf(home);
assert.equal(website['@type'], 'WebSite');
assert.equal(website.name, '계산해줘');
assert.equal(website.url, origin + '/');

for (const tool of tools) {
  const html = await read(path.join(tool.slug, 'index.html'));
  const url = `${origin}/${tool.slug}/`;
  const category = categories.find(item => item.id === tool.category);
  assert.ok(category, `${tool.slug}: category missing`);
  assert.ok(html.includes(`<link rel="canonical" href="${url}"`), `${tool.slug}: canonical missing`);
  assert.ok(html.includes(`<meta property="og:url" content="${url}"`), `${tool.slug}: og:url missing`);
  assert.ok(!html.includes('gyesanhaejwo.vercel.app'), `${tool.slug}: old domain remains`);
  assert.ok(html.includes(`<h1>${tool.title}</h1>`), `${tool.slug}: h1 missing`);
  assert.ok(html.includes(`href="/#category-${category.id}">${category.name}</a>`), `${tool.slug}: breadcrumb link missing`);
  const [breadcrumb] = schemaOf(html);
  assert.equal(breadcrumb['@type'], 'BreadcrumbList', `${tool.slug}: schema type`);
  assert.deepEqual(breadcrumb.itemListElement.map(item => [item.position, item.name, item.item]), [
    [1, '홈', origin + '/'],
    [2, category.name, `${origin}/#category-${category.id}`],
    [3, tool.title, url]
  ], `${tool.slug}: breadcrumb data`);
  assert.ok(!/noindex/i.test(html), `${tool.slug}: noindex`);
  assert.ok(!html.includes('naver-site-verification'), `${tool.slug}: Naver tag should only appear on home`);
  assert.equal(html.split(adsenseVerificationTag).length - 1, 1, `${tool.slug}: AdSense verification count`);
}

for (const page of trustPages) {
  const html = await read(path.join(page.slug, 'index.html'));
  const url = `${origin}/${page.slug}/`;
  assert.ok(html.includes(`<link rel="canonical" href="${url}"`), `${page.slug}: canonical missing`);
  assert.ok(html.includes(`<meta property="og:url" content="${url}"`), `${page.slug}: og:url missing`);
  assert.ok(html.includes(`<h1>${page.title}</h1>`), `${page.slug}: h1 missing`);
  assert.ok(!/noindex/i.test(html), `${page.slug}: noindex`);
  assert.ok(!html.includes('naver-site-verification'), `${page.slug}: Naver tag should only appear on home`);
  assert.equal(html.split(adsenseVerificationTag).length - 1, 1, `${page.slug}: AdSense verification count`);
  const [breadcrumb] = schemaOf(html);
  assert.equal(breadcrumb['@type'], 'BreadcrumbList', `${page.slug}: schema type`);
  assert.deepEqual(breadcrumb.itemListElement.map(item => [item.position, item.name, item.item]), [[1, '홈', origin + '/'], [2, page.title, url]], `${page.slug}: breadcrumb data`);
}

const robots = await read('robots.txt');
assert.match(robots, /User-agent: \*\nAllow: \/\n/);
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(!robots.includes('gyesanhaejwo.vercel.app'), 'old domain remains in robots');
console.log(`SEO audit PASS: ${expected.length} pages, ${tools.length + trustPages.length} breadcrumbs, WebSite schema, sitemap and robots.`);
