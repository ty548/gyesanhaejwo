import { mkdir, rm, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tools, categories } from '../src/catalog.js';
import { forms, fieldHtml } from '../src/forms.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = path.join(root, 'dist');
const siteUrl = (process.env.SITE_URL || 'https://gyesanhaejwo.vercel.app').replace(/\/+$/, '');
if (siteUrl && (!/^https:\/\//.test(siteUrl) || new URL(siteUrl).pathname !== '/')) {
  throw new Error('SITE_URL은 경로가 없는 https:// 도메인이어야 합니다.');
}
const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const card = tool => `<a class="tool-card" href="/${tool.slug}/" data-search="${esc([tool.title, tool.short, categories.find(category => category.id === tool.category)?.name].join(' ').toLowerCase())}"><span class="tool-icon" aria-hidden="true">${tool.icon}</span><span class="tool-copy"><strong>${tool.title}</strong><small>${tool.short}</small></span><span class="card-arrow" aria-hidden="true">↗</span></a>`;
const head = (title, description) => {
  const slug = tools.find(tool => tool.title === title)?.slug;
  const absoluteUrl = siteUrl ? `${siteUrl}${slug ? `/${slug}/` : '/'}` : null;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f2f8ff"><title>${esc(title)} | 계산해줘</title><meta name="description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} | 계산해줘"><meta property="og:description" content="${esc(description)}">${absoluteUrl ? `<link rel="canonical" href="${esc(absoluteUrl)}"><meta property="og:url" content="${esc(absoluteUrl)}">` : ''}<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"><script type="module" src="/assets/app.js"></script></head>`;
};
const header = `<header class="site-header"><div class="shell header-inner"><a class="brand" href="/" aria-label="계산해줘 홈"><span class="brand-mark" aria-hidden="true">⌗</span><span>계산해줘</span></a><nav class="nav-links" aria-label="주요 메뉴"><a href="/#popular">인기 계산기</a><a href="/#all-tools">전체 계산기</a></nav><a class="header-cta" href="/#all-tools">계산기 찾기 <span aria-hidden="true">↗</span></a></div></header>`;
const footer = `<footer class="site-footer"><div class="shell footer-inner"><div><strong>계산해줘</strong><p>생활 속 숫자를 더 쉽고 명확하게.</p></div><p>계산 결과는 참고용입니다. 실제 계약·신고·심사에는 해당 기관의 최신 기준을 확인하세요.</p><small>© 2026 계산해줘</small></div></footer>`;
const guides = {
  loan: ['원리금균등은 같은 금액을 매월 납부하고, 원금균등은 원금을 같은 금액씩 갚아 월 납입액이 점차 줄어듭니다.', '대출금·연 금리·상환 기간을 입력해 첫 달 상환액과 전체 기간의 이자를 비교하세요.'],
  severance: ['퇴직금은 적용 1일 임금 × 30일 × 계속근로일수 ÷ 365로 예상합니다. 퇴직 전 3개월 평균임금과 입력한 1일 통상임금 중 큰 금액을 적용합니다.', '퇴직일은 마지막 근무일 다음 날로 입력합니다. 제외기간 등 특수한 산정은 반영하지 않습니다.'],
  salary: ['월 세전급여에서 비과세액을 뺀 금액에 2026년 근로자 부담 국민연금·건강보험·장기요양보험·고용보험료율을 적용합니다. 국민연금 기준소득월액은 2026년 7월부터 적용된 상·하한을 사용합니다.', '소득세는 급여명세서의 월 원천징수액을 입력하며 지방소득세는 그 10%로 계산합니다.'],
  hourly: ['주휴수당은 주휴시간 × 시급으로 계산합니다. 주휴시간은 주 40시간 기준 최대 8시간으로 환산합니다.', '주 15시간 이상 근무하고 소정근로일을 개근한 경우에 적용합니다. 월급은 주급에 달력 평균 주수를 곱한 시간을 정수로 반올림해 추정합니다.'],
  savings: ['예금은 예치금에 기간별 단리 이자를 계산합니다. 적금은 월초에 매달 같은 금액을 납입하는 것으로 보고 각 납입금의 이자를 더합니다.', '세후 금액은 이자에서 입력한 이자 과세율을 차감합니다.'],
  vat: ['일반과세자 기준 매출 부가세는 공급가액의 10%입니다. 부가세 포함 금액을 입력하면 1.1로 나눠 공급가액을 구합니다.', '매출 부가세에서 공제 가능한 매입세액을 뺀 차액을 납부 또는 환급 가능액으로 나눠 표시합니다.'],
  'dsr-ltv': ['DSR은 연간 금융부채 원리금 상환액 ÷ 연소득 × 100, LTV는 대출금 ÷ 주택 가치 × 100입니다.', '입력한 한도는 비교용이며 실제 적용 한도와 심사 방식은 금융기관 및 규제 조건에 따라 달라집니다.'],
  'apartment-cost': ['구매 총비용은 매매가에 취득 관련 세금, 중개보수, 법무·등기비와 기타 비용을 더합니다.', '총비용에서 대출금을 빼면 준비할 자기자본을 볼 수 있습니다.'],
  'commercial-property': ['순영업소득은 연 임대료에서 운영비와 공실·수선 충당액을 차감한 금액입니다.', '실투자금 대비 수익률은 순영업소득에서 대출 이자를 뺀 금액을 실투자금으로 나눠 계산합니다.'],
  exchange: ['기준 환율은 Frankfurter의 최신 통화쌍 환율을 사용합니다. 환산액에 입력한 수수료율을 적용해 예상 수령액을 구합니다.', '은행 현찰 매매율과 실제 환전 수수료는 별도로 확인하세요.']
};
const sources = {
  severance: ['고용노동부 퇴직금 계산', 'https://1350.moel.go.kr/home/hp/retirementpaycal/retirementpaycal.jsp'],
  salary: ['국민연금공단 보험료율 안내', 'https://m.nps.or.kr/pnsinfo/ntpsklg/getOHAF0097M0.do'],
  hourly: ['고용노동부 주휴수당 안내', 'https://1350.moel.go.kr/rtmview.do?id=1000074928'],
  vat: ['국세청 부가가치세 개요', 'https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272'],
  'dsr-ltv': ['금융위원회 DSR 설명', 'https://www.fsc.go.kr/po020201/27351?curPage=1'],
  exchange: ['Frankfurter 환율 API', 'https://frankfurter.dev/']
};

function home() {
  const popular = tools.slice(0, 6).map(card).join('');
  const all = categories.map(category => {
    const items = tools.filter(tool => tool.category === category.id);
    return `<section class="category-group" id="category-${category.id}"><div class="category-heading"><span class="category-symbol">${category.icon}</span><div><h3>${category.name}</h3><p>${category.description}</p></div><span class="category-count">${items.length}개</span></div><div class="card-grid">${items.map(card).join('')}</div></section>`;
  }).join('');
  return `${head('대한민국 토탈 계산기', '대출, 퇴직금, 연봉 실수령액, 주휴수당, 부동산, 세금, 환율까지 한 곳에서 계산하세요.')}<body>${header}<main><section class="hero"><div class="shell hero-grid"><div class="hero-content"><span class="eyebrow"><span class="status-dot"></span> 대한민국 토탈 계산기</span><h1>복잡한 숫자,<br><em>계산해줘.</em></h1><p>대출부터 월급, 부동산, 환율까지.<br>필요한 계산을 빠르고 쉽게 시작하세요.</p><form id="search-form" class="search-box" role="search"><label class="sr-only" for="site-search">계산기 검색</label><span aria-hidden="true">⌕</span><input id="site-search" type="search" placeholder="어떤 계산이 필요하세요?" autocomplete="off"><button type="submit">검색</button></form><div class="quick-search"><span>많이 찾는 검색</span><button type="button" data-query="대출"># 대출</button><button type="button" data-query="퇴직금"># 퇴직금</button><button type="button" data-query="연봉"># 연봉</button></div></div><div class="hero-art" aria-hidden="true"><div class="art-glow"></div><div class="art-card art-card-main"><span class="art-kicker">대출 계산 예시 · 월 상환액</span><strong>1,467,052<span>원</span></strong><div class="art-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="art-foot">내 숫자를 더 명확하게</span></div><div class="art-pill art-pill-top">✦ 간편한 계산</div><div class="art-pill art-pill-bottom">✓ 결과 바로 확인</div></div></div></section><div class="shell"><section id="popular" class="section-block"><div class="section-heading"><div><span class="section-kicker">POPULAR TOOLS</span><h2>지금 가장 많이 찾는 계산기</h2><p>자주 쓰는 계산부터 바로 시작해 보세요.</p></div><a class="text-link" href="#all-tools">전체 보기 <span aria-hidden="true">→</span></a></div><div class="card-grid popular-grid">${popular}</div></section><section class="category-strip" aria-label="카테고리 바로가기">${categories.map(category => `<a href="#category-${category.id}"><span>${category.icon}</span><strong>${category.name}</strong><small>↗</small></a>`).join('')}</section><section id="all-tools" class="section-block all-tools"><div class="section-heading"><div><span class="section-kicker">ALL CALCULATORS</span><h2>카테고리별 계산기</h2><p>궁금한 주제에서 필요한 계산기를 골라 보세요.</p></div><span class="tool-count">총 ${tools.length}개의 계산기</span></div><p id="search-empty" class="empty-message" hidden>일치하는 계산기가 없습니다. 다른 단어로 검색해 보세요.</p>${all}</section><section class="trust-banner"><span class="trust-icon" aria-hidden="true">✳</span><div><strong>입력한 숫자는 브라우저에서 계산해요.</strong><p>계정 없이 바로 사용하고, 결과를 보고 값을 자유롭게 바꿔 보세요.</p></div></section></div></main>${footer}</body></html>`;
}

