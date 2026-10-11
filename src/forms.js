const money = (key, label, value, hint) => ({ key, label, value, unit: '만원', hint, type: 'number', min: 0, step: 'any' });
const number = (key, label, value, unit, min = 0, step = 'any', max) => ({ key, label, value, unit, type: 'number', min, step, max });
const select = (key, label, options) => ({ key, label, options, type: 'select' });
const date = (key, label, value, optional = false) => ({ key, label, value, type: 'date', optional });
const time = (key, label, value) => ({ key, label, value, type: 'time' });
const section = (field, name) => ({ ...field, section: name });
export const currencies = [
  ['KRW', '🇰🇷 대한민국 원 KRW'], ['USD', '🇺🇸 미국 달러 USD'], ['JPY', '🇯🇵 일본 엔 JPY'], ['EUR', '🇪🇺 유로 EUR'],
  ['CNY', '🇨🇳 중국 위안 CNY'], ['GBP', '🇬🇧 영국 파운드 GBP'], ['SGD', '🇸🇬 싱가포르 달러 SGD'], ['HKD', '🇭🇰 홍콩 달러 HKD'],
  ['THB', '🇹🇭 태국 바트 THB'], ['VND', '🇻🇳 베트남 동 VND'], ['PHP', '🇵🇭 필리핀 페소 PHP'], ['IDR', '🇮🇩 인도네시아 루피아 IDR'],
  ['MYR', '🇲🇾 말레이시아 링깃 MYR'], ['AUD', '🇦🇺 호주 달러 AUD'], ['CAD', '🇨🇦 캐나다 달러 CAD'], ['CHF', '🇨🇭 스위스 프랑 CHF'],
  ['NZD', '🇳🇿 뉴질랜드 달러 NZD'], ['AED', '🇦🇪 아랍에미리트 디르함 AED']
];

