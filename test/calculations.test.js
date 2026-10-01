import test from 'node:test';
import assert from 'node:assert/strict';
import { loanPayment, loanSchedule, calculators } from '../src/calculations.js';

const close = (actual, expected, tolerance = 1) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('무이자 대출과 원금균등 첫 달 상환액', () => {
  close(loanPayment(12000000, 0, 12), 1000000);
  const result = loanSchedule(12000000, 12, 12, 'equal-principal');
  close(result.firstPayment, 1120000);
  assert.ok(result.totalInterest > 0);
});

test('퇴직금은 실제 3개월 달력 일수와 근속기간을 사용', () => {
  const result = calculators.severance({ start: '2025-01-01', end: '2026-01-01', periodStart: '2025-10-01', wages: 920, bonus: 0, weekHours: 40 });
  close(result.rows[0][1], 3000000);
  assert.equal(result.rows[1][1], 365);
});

test('주 15시간 미만이면 주휴수당 없음', () => {
  const result = calculators.hourly({ hourly: 10320, hours: 14, attendance: 'yes' });
  assert.equal(result.rows[1][1], 0);
});

test('부가세 포함 금액을 공급가액으로 분리', () => {
  const result = calculators.vat({ mode: 'included', amount: 110, inputVat: 0 });
  close(result.rows[1][1], 1000000);
  close(result.rows[2][1], 100000);
});

test('적금은 월별 이자와 이자 과세를 계산', () => {
  const result = calculators.savings({ type: 'installment', amount: 10, rate: 12, months: 2, tax: 0 });
  close(result.rows[0][1], 203000);
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

test('연봉 계산은 비과세액을 보험 기준에서 빼고 세액을 반영', () => {
  const result = calculators.salary({ annual: 1200, nontax: 10, incomeTax: 0 });
  const insurance = 900000 * (.0475 + .03595 + .004724 + .009);
  close(result.rows[0][1], 1000000 - insurance);
});

test('아파트 구매 자기자본은 총비용에서 대출금을 차감', () => {
  const result = calculators['apartment-cost']({ price: 60000, taxRate: 1, brokerageRate: 0, legal: 0, misc: 0, loan: 30000, rate: 0, years: 30 });
  close(result.rows[0][1], 306000000);
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
