import { forms, fieldHtml } from './forms.js';
import { calculators } from './calculations.js';
import { tools } from './catalog.js';
import { lookupRate, rateErrorMessages } from './rates.js';
import { currentLocalClock, resolveDateInput, resolveTimeInput } from './date-time.js';
import { setupGeneralCalculators } from './general-ui.js';

const $ = selector => document.querySelector(selector);
const fmt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
let rateRequest = 0;
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const recentKey = 'gyesanhaejwo.recent';
const readJson = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };

function setupRecent(slug) {
  if (slug) {
    try { localStorage.setItem(recentKey, JSON.stringify([slug, ...(readJson(recentKey) || []).filter(item => item !== slug)].slice(0, 4))); } catch { /* private mode */ }
    return;
  }
  if (!$('#recent-list')) return;
  const recent = (readJson(recentKey) || []).map(id => tools.find(tool => tool.slug === id)).filter(Boolean).slice(0, 4);
  if (!recent.length) return;
  $('#recent-list').innerHTML = recent.map(tool => `<a class="tool-card" href="/${tool.slug}/"><span class="tool-icon" aria-hidden="true">${tool.icon}</span><span class="tool-copy"><strong>${tool.title}</strong><small>${tool.short}</small></span><span class="card-arrow" aria-hidden="true">↗</span></a>`).join('');
  $('#recent-tools').hidden = false;
}

function setupSearch() {
  const input = $('#site-search');
  if (!input) return;
  const cards = [...document.querySelectorAll('.tool-card')];
  const empty = $('#search-empty');
  const update = () => {
    const query = input.value.trim().toLocaleLowerCase('ko-KR');
    const intent = /아파트/.test(query) ? 'apartment-cost' : /달러|환율|환전/.test(query) ? 'exchange' : /퇴직금/.test(query) ? 'severance' : /\d+일\s*(후|전)|며칠\s*(후|전)/.test(query) ? 'date-offset' : /대출/.test(query) ? 'loan' : null;
    const words = query.replace(/\d+(?:[.,]\d+)?\s*(?:억|만원|원|년|일)?/g, ' ').split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const item of cards) {
      const match = !query || (intent ? item.getAttribute('href') === `/${intent}/` : words.length > 0 && words.every(word => item.dataset.search.includes(word)));
      item.hidden = !match;
      if (match) visible++;
    }
    empty.hidden = visible > 0;
    document.querySelectorAll('.category-group').forEach(group => {
      group.hidden = !group.querySelector('.tool-card:not([hidden])');
      group.classList.toggle('search-expanded', !!query);
    });
  };
  input.addEventListener('input', update);
  $('#search-form').addEventListener('submit', event => { event.preventDefault(); update(); $('#all-tools').scrollIntoView({ behavior: 'smooth' }); });
  document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.query; update(); $('#all-tools').scrollIntoView({ behavior: 'smooth' }); }));
  document.querySelectorAll('.category-more').forEach(button => button.addEventListener('click', () => {
    const group = button.closest('.category-group');
    const expanded = group.classList.toggle('expanded');
    button.setAttribute('aria-expanded', String(expanded));
    button.innerHTML = expanded ? '접기 ↑' : `${group.querySelector('h3').textContent} 전체보기 →`;
  }));
}

function formatValue(value, type, slug, values) {
  if (type === 'percent') return `${decimal.format(value)}%`;
  if (type === 'ratio') return `${decimal.format(value)}배`;
  if (type === 'days') return `${fmt.format(value)}일`;
  if (type === 'hours') return `${decimal.format(value)}시간`;
  if (type === 'currency') return `${decimal.format(value)} ${escapeHtml(values.to)}`;
  if (type === 'text') return escapeHtml(value);
  return `${fmt.format(value)}원`;
}

async function fetchRate(form) {
  const from = form.elements.from.value, to = form.elements.to.value;
  const request = ++rateRequest;
  const status = $('#rate-status');
  if (from === to) { form.elements.rate.value = '1'; status.textContent = '같은 통화의 환율은 1입니다.'; form.requestSubmit(); return; }
  status.textContent = '최신 기준 환율을 불러오는 중…';
  const data = await lookupRate(fetch, from, to);
  if (request !== rateRequest) return;
  if (data.rate === null) {
    status.textContent = rateErrorMessages[data.error];
    return;
  }
  form.elements.rate.value = data.rate;
  status.textContent = `기준 환율 ${data.date} · Frankfurter 제공. 은행 고시 환율과 다를 수 있습니다.`;
  form.requestSubmit();
}