export const forms = {
  loan: [money('principal', '대출금', 30000), number('rate', '연 금리', 4.2, '%'), number('years', '상환 기간', 30, '년', 1, 1, 100), select('method', '상환 방식', [['annuity', '원리금균등'], ['equal-principal', '원금균등']])],
  severance: [date('start', '입사일', '2021-01-01'), date('end', '퇴직일 (마지막 근무일 다음 날)', '2026-10-01'), money('wages', '퇴직 전 3개월 임금 합계', 1200), money('bonus', '3개월 평균임금에 반영할 상여·수당', 0, '연간 상여 총액이 아니라 3개월 산정분을 입력하세요.'), number('ordinaryDaily', '1일 통상임금 (모르면 0)', 0, '원'), number('weekHours', '4주 평균 주 소정근로시간', 40, '시간')],
  salary: [money('annual', '세전 연봉', 5000), money('nontax', '월 비과세 급여', 20), { ...number('incomeTax', '월 소득세 원천징수액', 150000, '원'), hint: '급여명세서의 소득세를 입력하세요. 지방소득세 10%는 자동 계산합니다.' }],
  'salary-reverse': [money('targetNet', '원하는 월 실수령액', 300), money('nontax', '월 비과세 급여', 20), { ...number('incomeTax', '월 소득세 원천징수 예상액', 150000, '원', 0, 1), hint: '지방소득세는 소득세의 10%로 추정합니다. 소득세액은 연봉 변화에 따라 자동 재산정하지 않습니다.' }],
  hourly: [{ ...number('hourly', '시급', 10320, '원'), hint: '2026년 최저임금 10,320원은 예시값입니다.' }, number('hours', '주 소정근로시간', 40, '시간', 0, 'any', 40), select('attendance', '소정근로일 개근 여부', [['yes', '개근'], ['no', '미개근']]), { ...number('holidayHours', '주휴 유급시간 (선택)', '', '시간', 0, 'any', 8), optional: true, hint: '근무일별 시간이 다르면 실제 주휴 유급시간을 입력하세요. 비우면 주 5일 균등 근무를 가정합니다.' }],
  savings: [select('type', '상품 종류', [['installment', '정기적금'], ['deposit', '정기예금']]), money('amount', '월 납입액 / 예치금', 50), number('rate', '연 이율', 3.5, '%'), number('months', '기간', 12, '개월', 1, 1, 600), { ...number('tax', '이자 과세율', 15.4, '%', 0, 'any', 100), hint: '15.4%는 일반 이자소득의 소득세 14%와 지방소득세 1.4%를 합친 예시값입니다.' }],
  vat: [select('mode', '금액 기준', [['excluded', '부가세 별도 (공급가액)'], ['included', '부가세 포함 (공급대가)']]), money('amount', '매출 금액', 1100), money('inputVat', '공제 가능한 매입세액', 30)],
  'dsr-ltv': [money('annual', '연소득', 6000), money('home', '주택 가치', 60000), money('loan', '신규 대출금', 30000), number('rate', '대출 연 금리', 4.2, '%'), number('years', '대출 기간', 30, '년', 1, 1, 100), money('existing', '기존 대출 연간 원리금', 500), { ...number('dsrLimit', '비교할 DSR 한도', 40, '%', 0, 'any', 100), hint: '40%는 비교용 예시값입니다. 실제 적용 한도는 대출 조건에 따라 다릅니다.' }, { ...number('ltvLimit', '비교할 LTV 한도', 70, '%', 0, 'any', 100), hint: '70%는 비교용 예시값입니다. 지역·주택·대출 유형별 기준을 확인하세요.' }],
  'apartment-cost': [
    section(money('price', '매매가격', 60000), '① 매매정보'), number('area', '전용면적 (참고용)', 84, '㎡'), { ...number('taxRate', '취득 관련 합산 세율', 1.1, '%', 0, 'any', 100), section: '② 취득·법무 비용', hint: '예시 세율입니다. 실제 계약 기준일의 세율을 직접 확인하세요.' },
    number('brokerageRate', '중개보수율 (VAT 별도)', 0.4, '%', 0, 'any', 100), money('legalFee', '법무사비', 100), money('bondDiscount', '국민주택채권 할인비용', 80), money('stamp', '인지·증지', 15), money('registry', '기타 등기비', 5),
    section(money('loan', '대출금', 40000), '③ 대출'), number('rate', '대출 연 금리', 3.8, '%'), number('years', '대출 기간', 30, '년', 1, 1, 100), select('method', '상환방식', [['annuity', '원리금균등'], ['equal-principal', '원금균등']]),
    section(money('moving', '이사비', 200), '④ 기타비용'), money('renovation', '인테리어·수리비', 700), money('loanCosts', '대출 부대비', 50), money('miscCost', '기타 비용', 50)
  ],
  'commercial-property': [
    section(money('price', '상가 매매가', 50000), '취득 정보'), { ...number('taxRate', '취득 관련 합산 세율', 4.6, '%', 0, 'any', 100), hint: '예시 세율입니다. 실제 거래 세금과 건물분 VAT를 확인하세요.' }, number('brokerageRate', '중개보수율 (VAT 별도)', 0.9, '%', 0, 'any', 100), money('legal', '법무·등기 비용', 200), money('other', '기타 취득비용', 100), money('deposit', '임차 보증금', 5000),
    section(money('rent', '월 임대료', 300), '임대 수입'), money('otherIncome', '기타 월수입', 0), number('vacancyRate', '공실률', 5, '%', 0, 'any', 100),
    section(money('ownerManagement', '소유주 부담 월 관리비', 30), '운영비'), money('propertyTax', '연 재산세', 100), money('insurance', '연 보험료', 30), money('repairs', '연 수선비', 100), money('otherOperating', '기타 연 운영비', 70),
    section(money('loan', '대출금', 25000), '대출'), number('rate', '대출 연 금리', 5, '%'), number('years', '대출 기간', 20, '년', 1, 1, 100), select('method', '상환방식', [['annuity', '원리금균등'], ['equal-principal', '원금균등']])
  ],
  discount: [number('price', '할인 전 상품 가격', 100000, '원', 0, 1), number('firstRate', '1차 할인율', 20, '%', 0, 'any', 100), number('secondRate', '추가 할인율', 10, '%', 0, 'any', 100), number('coupon', '쿠폰 할인 금액', 0, '원', 0, 1), number('points', '사용할 적립금·포인트', 0, '원', 0, 1), number('shipping', '배송비', 0, '원', 0, 1)],
  exchange: [number('amount', '환전할 금액', 1000, ''), select('from', '보내는 통화', [['USD', '🇺🇸 미국 달러 USD'], ...currencies.filter(([code]) => code !== 'USD')]), select('to', '받는 통화', currencies), number('rate', '1 보내는 통화당 받는 통화 환율', '', '', 0), number('fee', '환전 수수료', 1, '%', 0, 'any', 100), number('preferential', '환전 우대율', 0, '%', 0, 'any', 100)],
  'date-diff': [date('start', '시작일', 'today'), date('end', '종료일', 'today'), select('includeStart', '시작일 포함', [['no', '미포함'], ['yes', '포함']])],
  'date-offset': [date('base', '기준일', 'today'), number('days', '이동할 일수', 100, '일', 0, 1, 365000), select('direction', '방향', [['after', '일 후'], ['before', '일 전']])],
  dday: [date('target', '목표일', 'today'), date('start', '시작일 (비우면 오늘)', '', true)],
  'business-days': [date('start', '시작일', 'today'), date('end', '종료일', 'today'), select('includeStart', '시작일 포함', [['yes', '포함'], ['no', '미포함']])],
  'work-time': [time('startTime', '출근시각', '09:00'), time('endTime', '퇴근시각', '18:00'), number('breakMinutes', '휴게시간', 60, '분', 0, 1, 1439), { ...date('shiftDate', '근무 시작일 (선택)', '', true), hint: '야간근무 시작일을 선택하면 해당 근무의 누적 수입을 계산합니다. 비우면 자동 추정합니다.' }],
  'playback-speed': [number('hours', '영상 시간', 2, '시간', 0, 1, 999), number('minutes', '영상 분', 30, '분', 0, 1, 59), { key: 'speed', label: '재생 배속', type: 'pill', options: [['1', '1.0×'], ['1.25', '1.25×'], ['1.5', '1.5×'], ['1.75', '1.75×'], ['2', '2.0×'], ['custom', '직접 입력']] }, number('customSpeed', '직접 입력 배속', 1.5, '×', .1, 'any', 16), time('startTime', '시작 시각', 'now')],
  'work-clock': [time('startTime', '출근시각', '09:00'), time('endTime', '퇴근시각', '18:00'), number('breakMinutes', '점심·휴게시간', 60, '분', 0, 1, 1439), { ...date('shiftDate', '근무 시작일 (선택)', '', true), hint: '야간근무는 근무 시작일을 선택하면 해당 근무를 정확히 추적합니다. 비우면 자동 추정합니다.' }],
  'salary-clock': [select('salaryType', '월급 기준', [['gross', '세전 월급'], ['net', '실수령 월급']]), number('monthlySalary', '월급', 3000000, '원'), number('workDays', '월 근무일수', 22, '일', 1, 1, 31), number('dailyHours', '1일 근무시간', 8, '시간', .1, 'any', 23.9), time('startTime', '출근시각', '09:00'), time('endTime', '퇴근시각', '18:00'), number('breakMinutes', '휴게시간', 60, '분', 0, 1, 1439)]
};

