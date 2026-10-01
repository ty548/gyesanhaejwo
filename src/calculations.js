const n = value => Number(value) || 0;
const pct = value => n(value) / 100;
const won = value => n(value) * 10000;
const daysBetween = (start, end) => (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;

export function loanPayment(principal, annualRate, months, method = 'annuity') {
  if (principal < 0 || months <= 0 || annualRate < 0) throw new Error('대출금, 금리, 기간을 확인해 주세요.');
  const monthlyRate = annualRate / 1200;
  if (method === 'equal-principal') return principal / months + principal * monthlyRate;
  if (!monthlyRate) return principal / months;
  return principal * monthlyRate / (1 - (1 + monthlyRate) ** -months);
}

export function loanSchedule(principal, annualRate, months, method = 'annuity') {
  if (principal < 0 || months <= 0 || annualRate < 0) throw new Error('대출금, 금리, 기간을 확인해 주세요.');
  let balance = principal, totalInterest = 0;
  const firstPayment = loanPayment(principal, annualRate, months, method);
  for (let month = 0; month < months; month++) {
    const interest = balance * annualRate / 1200;
    const principalPaid = method === 'equal-principal' ? principal / months : firstPayment - interest;
    totalInterest += interest;
    balance = Math.max(0, balance - principalPaid);
  }
  return { firstPayment, totalInterest, totalPayment: principal + totalInterest };
}

export const calculators = {
  loan: v => {
    const principal = won(v.principal), months = n(v.years) * 12;
    const x = loanSchedule(principal, n(v.rate), months, v.method);
    return { rows: [['첫 달 상환액', x.firstPayment, 'money'], ['총 이자', x.totalInterest, 'money'], ['총 상환액', x.totalPayment, 'money']], note: v.method === 'equal-principal' ? '원금균등 방식은 매달 납입액이 줄어듭니다. 표시한 값은 첫 달 기준입니다.' : '원리금균등 방식은 월 납입액이 일정합니다.' };
  },
  severance: v => {
    const serviceDays = daysBetween(v.start, v.end);
    if (!Number.isFinite(serviceDays) || serviceDays <= 0) throw new Error('입사일과 퇴직일을 확인해 주세요. 퇴직일은 마지막 근무일 다음 날입니다.');
    const threeMonthDays = daysBetween(v.periodStart, v.end);
    if (threeMonthDays <= 0 || threeMonthDays > 100) throw new Error('퇴직 전 3개월 시작일을 확인해 주세요.');
    const averageDaily = (won(v.wages) + won(v.bonus)) / threeMonthDays;
    const severance = serviceDays >= 365 && n(v.weekHours) >= 15 ? averageDaily * 30 * serviceDays / 365 : 0;
    return { rows: [['예상 퇴직금', severance, 'money'], ['계속근로기간', serviceDays, 'days'], ['1일 평균임금', averageDaily, 'money']], note: severance ? '평균임금 기준의 예상액입니다. 통상임금, 제외기간, 상여·연차수당, 퇴직소득세는 별도로 확인하세요.' : '1년 미만 근속 또는 주 15시간 미만이면 일반적인 법정 퇴직금 대상이 아닙니다.' };
  },
  salary: v => {
    const gross = won(v.annual) / 12, base = Math.max(0, gross - won(v.nontax));
    const pension = Math.min(base, 6590000) * .0475;
    const health = base * .03595, care = base * .004724, employment = base * .009;
    const incomeTax = Math.max(0, n(v.incomeTax)), localTax = incomeTax * .1;
    const insurance = pension + health + care + employment;
    return { rows: [['예상 월 실수령액', gross - insurance - incomeTax - localTax, 'money'], ['월 세전급여', gross, 'money'], ['4대보험 근로자 부담', insurance, 'money'], ['입력한 소득세·지방소득세', incomeTax + localTax, 'money']], note: '소득세는 근로소득 간이세액표·부양가족 등에 따라 달라집니다. 소득세 입력란에 급여명세서의 월 원천징수액을 넣어 보세요.' };
  },
  hourly: v => {
    const hourly = n(v.hourly), hours = n(v.hours), eligible = hours >= 15 && v.attendance === 'yes';
    const holidayHours = eligible ? Math.min(hours, 40) / 5 : 0;
    const weekly = hourly * (hours + holidayHours);
    return { rows: [['예상 월급', weekly * 365 / 7 / 12, 'money'], ['주휴수당 / 주', hourly * holidayHours, 'money'], ['주급', weekly, 'money'], ['주휴시간', holidayHours, 'hours']], note: hours > 40 ? '주 40시간을 초과하는 연장근로와 가산수당은 포함하지 않았습니다.' : '주휴수당은 4주 평균 주 15시간 이상이고 소정근로일을 개근한 경우로 계산합니다.' };
  },
  savings: v => {
    const months = n(v.months), rate = pct(v.rate), tax = pct(v.tax);
    if (months <= 0 || months > 600) throw new Error('기간은 1~600개월로 입력해 주세요.');
    const principal = v.type === 'deposit' ? won(v.amount) : won(v.amount) * months;
    const interest = v.type === 'deposit' ? principal * rate * months / 12 : won(v.amount) * rate / 12 * months * (months + 1) / 2;
    return { rows: [['세후 만기 수령액', principal + interest * (1 - tax), 'money'], ['납입 원금', principal, 'money'], ['세전 이자', interest, 'money'], ['이자 과세', interest * tax, 'money']], note: '단리와 월초 적금 납입을 가정합니다. 상품별 일수 계산, 우대금리, 세제 혜택은 반영하지 않았습니다.' };
  },
  vat: v => {
    const amount = won(v.amount), supply = v.mode === 'included' ? amount / 1.1 : amount;
    const outputVat = supply * .1, inputVat = won(v.inputVat);
    return { rows: [['예상 납부세액', Math.max(0, outputVat - inputVat), 'money'], ['공급가액', supply, 'money'], ['매출 부가세', outputVat, 'money'], ['공급대가', supply + outputVat, 'money']], note: '일반과세자 10% 기준의 단순 계산입니다. 면세·영세율·공제 불가 매입세액은 반영하지 않았습니다.' };
  },
  'dsr-ltv': v => {
    const annual = won(v.annual), home = won(v.home), loan = won(v.loan);
    if (!annual || !home) throw new Error('연소득과 주택가치를 입력해 주세요.');
    const annualPayment = loanPayment(loan, n(v.rate), n(v.years) * 12) * 12 + won(v.existing);
    const dsr = annualPayment / annual * 100, ltv = loan / home * 100;
    return { rows: [['DSR', dsr, 'percent'], ['LTV', ltv, 'percent'], ['연간 원리금 상환액', annualPayment, 'money'], ['입력 한도 내 여부', dsr <= n(v.dsrLimit) && ltv <= n(v.ltvLimit) ? '범위 내' : '초과', 'text']], note: '실제 대출 심사는 스트레스 금리, 대출 유형, 지역·보유주택 규정 등을 별도로 적용합니다. 입력 한도는 비교용입니다.' };
  },
  'apartment-cost': v => {
    const price = won(v.price), loan = won(v.loan), tax = price * pct(v.taxRate), brokerage = price * pct(v.brokerageRate) * 1.1;
    const costs = tax + brokerage + won(v.legal) + won(v.misc);
    const total = price + costs;
    return { rows: [['필요한 자기자본', total - loan, 'money'], ['구매 총비용', total, 'money'], ['취득 부대비용', costs, 'money'], ['월 대출 상환액', loanPayment(loan, n(v.rate), n(v.years) * 12), 'money']], note: '취득 관련 세율은 주택 수·가격·면적·지역 등에 따라 다릅니다. 정확한 합산 세율과 중개보수율을 입력하세요.' };
  },
  'commercial-property': v => {
    const price = won(v.price), loan = won(v.loan), deposit = won(v.deposit);
    const acquisition = price * pct(v.taxRate) + price * pct(v.brokerageRate) * 1.1 + won(v.other);
    const cash = price + acquisition - loan - deposit;
    const noi = (won(v.rent) - won(v.cost)) * 12 - won(v.vacancy);
    const interest = loan * pct(v.rate), cashFlow = noi - interest;
    return { rows: [['연간 현금흐름', cashFlow, 'money'], ['실투자금', cash, 'money'], ['취득 부대비용', acquisition, 'money'], ['순영업수익률', price ? noi / price * 100 : 0, 'percent'], ['실투자금 대비 수익률', cash > 0 ? cashFlow / cash * 100 : 0, 'percent']], note: '이자만 납부하는 대출을 가정합니다. 건물분 부가세, 소득세, 원금 상환과 매각 손익은 포함하지 않았습니다.' };
  },
  exchange: v => {
    const amount = n(v.amount), rate = n(v.rate), fee = pct(v.fee);
    if (rate <= 0) throw new Error('환율을 입력하거나 최신 환율을 불러와 주세요.');
    const converted = amount * rate;
    return { rows: [['수수료 반영 수령액', converted * (1 - fee), 'currency'], ['기준 환산액', converted, 'currency'], ['환전 비용', converted * fee, 'currency']], note: '기준 환율과 실제 은행의 현찰 매매율은 다를 수 있습니다. 환율 조회 날짜와 수수료를 확인하세요.' };
  }
};