function renderRows(result, slug, values) {
  const row = (entry, featured = false) => `<div class="result-row ${featured ? 'featured' : ''}"><span>${escapeHtml(entry[0])}</span><strong>${formatValue(entry[1], entry[2], slug, values)}</strong></div>`;
  const featured = result.featured || [0];
  const primary = featured.map(index => row(result.rows[index], true)).join('');
  const others = result.rows.filter((_, index) => !featured.includes(index));
  const progress = Number.isFinite(result.progress) ? `<div class="clock-progress" role="progressbar" aria-label="근무 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(result.progress)}"><span style="width:${Math.max(0, Math.min(100, result.progress))}%"></span></div>` : '';
  const details = result.featured && others.length > 0 ? `<details class="result-details"><summary>상세 내역 펼치기</summary>${others.map(entry => row(entry)).join('')}</details>` : others.map(entry => row(entry)).join('');
  return primary + progress + details;
}

function initializeForm(form, slug) {
  const clock = currentLocalClock();
  for (const input of form.querySelectorAll('[data-default]')) input.value = input.dataset.default === 'today' ? resolveDateInput('today', clock.today) : resolveTimeInput('now', clock.time);
  if (slug === 'playback-speed') {
    const custom = form.elements.customSpeed;
    const toggle = () => {
      const selected = form.querySelector('input[name="speed"]:checked')?.value;
      custom.closest('.field').hidden = selected !== 'custom';
      custom.required = selected === 'custom';
    };
    form.querySelectorAll('input[name="speed"]').forEach(input => input.addEventListener('change', toggle));
    toggle();
  }
  if (['work-clock', 'salary-clock'].includes(slug)) {
    const key = `gyesanhaejwo.${slug}`;
    const saved = readJson(key);
    if (saved && typeof saved === 'object') for (const [name, value] of Object.entries(saved)) {
      if (form.elements[name] && typeof value === 'string') form.elements[name].value = value;
    }
    const save = () => {
      const data = Object.fromEntries(new FormData(form));
      try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* private mode */ }
    };
    form.addEventListener('input', save);
    form.addEventListener('change', save);
  }
}

function setupCalculator() {
  const slug = document.body.dataset.tool;
  if (!slug) return;
  if (slug === 'calculator') { setupRecent(slug); return; }
  const form = $('#calculator-form'), fields = forms[slug];
  if (!form.children.length) form.innerHTML = `<div class="form-grid">${fields.map(fieldHtml).join('')}</div><button class="calculate-button" type="submit">계산하기 <span aria-hidden="true">→</span></button>`;
  initializeForm(form, slug);
  setupRecent(slug);
  const clearResult = () => {
    $('#result-list').innerHTML = '<p class="result-placeholder">입력값을 확인하면 결과가 여기에 표시됩니다.</p>';
    $('#result-note').textContent = '';
    $('#result-panel').classList.remove('has-result');
  };
  const calculate = event => {
    event?.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const clock = currentLocalClock();
    values.today = clock.today;
    values.nowSeconds = clock.seconds;
    const error = $('#form-error');
    error.textContent = '';
    try {
      if (!form.checkValidity()) {
        error.textContent = '필수 항목과 입력 범위를 확인해 주세요.';
        clearResult();
        return;
      }
      const result = calculators[slug](values);
      if (result.rows.some(([,value]) => typeof value === 'number' && !Number.isFinite(value))) throw new Error('입력값을 확인해 주세요.');
      $('#result-list').innerHTML = renderRows(result, slug, values);
      $('#result-note').textContent = result.note;
      $('#result-panel').classList.add('has-result');
    } catch (problem) { error.textContent = problem.message || '입력값을 확인해 주세요.'; clearResult(); }
  };
  form.addEventListener('submit', calculate);
  form.addEventListener('input', () => { if (slug !== 'exchange') calculate(); else clearResult(); });
  form.addEventListener('change', () => { if (slug !== 'exchange') calculate(); else clearResult(); });
  if (slug === 'exchange') {
    $('#rate-tools').hidden = false;
    $('#fetch-rate').addEventListener('click', () => fetchRate(form));
    for (const key of ['from','to']) form.elements[key].addEventListener('change', () => { form.elements.rate.value = ''; fetchRate(form); });
    form.elements.rate.addEventListener('input', () => {
      rateRequest++;
      $('#rate-status').textContent = '직접 입력한 환율을 사용합니다.';
    });
    fetchRate(form);
  } else {
    calculate();
    if (slug === 'work-clock' || slug === 'salary-clock') setInterval(calculate, slug === 'work-clock' ? 60000 : 5000);
  }
}

setupSearch();
setupRecent();
setupCalculator();
setupGeneralCalculators();
