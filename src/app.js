import { forms, fieldHtml } from './forms.js';
import { calculators } from './calculations.js';

const $ = selector => document.querySelector(selector);
const fmt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

function setupSearch() {
  const input = $('#site-search');
  if (!input) return;
  const cards = [...document.querySelectorAll('.tool-card')];
  const empty = $('#search-empty');
  const update = () => {
    const query = input.value.trim().toLocaleLowerCase('ko-KR');
    let visible = 0;
    for (const item of cards) {
      const match = !query || item.dataset.search.includes(query);
      item.hidden = !match;
      if (match) visible++;
    }
    empty.hidden = visible > 0;
    document.querySelectorAll('.category-group').forEach(group => { group.hidden = !group.querySelector('.tool-card:not([hidden])'); });
  };
  input.addEventListener('input', update);
  $('#search-form').addEventListener('submit', event => { event.preventDefault(); update(); $('#all-tools').scrollIntoView({ behavior: 'smooth' }); });
  document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.query; update(); $('#all-tools').scrollIntoView({ behavior: 'smooth' }); }));
}

function formatValue(value, type, slug, values) {
  if (type === 'text') return value;
  if (type === 'percent') return `${decimal.format(value)}%`;
  if (type === 'days') return `${fmt.format(value)}일`;
  if (type === 'hours') return `${decimal.format(value)}시간`;
  if (type === 'currency') return `${decimal.format(value)} ${values.to}`;
  return `${fmt.format(value)}원`;
}

async function fetchRate(form) {
  const from = form.elements.from.value, to = form.elements.to.value;
  const status = $('#rate-status');
  if (from === to) { form.elements.rate.value = '1'; status.textContent = '같은 통화의 환율은 1입니다.'; form.requestSubmit(); return; }
  status.textContent = '최신 기준 환율을 불러오는 중…';
  try {
    const response = await fetch(`https://api.frankfurter.dev/v2/rate/${from.toLowerCase()}/${to.toLowerCase()}`);
    if (!response.ok) throw new Error('환율 조회 실패');
    const data = await response.json();
    if (!(data.rate > 0)) throw new Error('환율 정보 없음');
    form.elements.rate.value = data.rate;
    status.textContent = `기준 환율 ${data.date} · Frankfurter 제공. 은행 고시 환율과 다를 수 있습니다.`;
    form.requestSubmit();
  } catch {
    status.textContent = '자동 조회에 실패했습니다. 환율을 직접 입력해 주세요.';
  }
}

function setupCalculator() {
  const slug = document.body.dataset.tool;
  if (!slug) return;
  const form = $('#calculator-form'), fields = forms[slug];
  if (!form.children.length) form.innerHTML = `<div class="form-grid">${fields.map(fieldHtml).join('')}</div><button class="calculate-button" type="submit">계산하기 <span aria-hidden="true">→</span></button>`;
  const calculate = event => {
    event?.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const error = $('#form-error');
    error.textContent = '';
    try {
      if (!form.checkValidity()) return;
      const result = calculators[slug](values);
      if (result.rows.some(([,value]) => typeof value === 'number' && !Number.isFinite(value))) throw new Error('입력값을 확인해 주세요.');
      $('#result-list').innerHTML = result.rows.map(([label,value,type], index) => `<div class="result-row ${index === 0 ? 'featured' : ''}"><span>${label}</span><strong>${formatValue(value,type,slug,values)}</strong></div>`).join('');
      $('#result-note').textContent = result.note;
      $('#result-panel').classList.add('has-result');
    } catch (problem) { error.textContent = problem.message || '입력값을 확인해 주세요.'; }
  };
  form.addEventListener('submit', calculate);
  form.addEventListener('input', () => { if (slug !== 'exchange') calculate(); });
  form.addEventListener('change', () => { if (slug !== 'exchange') calculate(); });
  if (slug === 'exchange') {
    $('#rate-tools').hidden = false;
    $('#fetch-rate').addEventListener('click', () => fetchRate(form));
    for (const key of ['from','to']) form.elements[key].addEventListener('change', () => { form.elements.rate.value = ''; fetchRate(form); });
    fetchRate(form);
  } else calculate();
}

setupSearch();
setupCalculator();
