const money = (key, label, value, hint) => ({ key, label, value, unit: '만원', hint, type: 'number', min: 0, step: 'any' });
const number = (key, label, value, unit, min = 0) => ({ key, label, value, unit, type: 'number', min, step: 'any' });
const select = (key, label, options) => ({ key, label, options, type: 'select' });
const date = (key, label, value) => ({ key, label, value, type: 'date' });

export const forms = {
  loan: [money('principal', '대출금', 30000), number('rate', '연 금리', 4.2, '%'), number('years', '상환 기간', 30, '년', 1), select('method', '상환 방식', [['annuity', '원리금균등'], ['equal-principal', '원금균등']])],
  severance: [date('start', '입사일', '2021-01-01'), date('end', '퇴직일 (마지막 근무일 다음 날)', '2026-10-01'), date('periodStart', '퇴직 전 3개월 시작일', '2026-07-01'), money('wages', '퇴직 전 3개월 임금 합계', 1200), money('bonus', '평균임금에 포함할 상여·수당', 0), number('weekHours', '주 소정근로시간', 40, '시간')],
  salary: [money('annual', '세전 연봉', 5000), money('nontax', '월 비과세 급여', 20), { ...number('incomeTax', '월 소득세 원천징수액', 150000, '원'), hint: '급여명세서의 소득세를 입력하세요. 지방소득세 10%는 자동 계산합니다.' }],
  hourly: [number('hourly', '시급', 10320, '원'), number('hours', '주 소정근로시간', 40, '시간'), select('attendance', '소정근로일 개근 여부', [['yes', '개근'], ['no', '미개근']])],
  savings: [select('type', '상품 종류', [['installment', '정기적금'], ['deposit', '정기예금']]), money('amount', '월 납입액 / 예치금', 50), number('rate', '연 이율', 3.5, '%'), number('months', '기간', 12, '개월', 1), number('tax', '이자 과세율', 15.4, '%')],
  vat: [select('mode', '금액 기준', [['excluded', '부가세 별도 (공급가액)'], ['included', '부가세 포함 (공급대가)']]), money('amount', '매출 금액', 1100), money('inputVat', '공제 가능한 매입세액', 30)],
  'dsr-ltv': [money('annual', '연소득', 6000), money('home', '주택 가치', 60000), money('loan', '신규 대출금', 30000), number('rate', '대출 연 금리', 4.2, '%'), number('years', '대출 기간', 30, '년', 1), money('existing', '기존 대출 연간 원리금', 500), number('dsrLimit', '비교할 DSR 한도', 40, '%'), number('ltvLimit', '비교할 LTV 한도', 70, '%')],
  'apartment-cost': [money('price', '아파트 매매가', 60000), number('taxRate', '취득 관련 합산 세율', 1.1, '%'), number('brokerageRate', '중개보수율 (부가세 별도)', 0.4, '%'), money('legal', '법무·등기·채권 비용', 200), money('misc', '이사·수리·기타 비용', 1000), money('loan', '대출금', 40000), number('rate', '대출 연 금리', 3.8, '%'), number('years', '대출 기간', 30, '년', 1)],
  'commercial-property': [money('price', '상가 매매가', 50000), number('taxRate', '취득 관련 합산 세율', 4.6, '%'), number('brokerageRate', '중개보수율 (부가세 별도)', 0.9, '%'), money('other', '등기·기타 비용', 300), money('deposit', '임차 보증금', 5000), money('loan', '대출금', 25000), number('rate', '대출 연 금리', 5, '%'), money('rent', '월 임대료', 300), money('cost', '월 운영비', 30), money('vacancy', '연 공실·수선 충당액', 300)],
  exchange: [number('amount', '환전할 금액', 1000, ''), select('from', '보내는 통화', [['USD', 'USD 미국 달러'], ['KRW', 'KRW 한국 원'], ['EUR', 'EUR 유로'], ['JPY', 'JPY 일본 엔'], ['CNY', 'CNY 중국 위안']]), select('to', '받는 통화', [['KRW', 'KRW 한국 원'], ['USD', 'USD 미국 달러'], ['EUR', 'EUR 유로'], ['JPY', 'JPY 일본 엔'], ['CNY', 'CNY 중국 위안']]), number('rate', '1 보내는 통화당 받는 통화 환율', '', '', 0), number('fee', '환전 수수료', 1, '%')]
};

export function fieldHtml(field) {
  const id = `field-${field.key}`;
  const control = field.type === 'select'
    ? `<select id="${id}" name="${field.key}">${field.options.map(([value,label]) => `<option value="${value}">${label}</option>`).join('')}</select>`
    : `<input id="${id}" name="${field.key}" type="${field.type}" value="${field.value}" ${field.type === 'number' ? `min="${field.min}" step="${field.step}" inputmode="decimal"` : ''} required>`;
  return `<div class="field"><label for="${id}">${field.label}</label><div class="control">${control}${field.unit ? `<span class="unit">${field.unit}</span>` : ''}</div>${field.hint ? `<small class="hint">${field.hint}</small>` : ''}</div>`;
}
