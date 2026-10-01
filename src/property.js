const value = (input, label, fallback = 0) => {
  const raw = input ?? fallback, n = Number(raw);
  if (raw === '' || !Number.isFinite(n) || n < 0) throw new Error(`${label} 입력값을 확인해 주세요.`);
  return n;
};
const won = (input, label, fallback = 0) => value(input, label, fallback) * 10000;
const rate = (input, label, fallback = 0) => value(input, label, fallback) / 100;
const percent = (input, label, fallback = 0) => {
  const n = value(input, label, fallback);
  if (n > 100) throw new Error(`${label}은 0~100%로 입력해 주세요.`);
  return n / 100;
};
export function loanBreakdown(principal, annualRate, years, method, loanPayment) {
  const duration = value(years, '대출 기간');
  if (!Number.isInteger(duration) || duration < 1 || duration > 100) throw new Error('대출 기간은 1~100년의 정수로 입력해 주세요.');
  const months = duration * 12, firstPayment = loanPayment(principal, annualRate, months, method);
  let balance = principal, totalInterest = 0, firstYearInterest = 0, firstYearPayment = 0;
  for (let i = 0; i < months; i++) {
    const interest = balance * annualRate / 1200;
    const principalPaid = method === 'equal-principal' ? principal / months : Math.min(balance, firstPayment - interest);
    const payment = principalPaid + interest;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    if (i < 12) { firstYearInterest += interest; firstYearPayment += payment; }
  }
  return { firstPayment, firstYearPayment, firstYearInterest, totalInterest };
}
export function apartmentCost(v, loanPayment) {
  const price = won(v.price, '매매가격'), loan = won(v.loan, '대출금');
  if (!price) throw new Error('매매가격은 0보다 커야 합니다.');
  const tax = price * percent(v.taxRate, '취득 관련 합산 세율');
  const brokerage = price * percent(v.brokerageRate, '중개보수율');
  const brokerageVat = brokerage * .1;
  const legal = won(v.legalFee ?? v.legal, '법무사비');
  const bond = won(v.bondDiscount, '채권 할인비'), stamp = won(v.stamp, '인지·증지');
  const registry = won(v.registry, '기타 등기비');
  const moving = won(v.moving, '이사비'), renovation = won(v.renovation, '수리비');
  const loanCosts = won(v.loanCosts, '대출 부대비'), misc = won(v.miscCost ?? v.misc, '기타비용');
  const costs = tax + brokerage + brokerageVat + legal + bond + stamp + registry + moving + renovation + loanCosts + misc;
  const total = price + costs;
  if (loan > total) throw new Error('대출금은 구매 총비용을 넘을 수 없습니다.');
  const debt = loanBreakdown(loan, value(v.rate, '대출 금리'), v.years, v.method || 'annuity', loanPayment);
  return { rows: [
    ['필요한 자기자본', total - loan, 'money'], ['총 필요금액', total, 'money'], ['총 부대비용', costs, 'money'], ['첫 달 예상 상환액', debt.firstPayment, 'money'],
    ['매매가격', price, 'money'], ['취득 관련 세금', tax, 'money'], ['중개보수', brokerage, 'money'], ['중개보수 VAT', brokerageVat, 'money'],
    ['법무사비', legal, 'money'], ['채권 할인비', bond, 'money'], ['인지·증지', stamp, 'money'], ['기타 등기비', registry, 'money'],
    ['이사비', moving, 'money'], ['인테리어·수리비', renovation, 'money'], ['대출 부대비', loanCosts, 'money'], ['기타비용', misc, 'money'],
    ['1년차 총 상환액', debt.firstYearPayment, 'money'], ['1년차 이자', debt.firstYearInterest, 'money'], ['전체 예상 이자', debt.totalInterest, 'money']
  ], featured: [1, 0, 3], note: '참고용 계산입니다. 취득 관련 합산 세율과 중개보수율은 직접 입력하며 실제 계약·신고 기준일에 다시 확인하세요. 월 상환액은 첫 달 기준입니다.' };
}
export function commercialProperty(v, loanPayment) {
  const price = won(v.price, '매매가'), loan = won(v.loan, '대출금'), deposit = won(v.deposit, '임차 보증금');
  if (!price) throw new Error('상가 매매가는 0보다 커야 합니다.');
  const tax = price * percent(v.taxRate, '취득 관련 합산 세율');
  const brokerage = price * percent(v.brokerageRate, '중개보수율') * 1.1;
  const acquisition = tax + brokerage + won(v.legal, '법무·등기 비용') + won(v.other, '기타 취득비용');
  const total = price + acquisition, equity = total - loan - deposit;
  if (equity <= 0) throw new Error('대출금과 보증금의 합계가 취득 총비용 이상입니다. 실투자금을 확인해 주세요.');
  const gross = (won(v.rent, '월 임대료') + won(v.otherIncome, '기타 월수입')) * 12;
  const vacancy = v.vacancyRate === undefined ? won(v.vacancy, '연 공실비용') : gross * percent(v.vacancyRate, '공실률');
  const operating = v.ownerManagement === undefined ? won(v.cost, '월 운영비') * 12 : won(v.ownerManagement, '월 관리비') * 12 + won(v.propertyTax, '연 재산세') + won(v.insurance, '연 보험료') + won(v.repairs, '연 수선비') + won(v.otherOperating, '기타 연 운영비');
  const noi = gross - vacancy - operating;
  const debt = v.years === undefined
    ? { firstPayment: loan * rate(v.rate, '대출 금리') / 12, firstYearPayment: loan * rate(v.rate, '대출 금리'), firstYearInterest: loan * rate(v.rate, '대출 금리') }
    : loanBreakdown(loan, value(v.rate, '대출 금리'), v.years, v.method || 'annuity', loanPayment);
  const cashFlow = noi - debt.firstYearPayment;
  return { rows: [
    ['세전 현금흐름', cashFlow, 'money'], ['실제 투입 자기자본', equity, 'money'], ['취득 관련 총비용', acquisition, 'money'], ['Cap Rate (매매가 기준)', noi / price * 100, 'percent'],
    ['총 취득원가', total, 'money'], ['연 총임대수입', gross, 'money'], ['공실 손실', vacancy, 'money'], ['연 운영비', operating, 'money'], ['NOI', noi, 'money'],
    ['표면수익률', gross / price * 100, 'percent'], ['월 대출 상환액 (첫 달)', debt.firstPayment, 'money'], ['연간 대출 상환액 (1년차)', debt.firstYearPayment, 'money'],
    ['1년차 이자', debt.firstYearInterest, 'money'], ['CoC', cashFlow / equity * 100, 'percent'], ['DSCR', debt.firstYearPayment ? noi / debt.firstYearPayment : '대출 없음', debt.firstYearPayment ? 'ratio' : 'text']
  ], featured: [0, 1, 3], note: 'Cap Rate는 NOI ÷ 매매가, CoC는 세전 현금흐름 ÷ 실제 투입 자기자본, DSCR은 NOI ÷ 1년차 부채상환액입니다. 임차보증금 반환, 건물분 VAT, 소득세·매각 손익은 제외합니다.' };
}
