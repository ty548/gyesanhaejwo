import test from 'node:test';
import assert from 'node:assert/strict';
import { loanPayment, loanSchedule, calculators } from '../src/calculations.js';
import { forms } from '../src/forms.js';

const close = (actual, expected, tolerance = 1) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('무이자 대출과 원금균등 첫 달 상환액', () => {
  close(loanPayment(12000000, 0, 12), 1000000);
  const result = loanSchedule(12000000, 12, 12, 'equal-principal');
  close(result.firstPayment, 1120000);
  assert.ok(result.totalInterest > 0);
});

test('상환 기간은 정수 개월이어야 하며 지원하지 않는 방식은 거부', () => {
  assert.throws(() => loanSchedule(12000000, 4, 12.5), /대출금/);
  assert.throws(() => loanPayment(12000000, 4, 12, 'unknown'), /상환 방식/);
  assert.throws(() => calculators.loan({ principal: 1000, rate: 4, years: 1.1, method: 'annuity' }), /정수/);
});

test('대출 상환표 총액은 독립적인 원금·이자 합계와 일치', () => {
  const principal = 300000000, rate = 4.2, months = 360;
  const annuity = loanSchedule(principal, rate, months);
  close(annuity.totalPayment, annuity.firstPayment * months, .01);
  close(annuity.totalPayment, principal + annuity.totalInterest, .01);
  const equalPrincipal = loanSchedule(principal, rate, months, 'equal-principal');
  close(equalPrincipal.totalInterest, principal * rate / 1200 * (months + 1) / 2, .01);
});

test('퇴직금은 실제 3개월 달력 일수와 근속기간을 사용', () => {
  const result = calculators.severance({ start: '2025-01-01', end: '2026-01-01', periodStart: '2025-10-01', wages: 920, bonus: 0, weekHours: 40 });
  close(result.rows[0][1], 3000000);
  assert.equal(result.rows[1][1], 365);
});

test('퇴직금은 통상임금 하한과 윤년·월말 3개월 기간을 반영', () => {
  const result = calculators.severance({ start: '2025-02-28', end: '2026-05-31', wages: 100, bonus: 0, ordinaryDaily: 100000, weekHours: 40 });
  close(result.rows[0][1], 100000 * 30 * 457 / 365);
  assert.match(result.note, /92일/);
  assert.throws(() => calculators.severance({ start: '2025-01-01', end: '2026-02-30', wages: 100, bonus: 0, weekHours: 40 }), /날짜/);
  assert.throws(() => calculators.severance({ start: '2025-01-01', end: '2026-01-01', periodStart: '2025-12-01', wages: 100, bonus: 0, weekHours: 40 }), /3개월/);
});

test('주 15시간 미만이면 주휴수당 없음', () => {
  const result = calculators.hourly({ hourly: 10320, hours: 14, attendance: 'yes' });
  assert.equal(result.rows[1][1], 0);
});

test('주 40시간의 월 환산은 209시간이며 초과 소정시간은 거부', () => {
  const result = calculators.hourly({ hourly: 10320, hours: 40, attendance: 'yes' });
  close(result.rows[0][1], 2156880);
  assert.equal(result.rows[4][1], 209);
  assert.throws(() => calculators.hourly({ hourly: 10320, hours: 45, attendance: 'yes' }), /40시간/);
});

test('부가세 포함 금액을 공급가액으로 분리', () => {
  const result = calculators.vat({ mode: 'included', amount: 110, inputVat: 0 });
  close(result.rows[1][1], 1000000);
  close(result.rows[2][1], 100000);
});

test('매입세액이 더 크면 환급 가능액을 표시', () => {
  const result = calculators.vat({ mode: 'excluded', amount: 100, inputVat: 20 });
  assert.equal(result.rows[0][1], 0);
  close(result.rows[3][1], 100000);
});

test('적금은 월별 이자와 이자 과세를 계산', () => {
  const result = calculators.savings({ type: 'installment', amount: 10, rate: 12, months: 2, tax: 0 });
  close(result.rows[0][1], 203000);
});

test('적금 기간과 과세율의 유효 범위를 확인', () => {
  assert.throws(() => calculators.savings({ type: 'installment', amount: 10, rate: 3, months: 1.5, tax: 15.4 }), /정수/);
  assert.throws(() => calculators.savings({ type: 'deposit', amount: 10, rate: 3, months: 12, tax: 110 }), /0~100/);
});