export function fieldHtml(field) {
  const id = `field-${field.key}`;
  const heading = field.section ? `<h3 class="form-section">${field.section}</h3>` : '';
  if (field.type === 'pill') return `${heading}<fieldset class="field pill-field"><legend>${field.label}</legend><div class="pill-options">${field.options.map(([value,label], i) => `<label><input type="radio" name="${field.key}" value="${value}" ${i === 0 ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div></fieldset>`;
  const control = field.type === 'select'
    ? `<select id="${id}" name="${field.key}">${field.options.map(([value,label]) => `<option value="${value}">${label}</option>`).join('')}</select>`
    : `<input id="${id}" name="${field.key}" type="${field.type}" value="${field.value === 'today' || field.value === 'now' ? '' : field.value}" ${field.value === 'today' || field.value === 'now' ? `data-default="${field.value}"` : ''} ${field.type === 'number' ? `min="${field.min}" ${field.max === undefined ? '' : `max="${field.max}"`} step="${field.step}" inputmode="decimal"` : ''} ${field.optional ? '' : 'required'}>`;
  return `${heading}<div class="field"><label for="${id}">${field.label}</label><div class="control">${control}${field.unit ? `<span class="unit">${field.unit}</span>` : ''}</div>${field.hint ? `<small class="hint">${field.hint}</small>` : ''}</div>`;
}
