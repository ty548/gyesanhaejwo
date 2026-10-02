import { mkdir, rm, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tools, categories } from '../src/catalog.js';
import { forms, fieldHtml } from '../src/forms.js';
import { renderHome } from '../src/home.js';
import { generalCalculatorMarkup } from '../src/general-page.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = path.join(root, 'dist');
const siteUrl = (process.env.SITE_URL || 'https://calc.memorimap.kr').replace(/\/+$/, '');
const googleSiteVerification = 'M87cSaYmzx1g5y_fo6LFVriQayr94mz8lCJIzb09aq4';
const naverSiteVerification = '8477e7e34e2c7a87d3f245841051d52404cc2e48';
const adsenseVerification = '<meta name="google-adsense-account" content="ca-pub-4865485908744524">';
if (siteUrl && (!/^https:\/\//.test(siteUrl) || new URL(siteUrl).pathname !== '/')) {
  throw new Error('SITE_URL은 경로가 없는 https:// 도메인이어야 합니다.');
}
const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const card = tool => `<a class="tool-card" href="/${tool.slug}/" data-search="${esc([tool.title, tool.short, tool.keywords || '', categories.find(category => category.id === tool.category)?.name].join(' ').toLowerCase())}"><span class="tool-icon" aria-hidden="true">${tool.icon}</span><span class="tool-copy"><strong>${tool.title}</strong><small>${tool.short}</small></span><span class="card-arrow" aria-hidden="true">↗</span></a>`;
const head = (title, description, { slug, home = false, schema } = {}) => {
  const absoluteUrl = siteUrl ? `${siteUrl}${slug ? `/${slug}/` : '/'}` : null;
  const fullTitle = home ? '계산해줘 | 무료 온라인 계산기 · 대출·연봉·날짜·환율' : `${title} | 계산해줘`;
  const jsonLd = schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>` : '';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f2f8ff">${adsenseVerification}${home ? `<meta name="google-site-verification" content="${googleSiteVerification}"><meta name="naver-site-verification" content="${naverSiteVerification}">` : ''}<title>${esc(fullTitle)}</title><meta name="description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(description)}">${absoluteUrl ? `<link rel="canonical" href="${esc(absoluteUrl)}"><meta property="og:url" content="${esc(absoluteUrl)}">` : ''}${jsonLd}<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"><script type="module" src="/assets/app.js"></script></head>`;
};
const navLinks = [['전체 계산기', '/#all-tools'], ['인기 계산기', '/#popular'], ['날짜·시간', '/#category-date-time'], ['부동산', '/#category-property'], ['대출·금융', '/#category-finance']];
const header = `<header class="site-header"><div class="shell header-inner"><a class="brand" href="/" aria-label="계산해줘 홈"><span class="brand-mark" aria-hidden="true">⌗</span><span>계산해줘</span></a><nav class="nav-links" aria-label="주요 메뉴">${navLinks.map(([label,url]) => `<a href="${url}">${label}</a>`).join('')}</nav><details class="mobile-menu"><summary>메뉴</summary><nav aria-label="모바일 메뉴">${navLinks.map(([label,url]) => `<a href="${url}">${label}</a>`).join('')}</nav></details></div></header>`;
const footer = `<footer class="site-footer"><div class="shell footer-inner"><div><strong>계산해줘</strong><p>생활 속 숫자를 더 쉽고 명확하게.</p></div><p>계산 결과는 참고용입니다. 실제 계약·신고·심사에는 해당 기관의 최신 기준을 확인하세요.</p><small>© 2026 계산해줘</small></div></footer>`;
const guides = {
  loan: ['원리금균등은 같은 금액을 매월 납부하고, 원금균등은 원금을 같은 금액씩 갚아 월 납입액이 점차 줄어듭니다.', '대출금·연 금리·상환 기간을 입력해 첫 달 상환액과 전체 기간의 이자를 비교하세요.'],
  severance: ['퇴직금은 적용 1일 임금 × 30일 × 계속근로일수 ÷ 365로 예상합니다. 퇴직 전 3개월 평균임금과 입력한 1일 통상임금 중 큰 금액을 적용합니다.', '퇴직일은 마지막 근무일 다음 날로 입력합니다. 제외기간 등 특수한 산정은 반영하지 않습니다.'],
  salary: ['월 세전급여에서 비과세액을 뺀 금액에 2026년 근로자 부담 국민연금·건강보험·장기요양보험·고용보험료율을 적용합니다. 국민연금 기준소득월액은 2026년 7월부터 적용된 상·하한을 사용합니다.', '소득세는 급여명세서의 월 원천징수액을 입력하며 지방소득세는 그 10%로 계산합니다.'],
  hourly: ['주휴수당은 주휴시간 × 시급으로 계산합니다. 현재 주휴시간은 주 5일 균등 근무를 가정하여 주 소정근로시간 ÷ 5로 추정합니다.', '4주 평균 주 15시간 이상 근무하고 소정근로일을 개근한 경우를 가정합니다. 실제 근무일별 시간 배치에 따라 주휴시간이 달라질 수 있습니다.'],
  savings: ['예금은 예치금에 기간별 단리 이자를 계산합니다. 적금은 월초에 매달 같은 금액을 납입하는 것으로 보고 각 납입금의 이자를 더합니다.', '세후 금액은 이자에서 입력한 이자 과세율을 차감합니다.'],
  vat: ['일반과세자 기준 매출 부가세는 공급가액의 10%입니다. 부가세 포함 금액을 입력하면 1.1로 나눠 공급가액을 구합니다.', '매출 부가세에서 공제 가능한 매입세액을 뺀 차액을 납부 또는 환급 가능액으로 나눠 표시합니다.'],
  'dsr-ltv': ['참고용 단순 DSR은 입력한 연간 원리금 상환액 ÷ 연소득 × 100, 단순 LTV는 대출금 ÷ 입력한 주택 가치 × 100입니다.', '입력한 40%·70%는 비교용 예시값입니다. 2026년 실제 적용 기준은 지역·주택·차주·대출 유형과 스트레스 DSR 적용에 따라 달라집니다.'],
  'apartment-cost': ['총 필요금액은 매매가격에 직접 입력한 취득세율·중개보수·법무·등기·이사·수리·대출 부대비를 더합니다. 자기자본은 총 필요금액에서 대출금을 뺀 값입니다.', '원리금균등 또는 원금균등 상환의 첫 달 납입액, 1년차 상환액·이자, 전체 이자를 보여줍니다. 세율은 계약 조건과 기준일에 맞게 직접 확인하세요.'],
  'commercial-property': ['NOI는 연 임대수입에서 공실 손실과 연 운영비를 뺀 금액입니다. Cap Rate의 분모는 매매가, 표면수익률의 분자는 공실 차감 전 연 총임대수입입니다.', 'CoC는 세전 현금흐름 ÷ 실제 투입 자기자본, DSCR은 NOI ÷ 1년차 연간 부채상환액입니다. 대출 원금 상환도 현금흐름에 반영합니다.'],
  exchange: ['Frankfurter의 최신 기준 환율을 조회합니다. 자동 조회에 실패하면 통화쌍의 환율을 직접 입력할 수 있습니다.', '우대율은 입력한 환전 수수료율에만 적용합니다. 은행 현찰 매매율과 스프레드는 별도로 확인하세요.'],
  'date-diff': ['두 날짜의 자정 사이를 계산하므로 윤년과 월말을 정확히 반영합니다.', '예를 들어 2월 28일부터 윤년 3월 1일까지는 시작일 미포함 시 2일입니다.'],
  'date-offset': ['기준일을 0일로 두고 지정한 일수만큼 앞이나 뒤로 이동합니다.', '2026년 10월 1일에서 100일 후는 2027년 1월 9일 토요일입니다.'],
  dday: ['목표일이 미래이면 D-일수, 과거이면 D+일수, 당일이면 D-Day로 표시합니다.', '시작일을 비워 두면 브라우저의 오늘 날짜를 기준으로 계산합니다.'],
  'business-days': ['기간의 각 날짜에서 토요일과 일요일을 제외해 평일 수를 계산합니다.', '현재는 토·일요일 제외 기준이며 법정공휴일은 반영하지 않습니다.'],
  'work-time': ['출퇴근시각의 차이에서 휴게시간을 차감합니다.', '퇴근시각이 출근시각보다 이르면 다음 날 퇴근으로 계산합니다.'],
  'playback-speed': ['실제 시청시간은 원본 영상 길이 ÷ 재생 배속입니다.', '시작 시각에 실제 시청시간을 더해 종료 시각을 추정합니다. 일시정지는 포함하지 않습니다.'],
  'work-clock': ['현재 시각은 브라우저의 시계를 사용하며 1분마다 남은 시간을 갱신합니다.', '휴게시간의 정확한 시각을 받지 않으므로 현재까지 근무한 시간은 근무 구간 전체에 휴게를 균등하게 배분한 추정치입니다.'],
  'salary-clock': ['월급 ÷ 월 근무일수 ÷ 1일 근무시간으로 시간당 수입을 추정합니다.', '오늘 번 돈은 현재 근무 진행률에 비례한 추정치입니다. 세금·수당·휴일·연장근로는 자동 반영하지 않습니다.'],
  calculator: ['계산식을 입력하고 = 또는 Enter를 누르면 결과를 확인할 수 있습니다. 예: (12 + 8) × 3 = 60, 200 × 10% = 20입니다.', '숫자와 연산자는 키보드로도 입력할 수 있습니다. Backspace는 한 글자 삭제, Escape는 전체 지우기입니다. %는 앞 숫자를 100으로 나눈 값으로 계산합니다.']
};
const sources = {
  severance: { basis: '고용노동부 계산 기준 · 확인 2026-10-02', links: [['고용노동부 퇴직금 계산과 공식 예제', 'https://1350.moel.go.kr/home/hp/retirementpaycal/retirementpaycal.jsp'], ['고용노동부 적용 요건·산정 제외기간', 'https://1350.moel.go.kr/rtmview.do?id=1000320345']] },
  salary: { basis: '보험료율 2026년, 국민연금 상·하한 2026-07-01 적용 · 확인 2026-10-02', links: [['국민연금공단 보험료율·기준소득월액', 'https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0097M0.do'], ['국민건강보험공단 2026 보험료율', 'https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html'], ['고용보험 근로자 부담', 'https://edrm.ei.go.kr/ei/eim/eg/ei/eiEminsr/retrieveEi0301Info.do'], ['국세청 근로소득 간이세액표 안내', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7703&mi=2281']] },
  hourly: { basis: '2026년 최저임금 · 확인 2026-10-02', links: [['고용노동부 2026년 최저임금 고시 안내', 'https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18144'], ['고용노동부 주휴수당 요건', 'https://1350.moel.go.kr/rtmview.do?id=1000325860']] },
  savings: { basis: '일반 이자소득 원천징수 기준 · 확인 2026-10-02', links: [['국세청 이자소득 원천징수세율', 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7703&mi=2281'], ['국가법령정보센터 지방세법 제103조의13', 'https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1031542589']] },
  vat: { basis: '일반과세자 기본 구조 · 확인 2026-10-02', links: [['국세청 부가가치세 개요', 'https://b.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272']] },
  'dsr-ltv': { basis: '금융위원회 공개 기준 · 확인 2026-10-02', links: [['금융위원회 스트레스 DSR 적용 기준', 'https://better.fsc.go.kr/fsc_new/status/adminMap/PrvntcDetail.do?muNo=144&postNo=5349&stNo=11'], ['금융위원회 지역별 LTV 관련 정책문답', 'https://www.fsc.go.kr/po020201/85518?curPage=1']] },
  'apartment-cost': { basis: '취득·중개 관련 법령 · 확인 2026-10-02', links: [['국가법령정보센터 지방세법 제11조', 'https://law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0011&lsiSeq=282559&urlMode=lsScJoRltInfoR'], ['국가법령정보센터 공인중개사법 시행규칙 제20조', 'https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1013419503']] },
  'commercial-property': { basis: '취득·중개 관련 법령 · 확인 2026-10-02', links: [['국가법령정보센터 지방세법 제11조', 'https://law.go.kr/LSW/lsSideInfoP.do?docCls=jo&joBrNo=00&joNo=0011&lsiSeq=282559&urlMode=lsScJoRltInfoR'], ['국가법령정보센터 공인중개사법 시행규칙 제20조', 'https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1013419503']] },
  exchange: { basis: 'Frankfurter 제공 환율 날짜를 결과 위에 표시', links: [['Frankfurter 환율 API·제공기관 안내', 'https://frankfurter.dev/']] }
};


function toolPage(tool) {
  const category = categories.find(item => item.id === tool.category);
  const crumbs = [
    { name: '홈', url: `${siteUrl}/` },
    { name: category.name, url: `${siteUrl}/#category-${category.id}` },
    { name: tool.title, url: `${siteUrl}/${tool.slug}/` }
  ];
  const schema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: crumb.url })) };
  const related = tools.filter(item => item.slug !== tool.slug && item.category === tool.category).slice(0, 3);
  const other = related.length ? related : tools.filter(item => item.slug !== tool.slug).slice(0, 3);
  const source = sources[tool.slug];
  const sourceHtml = source ? `<div class="standard-sources"><h3>계산 기준 및 출처</h3><p>${source.basis}</p><ul>${source.links.map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a></li>`).join('')}</ul></div>` : '';
  const guide = `<section class="guide-section"><span class="section-kicker">HOW IT WORKS</span><h2>${tool.title} 계산 방법</h2>${guides[tool.slug].map(paragraph => `<p>${paragraph}</p>`).join('')}${sourceHtml}</section>`;
  const calculator = tool.slug === 'calculator';
  const core = calculator ? `<section class="general-page-section" aria-label="일반 계산기">${generalCalculatorMarkup()}</section>` : `<div class="calculator-layout"><section class="calc-panel" aria-labelledby="input-heading"><div class="panel-header"><div><span class="step-label">STEP 01</span><h2 id="input-heading">조건 입력</h2></div><span class="panel-chip">간편 계산</span></div><form id="calculator-form" class="calculator-form"></form><p id="form-error" class="form-error" role="alert"></p><div id="rate-tools" class="rate-tools" hidden><button type="button" id="fetch-rate">↻ 최신 기준 환율 불러오기</button><p id="rate-status" role="status"></p></div></section><section class="result-panel" id="result-panel" aria-labelledby="result-heading" aria-live="${['work-clock', 'salary-clock'].includes(tool.slug) ? 'off' : 'polite'}"><div class="panel-header"><div><span class="step-label">STEP 02</span><h2 id="result-heading">계산 결과</h2></div><span class="result-sparkle" aria-hidden="true">✦</span></div><div id="result-list" class="result-list"><p class="result-placeholder">숫자를 입력하면 결과가 여기에 표시됩니다.</p></div><p id="result-note" class="result-note"></p></section></div><div class="tool-info"><div class="info-symbol" aria-hidden="true">ⓘ</div><div><strong>계산 전 확인하세요</strong><p>표시된 값은 입력 조건에 따른 예상치입니다. 금리, 세율, 공제 조건과 실제 적용 기준을 확인한 뒤 결정에 활용하세요.</p></div></div>`;
  return `${head(tool.title, tool.description, { slug: tool.slug, schema })}<body data-tool="${tool.slug}">${header}<main class="shell tool-main"><nav class="breadcrumbs" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">›</span><a href="/#category-${category.id}">${category.name}</a><span aria-hidden="true">›</span><span aria-current="page">${tool.title}</span></nav><section class="tool-intro"><div class="intro-icon" aria-hidden="true">${tool.icon}</div><div><span class="section-kicker">FREE CALCULATOR</span><h1>${tool.title}</h1><p>${tool.description}</p></div></section>${core}${guide}<section class="related-section"><div class="section-heading"><div><span class="section-kicker">NEXT STEP</span><h2>함께 쓰면 좋은 계산기</h2></div><a class="text-link" href="/#all-tools">전체 계산기 보기 →</a></div><div class="card-grid">${other.map(card).join('')}</div></section></main>${footer}</body></html>`;
}

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });
await writeFile(path.join(dist, 'index.html'), renderHome({ head, header, footer, card, categories, tools, siteUrl }));
for (const tool of tools) {
  await mkdir(path.join(dist, tool.slug), { recursive: true });
  const form = tool.slug === 'calculator' ? '' : `<form id="calculator-form" class="calculator-form"><div class="form-grid">${forms[tool.slug].map(fieldHtml).join('')}</div><button class="calculate-button" type="submit">계산하기 <span aria-hidden="true">→</span></button></form>`;
  await writeFile(path.join(dist, tool.slug, 'index.html'), toolPage(tool).replace('<form id="calculator-form" class="calculator-form"></form>', form));
}
for (const file of ['app.js', 'catalog.js', 'forms.js', 'calculations.js', 'date-time.js', 'property.js', 'rates.js', 'general-calculator.js', 'general-ui.js', 'style.css', 'favicon.svg']) {
  await copyFile(path.join(root, 'src', file), path.join(dist, 'assets', file));
}
if (siteUrl) {
  const urls = ['/', ...tools.map(tool => `/${tool.slug}/`)];
  await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${esc(siteUrl + url)}</loc></url>`).join('')}</urlset>\n`);
}
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
console.log(`Built ${tools.length + 1} pages in dist/`);