test('DSR과 LTV는 입력한 분모를 사용', () => {
  const result = calculators['dsr-ltv']({ annual: 6000, home: 60000, loan: 30000, rate: 0, years: 30, existing: 0, dsrLimit: 40, ltvLimit: 70 });
  close(result.rows[0][1], 16.6666667, .0001);
  close(result.rows[1][1], 50);
});

test('환율 수수료는 환산액에서 차감', () => {
  const result = calculators.exchange({ amount: 100, rate: 1400, fee: 1 });
  close(result.rows[0][1], 138600);
});

test('환전 수수료 초과는 거부하고 같은 통화는 환전하지 않음', () => {
  assert.throws(() => calculators.exchange({ amount: 100, rate: 1400, fee: 120 }), /0~100/);
  const result = calculators.exchange({ amount: 100, rate: 2, fee: 5, from: 'USD', to: 'USD' });
  assert.equal(result.rows[0][1], 100);
  assert.equal(result.rows[2][1], 0);
});

test('연봉 계산은 비과세액을 보험 기준에서 빼고 세액을 반영', () => {
  const result = calculators.salary({ annual: 1200, nontax: 10, incomeTax: 0 });
  const insurance = 900000 * (.0475 + .03595 + .004724 + .009);
  close(result.rows[0][1], 1000000 - insurance);
});

test('2026년 국민연금 기준소득월액 하한과 과도한 비과세액을 확인', () => {
  const result = calculators.salary({ annual: 480, nontax: 0, incomeTax: 0 });
  const insurance = 410000 * .0475 + 400000 * (.03595 + .004724 + .009);
  close(result.rows[0][1], 400000 - insurance);
  assert.throws(() => calculators.salary({ annual: 1200, nontax: 101, incomeTax: 0 }), /비과세/);
  const upper = calculators.salary({ annual: 12000, nontax: 0, incomeTax: 0 });
  const upperInsurance = 6590000 * .0475 + 10000000 * (.03595 + .004724 + .009);
  close(upper.rows[0][1], 10000000 - upperInsurance);
});

test('아파트 구매 자기자본은 총비용에서 대출금을 차감', () => {
  const result = calculators['apartment-cost']({ price: 60000, taxRate: 1, brokerageRate: 0, legal: 0, misc: 0, loan: 30000, rate: 0, years: 30 });
  close(result.rows[0][1], 306000000);
});

test('구매 총비용 초과 대출과 실투자금이 없는 상가를 거부', () => {
  assert.throws(() => calculators['apartment-cost']({ price: 1000, taxRate: 0, brokerageRate: 0, legal: 0, misc: 0, loan: 1001, rate: 0, years: 30 }), /대출금/);
  assert.throws(() => calculators['commercial-property']({ price: 1000, taxRate: 0, brokerageRate: 0, other: 0, deposit: 500, loan: 500, rate: 5, rent: 10, cost: 0, vacancy: 0 }), /실투자금/);
});

test('상가 수익률은 공실과 대출이자를 차감', () => {
  const result = calculators['commercial-property']({ price: 50000, taxRate: 0, brokerageRate: 0, other: 0, deposit: 0, loan: 10000, rate: 5, rent: 100, cost: 0, vacancy: 200 });
  close(result.rows[0][1], 5000000);
  close(result.rows[3][1], 2);
});

test('예금은 단리와 이자 과세를 반영', () => {
  const result = calculators.savings({ type: 'deposit', amount: 100, rate: 12, months: 12, tax: 10 });
  close(result.rows[0][1], 1108000);
});

test('모든 계산기 기본 입력값은 유한한 결과를 생성', () => {
  for (const [slug, fields] of Object.entries(forms)) {
    const values = Object.fromEntries(fields.map(field => [field.key, ['select', 'pill'].includes(field.type) ? field.options[0][0] : field.value]));
    values.today = '2026-10-01';
    values.nowTime = '09:00';
    values.nowSeconds = 9 * 3600;
    if (slug === 'exchange') values.rate = 1400;
    const result = calculators[slug](values);
    assert.ok(result.rows.length > 0, `${slug}: 결과 없음`);
    for (const [, value] of result.rows) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), `${slug}: 유한하지 않은 값`);
    }
  }
});