function toolPage(tool) {
  const related = tools.filter(item => item.slug !== tool.slug && item.category === tool.category).slice(0, 3);
  const other = related.length ? related : tools.filter(item => item.slug !== tool.slug).slice(0, 3);
  const guide = `<section class="guide-section"><span class="section-kicker">HOW IT WORKS</span><h2>${tool.title} 계산 방법</h2>${guides[tool.slug].map(paragraph => `<p>${paragraph}</p>`).join('')}${sources[tool.slug] ? `<a href="${sources[tool.slug][1]}" target="_blank" rel="noopener noreferrer">기준 확인: ${sources[tool.slug][0]} ↗</a>` : ''}</section>`;
  return `${head(tool.title, tool.description)}<body data-tool="${tool.slug}">${header}<main class="shell tool-main"><nav class="breadcrumbs" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">›</span><span>${tool.title}</span></nav><section class="tool-intro"><div class="intro-icon" aria-hidden="true">${tool.icon}</div><div><span class="section-kicker">FREE CALCULATOR</span><h1>${tool.title}</h1><p>${tool.description}</p></div></section><div class="calculator-layout"><section class="calc-panel" aria-labelledby="input-heading"><div class="panel-header"><div><span class="step-label">STEP 01</span><h2 id="input-heading">조건 입력</h2></div><span class="panel-chip">간편 계산</span></div><form id="calculator-form" class="calculator-form"></form><p id="form-error" class="form-error" role="alert"></p><div id="rate-tools" class="rate-tools" hidden><button type="button" id="fetch-rate">↻ 최신 기준 환율 불러오기</button><p id="rate-status" role="status"></p></div></section><section class="result-panel" id="result-panel" aria-labelledby="result-heading" aria-live="polite"><div class="panel-header"><div><span class="step-label">STEP 02</span><h2 id="result-heading">계산 결과</h2></div><span class="result-sparkle" aria-hidden="true">✦</span></div><div id="result-list" class="result-list"><p class="result-placeholder">숫자를 입력하면 결과가 여기에 표시됩니다.</p></div><p id="result-note" class="result-note"></p></section></div><div class="tool-info"><div class="info-symbol" aria-hidden="true">ⓘ</div><div><strong>계산 전 확인하세요</strong><p>표시된 값은 입력 조건에 따른 예상치입니다. 금리, 세율, 공제 조건과 실제 적용 기준을 확인한 뒤 결정에 활용하세요.</p></div></div>${guide}<section class="related-section"><div class="section-heading"><div><span class="section-kicker">NEXT STEP</span><h2>함께 쓰면 좋은 계산기</h2></div><a class="text-link" href="/#all-tools">전체 보기 →</a></div><div class="card-grid">${other.map(card).join('')}</div></section></main>${footer}</body></html>`;
}

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });
await writeFile(path.join(dist, 'index.html'), home());
for (const tool of tools) {
  await mkdir(path.join(dist, tool.slug), { recursive: true });
  const form = `<form id="calculator-form" class="calculator-form"><div class="form-grid">${forms[tool.slug].map(fieldHtml).join('')}</div><button class="calculate-button" type="submit">계산하기 <span aria-hidden="true">→</span></button></form>`;
  await writeFile(path.join(dist, tool.slug, 'index.html'), toolPage(tool).replace('<form id="calculator-form" class="calculator-form"></form>', form));
}
for (const file of ['app.js', 'catalog.js', 'forms.js', 'calculations.js', 'style.css', 'favicon.svg']) {
  await copyFile(path.join(root, 'src', file), path.join(dist, 'assets', file));
}
if (siteUrl) {
  const urls = ['/', ...tools.map(tool => `/${tool.slug}/`)];
  await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${esc(siteUrl + url)}</loc></url>`).join('')}</urlset>\n`);
}
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
console.log(`Built ${tools.length + 1} pages in dist/`);
