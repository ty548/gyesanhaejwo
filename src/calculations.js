import { dateTimeCalculators, dateUtc } from './date-time.js';
import { apartmentCost, commercialProperty } from './property.js';

const n = value => {
  const result = Number(value);
  if (value === '' || value == null || !Number.isFinite(result) || result < 0) {
    throw new Error('금액과 비율은 0 이상의 숫자로 입력해 주세요.');
  }
  return result;
};
const pct = value => n(value) / 100;
const won = value => n(value) * 10000;
const percent = value => {
  const result = n(value);
  if (result > 100) throw new Error('비율은 0~100%로 입력해 주세요.');
  return result / 100;
};
const monthsFromYears = value => {
  const years = n(value);
  if (!Number.isInteger(years) || years < 1 || years > 100) throw new Error('기간은 1~100년의 정수로 입력해 주세요.');
  return years * 12;
};
const parseDate = value => dateUtc(value);
const daysBetween = (start, end) => (parseDate(end) - parseDate(start)) / 86400000;
const threeMonthsBefore = end => {
  const date = parseDate(end);
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 3, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return first.toISOString().slice(0, 10);
};

export function loanPayment(principal, annualRate, months, method = 'annuity') {
  if (![principal, annualRate, months].every(Number.isFinite) || principal < 0 || annualRate < 0 || !Number.isInteger(months) || months <= 0 || !['annuity', 'equal-principal'].includes(method)) throw new Error('대출금, 금리, 기간, 상환 방식을 확인해 주세요.');
  const monthlyRate = annualRate / 1200;
  if (method === 'equal-principal') return principal / months + principal * monthlyRate;
  if (!monthlyRate) return principal / months;
  return principal * monthlyRate / (1 - (1 + monthlyRate) ** -months);
}

