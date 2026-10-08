import test from 'node:test';
import assert from 'node:assert/strict';
import { calculators, loanSchedule } from '../src/calculations.js';
import { workClock, workTime, playbackSpeed, dateOffset, businessDays } from '../src/date-time.js';

const row = (result, label) => result.rows.find(([name]) => name === label)?.[1];
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.01, `${actual} ≠ ${expected}`);

test('대출은 무이자·원금균등·잘못된 원금을 구분', () => {
  const zero = loanSchedule(12000000, 0, 12);
  close(zero.firstPayment, 1000000);
  close(zero.totalInterest, 0);
  const equal = loanSchedule(12000000, 12, 12, 'equal-principal');
  close(equal.firstPayment, 1120000);
  close(equal.totalPayment, 12780000);
  assert.throws(() => calculators.loan({ principal: -1, rate: 4, years: 1, method: 'annuity' }), /0 이상/);
});

test('퇴직금은 365일·주 15시간의 자격 경계를 구분', () => {
  const input = { end: '2026-01-01', wages: 900, bonus: 0, ordinaryDaily: 0, weekHours: 15 };
  assert.equal(row(calculators.severance({ ...input, start: '2025-01-02' }), '예상 퇴직금'), 0);
  assert.ok(row(calculators.severance({ ...input, start: '2025-01-01' }), '예상 퇴직금') > 0);
  assert.equal(row(calculators.severance({ ...input, start: '2025-01-01', weekHours: 14.9 }), '예상 퇴직금'), 0);
});

test('연봉 계산은 0 보험 기준과 과도한 세액을 처리', () => {
  const exempt = calculators.salary({ annual: 1200, nontax: 100, incomeTax: 0 });
  close(row(exempt, '예상 월 실수령액'), 1000000);
  assert.throws(() => calculators.salary({ annual: 1200, nontax: 0, incomeTax: 1000000 }), /초과/);
});

test('시급 주휴수당은 15시간과 개근 경계를 처리', () => {
  const input = { hourly: 10320, attendance: 'yes' };
  close(row(calculators.hourly({ ...input, hours: 14.99 }), '주휴수당 / 주'), 0);
  close(row(calculators.hourly({ ...input, hours: 15 }), '주휴수당 / 주'), 30960);
  close(row(calculators.hourly({ ...input, hours: 15, attendance: 'no' }), '주휴수당 / 주'), 0);
});

test('예금·적금은 0% 금리와 100% 이자 과세를 처리', () => {
  const input = { amount: 10, rate: 0, months: 12, tax: 0 };
  close(row(calculators.savings({ ...input, type: 'deposit' }), '세후 만기 수령액'), 100000);
  close(row(calculators.savings({ ...input, type: 'installment' }), '세후 만기 수령액'), 1200000);
  close(row(calculators.savings({ ...input, type: 'deposit', rate: 12, tax: 100 }), '세후 만기 수령액'), 100000);
});

test('부가세는 매출 0과 매입세액 초과를 처리', () => {
  const zero = calculators.vat({ mode: 'excluded', amount: 0, inputVat: 0 });
  close(row(zero, '예상 납부세액'), 0);
  const refund = calculators.vat({ mode: 'excluded', amount: 100, inputVat: 20 });
  close(row(refund, '환급 가능액'), 100000);
  assert.throws(() => calculators.vat({ mode: 'unknown', amount: 100, inputVat: 0 }), /기준/);
});

test('DSR·LTV는 0 대출과 0 분모를 구분', () => {
  const input = { annual: 6000, home: 60000, loan: 0, rate: 4, years: 30, existing: 0, dsrLimit: 40, ltvLimit: 70 };
  const result = calculators['dsr-ltv'](input);
  close(row(result, '단순 DSR'), 0);
  close(row(result, '단순 LTV'), 0);
  assert.throws(() => calculators['dsr-ltv']({ ...input, annual: 0 }), /연소득/);
  assert.throws(() => calculators['dsr-ltv']({ ...input, home: 0 }), /주택가치/);
});

test('아파트 비용은 부대비와 대출금의 합계 경계를 처리', () => {
  const input = { price: 1000, taxRate: 0, brokerageRate: 0, legal: 0, misc: 0, loan: 1000, rate: 0, years: 1 };
  const result = calculators['apartment-cost'](input);
  close(row(result, '필요한 자기자본'), 0);
  close(row(result, '전체 예상 이자'), 0);
  assert.throws(() => calculators['apartment-cost']({ ...input, loan: 1000.01 }), /대출금/);
});

test('상가 수익률은 공실 100%와 자기자본 0을 처리', () => {
  const input = { price: 1000, taxRate: 0, brokerageRate: 0, legal: 0, other: 0, deposit: 0, rent: 100, otherIncome: 0, vacancyRate: 100, ownerManagement: 0, propertyTax: 0, insurance: 0, repairs: 0, otherOperating: 0, loan: 0, rate: 0, years: 1 };
  const result = calculators['commercial-property'](input);
  close(row(result, 'NOI'), 0);
  close(row(result, 'Cap Rate (매매가 기준)'), 0);
  assert.throws(() => calculators['commercial-property']({ ...input, loan: 1000 }), /실투자금/);
});

test('환율은 0 금액·0 환율·동일 통화를 처리', () => {
  const input = { amount: 0, from: 'USD', to: 'KRW', rate: 1400, fee: 1, preferential: 0 };
  close(row(calculators.exchange(input), '수수료 반영 수령액'), 0);
  assert.throws(() => calculators.exchange({ ...input, amount: 1, rate: 0 }), /환율/);
  close(row(calculators.exchange({ ...input, amount: 100, to: 'USD', rate: 0 }), '수수료 반영 수령액'), 100);
});

test('날짜·시간 도구는 범위 오류와 주말 경계를 안내', () => {
  assert.throws(() => dateOffset({ base: '2026-12-31', days: -1, direction: 'after' }), /일수/);
  assert.throws(() => workTime({ startTime: '22:00', endTime: '06:00', breakMinutes: 500 }), /휴게시간/);
  assert.throws(() => playbackSpeed({ hours: 0, minutes: 0, speed: '1', startTime: '12:00' }), /0보다/);
  const weekend = businessDays({ start: '2026-10-03', end: '2026-10-04', includeStart: 'yes' });
  assert.deepEqual(weekend.rows.slice(0, 3).map(([, value]) => value), [0, 2, 2]);
});

test('퇴근시계는 야간 퇴근 후 완료 상태를 표시', () => {
  const result = workClock({ startTime: '22:00', endTime: '06:00', breakMinutes: 60, nowSeconds: 7 * 3600 });
  assert.equal(row(result, '퇴근 상태'), '퇴근 완료');
  assert.equal(row(result, '현재까지 근무시간'), '7시간 0분');
  assert.equal(result.progress, 100);
  const next = workClock({ startTime: '22:00', endTime: '06:00', breakMinutes: 60, nowSeconds: 21 * 3600 });
  assert.equal(row(next, '퇴근 상태'), '근무 시작 전');
  assert.equal(next.progress, 0);
});