export function loanSchedule(principal, annualRate, months, method = 'annuity') {
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
    const principal = won(v.principal), months = monthsFromYears(v.years);
    const x = loanSchedule(principal, n(v.rate), months, v.method);
    return { rows: [['첫 달 상환액', x.firstPayment, 'money'], ['총 이자', x.totalInterest, 'money'], ['총 상환액', x.totalPayment, 'money']], note: v.method === 'equal-principal' ? '원금균등 방식은 매달 납입액이 줄어듭니다. 표시한 값은 첫 달 기준입니다.' : '원리금균등 방식은 월 납입액이 일정합니다.' };
  },
  severance: v => {
    const serviceDays = daysBetween(v.start, v.end);
    if (serviceDays <= 0) throw new Error('입사일과 퇴직일을 확인해 주세요. 퇴직일은 마지막 근무일 다음 날입니다.');
    const periodStart = threeMonthsBefore(v.end);
    if (v.periodStart && v.periodStart !== periodStart) throw new Error('퇴직 전 3개월 시작일은 퇴직일 기준으로 계산해 주세요.');
    const threeMonthDays = daysBetween(periodStart, v.end);
    const averageDaily = (won(v.wages) + won(v.bonus)) / threeMonthDays;
    const ordinaryDaily = n(v.ordinaryDaily ?? 0);
    const appliedDaily = Math.max(averageDaily, ordinaryDaily);
    const eligible = serviceDays >= 365 && n(v.weekHours) >= 15;
    const severance = eligible ? appliedDaily * 30 * serviceDays / 365 : 0;
    return { rows: [['예상 퇴직금', severance, 'money'], ['계속근로기간', serviceDays, 'days'], ['1일 평균임금', averageDaily, 'money'], ['적용한 1일 임금', appliedDaily, 'money']], note: eligible ? `${ordinaryDaily > averageDaily ? '통상임금이 평균임금보다 높아 통상임금을 적용했습니다. ' : ''}${ordinaryDaily === 0 ? '통상임금을 입력하지 않으면 결과가 낮을 수 있습니다. ' : ''}퇴직 전 3개월 ${threeMonthDays}일 기준입니다. 제외기간, 상여·연차수당의 포함 범위와 퇴직소득세는 별도로 확인하세요.` : '1년 미만 근속 또는 4주 평균 주 15시간 미만이면 일반적인 법정 퇴직금 대상이 아닙니다.' };
  },
  salary: v => {
    const gross = won(v.annual) / 12, nontax = won(v.nontax);
    if (nontax > gross) throw new Error('월 비과세 급여가 월 세전급여보다 클 수 없습니다.');
    const base = gross - nontax;
    const pension = (base ? Math.min(Math.max(base, 410000), 6590000) : 0) * .0475;
    const health = base * .03595, care = base * .004724, employment = base * .009;
    const incomeTax = Math.max(0, n(v.incomeTax)), localTax = incomeTax * .1;
    const insurance = pension + health + care + employment;
    if (insurance + incomeTax + localTax > gross) throw new Error('보험료와 입력한 소득세가 월 세전급여를 초과합니다.');
    return { rows: [['예상 월 실수령액', gross - insurance - incomeTax - localTax, 'money'], ['월 세전급여', gross, 'money'], ['4대보험 근로자 부담', insurance, 'money'], ['입력한 소득세·지방소득세', incomeTax + localTax, 'money']], note: '소득세는 근로소득 간이세액표·부양가족 등에 따라 달라집니다. 소득세 입력란에 급여명세서의 월 원천징수액을 넣어 보세요.' };
  },
  hourly: v => {
    const hourly = n(v.hourly), hours = n(v.hours);
    if (hours > 40) throw new Error('주 소정근로시간은 40시간 이내로 입력해 주세요. 연장근로는 별도 계산이 필요합니다.');
    if (!['yes', 'no'].includes(v.attendance)) throw new Error('개근 여부를 선택해 주세요.');
    const eligible = hours >= 15 && v.attendance === 'yes';
    const holidayHours = eligible ? hours / 5 : 0;
    const weekly = hourly * (hours + holidayHours);
    const monthlyHours = Math.round((hours + holidayHours) * 365 / 7 / 12);
    return { rows: [['예상 월급', hourly * monthlyHours, 'money'], ['주휴수당 / 주', hourly * holidayHours, 'money'], ['주급', weekly, 'money'], ['주휴시간', holidayHours, 'hours'], ['월 환산 시간', monthlyHours, 'hours']], note: '월 환산 시간은 달력 평균을 정수 시간으로 반올림합니다. 주휴수당은 4주 평균 주 15시간 이상이고 소정근로일을 개근한 경우로 계산합니다.' };
  },
  savings: v => {
    const months = n(v.months), rate = pct(v.rate), tax = percent(v.tax);
    if (!Number.isInteger(months) || months <= 0 || months > 600) throw new Error('기간은 1~600개월의 정수로 입력해 주세요.');
    if (!['deposit', 'installment'].includes(v.type)) throw new Error('상품 종류를 선택해 주세요.');
    const principal = v.type === 'deposit' ? won(v.amount) : won(v.amount) * months;
    const interest = v.type === 'deposit' ? principal * rate * months / 12 : won(v.amount) * rate / 12 * months * (months + 1) / 2;
    return { rows: [['세후 만기 수령액', principal + interest * (1 - tax), 'money'], ['납입 원금', principal, 'money'], ['세전 이자', interest, 'money'], ['이자 과세', interest * tax, 'money']], note: '단리와 월초 적금 납입을 가정합니다. 상품별 일수 계산, 우대금리, 세제 혜택은 반영하지 않았습니다.' };
  },
  vat: v => {
    if (!['included', 'excluded'].includes(v.mode)) throw new Error('금액 기준을 선택해 주세요.');
    const amount = won(v.amount), supply = v.mode === 'included' ? amount / 1.1 : amount;
    const outputVat = supply * .1, inputVat = won(v.inputVat);
    return { rows: [['예상 납부세액', Math.max(0, outputVat - inputVat), 'money'], ['공급가액', supply, 'money'], ['매출 부가세', outputVat, 'money'], ['환급 가능액', Math.max(0, inputVat - outputVat), 'money'], ['공급대가', supply + outputVat, 'money']], note: '일반과세자 10% 기준의 단순 계산입니다. 환급 여부와 시기는 신고 내용에 따라 달라집니다. 면세·영세율·공제 불가 매입세액은 반영하지 않았습니다.' };
  },
  'dsr-ltv': v => {
    const annual = won(v.annual), home = won(v.home), loan = won(v.loan);
    if (!annual || !home) throw new Error('연소득과 주택가치를 입력해 주세요.');
    const dsrLimit = percent(v.dsrLimit) * 100, ltvLimit = percent(v.ltvLimit) * 100;
    const annualPayment = loanPayment(loan, n(v.rate), monthsFromYears(v.years)) * 12 + won(v.existing);
    const dsr = annualPayment / annual * 100, ltv = loan / home * 100;
    return { rows: [['DSR', dsr, 'percent'], ['LTV', ltv, 'percent'], ['연간 원리금 상환액', annualPayment, 'money'], ['입력 한도 내 여부', dsr <= dsrLimit && ltv <= ltvLimit ? '범위 내' : '초과', 'text']], note: '신규 대출은 원리금균등 방식의 월 상환액 12회로 단순 계산합니다. 실제 심사는 스트레스 금리, 대출 유형, 지역·보유주택 규정 등을 별도로 적용합니다. 입력 한도는 비교용입니다.' };
  },
  'apartment-cost': v => {
    return apartmentCost(v, loanPayment);
  },
  'commercial-property': v => {
    return commercialProperty(v, loanPayment);
  },
  exchange: v => {
    const amount = n(v.amount), sameCurrency = v.from && v.to && v.from === v.to;
    const rate = sameCurrency ? 1 : n(v.rate), fee = sameCurrency ? 0 : percent(v.fee);
    const preferential = sameCurrency ? 0 : percent(v.preferential ?? 0);
    if (rate <= 0) throw new Error('환율을 입력하거나 최신 환율을 불러와 주세요.');
    const converted = amount * rate;
    const effectiveFee = fee * (1 - preferential);
    return { rows: [['수수료 반영 수령액', converted * (1 - fee), 'currency'], ['기준 환산액', converted, 'currency'], ['환전 비용', converted * fee, 'currency'], ['우대율 적용 수령액', converted * (1 - effectiveFee), 'currency'], ['우대 후 환전 비용', converted * effectiveFee, 'currency']], note: sameCurrency ? '같은 통화는 환전하지 않으므로 환율 1과 수수료 0으로 계산합니다.' : '우대율은 입력 수수료에만 적용합니다. 기준 환율과 실제 은행 현찰 매매율·스프레드는 다를 수 있습니다.' };
  },
  ...dateTimeCalculators
};
