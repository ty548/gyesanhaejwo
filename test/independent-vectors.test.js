import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpression } from '../src/general-calculator.js';
import { calculators } from '../src/calculations.js';

const get = (result, label) => result.rows.find(([name]) => name === label)?.[1];
const near = (actual, expected, tolerance = 0.01) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

// Each set uses reference arithmetic or calendar expectations, rather than another call
// to the function under test. A and B are ordinary inputs; C is a boundary or error.
test('19개 계산기의 독립 참조값 A·B·경계 C', async t => {
  await t.test('일반 계산기', () => {
    near(evaluateExpression('(12+8)×3'), 60);
    near(evaluateExpression('200×10%'), 20);
    assert.throws(() => evaluateExpression('1÷0'), /0으로/);
  });
  await t.test('대출', () => {
    near(get(calculators.loan({ principal: 1200, rate: 0, years: 1, method: 'annuity' }), '첫 달 상환액'), 1000000);
    near(get(calculators.loan({ principal: 1200, rate: 12, years: 1, method: 'equal-principal' }), '첫 달 상환액'), 1120000);
    assert.throws(() => calculators.loan({ principal: -1, rate: 4, years: 1, method: 'annuity' }), /0 이상/);
  });
  await t.test('퇴직금', () => {
    near(get(calculators.severance({ start: '2025-01-01', end: '2026-01-01', wages: 920, bonus: 0, weekHours: 40 }), '예상 퇴직금'), 3000000);
    near(get(calculators.severance({ start: '2025-01-01', end: '2026-01-01', wages: 920, bonus: 0, ordinaryDaily: 110000, weekHours: 40 }), '예상 퇴직금'), 3300000);
    near(get(calculators.severance({ start: '2025-01-02', end: '2026-01-01', wages: 920, bonus: 0, weekHours: 40 }), '예상 퇴직금'), 0);
  });
  await t.test('연봉', () => {
    near(get(calculators.salary({ annual: 2400, nontax: 0, incomeTax: 0 }), '예상 월 실수령액'), 1805652);
    near(get(calculators.salary({ annual: 1200, nontax: 100, incomeTax: 0 }), '예상 월 실수령액'), 1000000);
    assert.throws(() => calculators.salary({ annual: 1200, nontax: 101, incomeTax: 0 }), /비과세/);
  });
  await t.test('시급', () => {
    near(get(calculators.hourly({ hourly: 10320, hours: 40, attendance: 'yes' }), '예상 월급'), 2156880);
    near(get(calculators.hourly({ hourly: 10320, hours: 16, attendance: 'yes', holidayHours: 8 }), '주휴수당 / 주'), 82560);
    near(get(calculators.hourly({ hourly: 10320, hours: 14, attendance: 'yes' }), '주휴수당 / 주'), 0);
  });
  await t.test('예금·적금', () => {
    near(get(calculators.savings({ type: 'deposit', amount: 100, rate: 12, months: 12, tax: 15.4 }), '세후 만기 수령액'), 1101520);
    near(get(calculators.savings({ type: 'installment', amount: 10, rate: 12, months: 2, tax: 0 }), '세전 이자'), 3000);
    near(get(calculators.savings({ type: 'deposit', amount: 100, rate: 0, months: 12, tax: 15.4 }), '세전 이자'), 0);
  });
  await t.test('부가세', () => {
    near(get(calculators.vat({ mode: 'excluded', amount: 100, inputVat: 3 }), '예상 납부세액'), 70000);
    near(get(calculators.vat({ mode: 'included', amount: 110, inputVat: 0 }), '매출 부가세'), 100000);
    near(get(calculators.vat({ mode: 'excluded', amount: 0, inputVat: 0 }), '예상 납부세액'), 0);
  });
  await t.test('DSR·LTV', () => {
    const input = { annual: 6000, home: 60000, rate: 0, years: 30, existing: 0, dsrLimit: 40, ltvLimit: 70 };
    near(get(calculators['dsr-ltv']({ ...input, loan: 30000 }), '단순 DSR'), 100 / 6);
    near(get(calculators['dsr-ltv']({ ...input, loan: 30000 }), '단순 LTV'), 50);
    near(get(calculators['dsr-ltv']({ ...input, loan: 0 }), '단순 DSR'), 0);
  });
  await t.test('아파트 구매', () => {
    const input = { price: 1000, taxRate: 1, brokerageRate: .4, loan: 500, rate: 0, years: 1, legalFee: 10 };
    near(get(calculators['apartment-cost'](input), '총 필요금액'), 10244000);
    near(get(calculators['apartment-cost'](input), '필요한 자기자본'), 5244000);
    assert.throws(() => calculators['apartment-cost']({ ...input, loan: 2000 }), /대출금/);
  });
  await t.test('상가', () => {
    const input = { price: 10000, taxRate: 0, brokerageRate: 0, legal: 0, other: 0, deposit: 0, rent: 100, otherIncome: 0, vacancyRate: 10, ownerManagement: 0, propertyTax: 0, insurance: 0, repairs: 0, otherOperating: 0, loan: 5000, rate: 0, years: 1, method: 'equal-principal' };
    near(get(calculators['commercial-property'](input), 'NOI'), 10800000);
    near(get(calculators['commercial-property'](input), 'DSCR'), .216);
    assert.throws(() => calculators['commercial-property']({ ...input, loan: 10000 }), /실투자금/);
  });
  await t.test('환율', () => {
    near(get(calculators.exchange({ amount: 100, from: 'USD', to: 'KRW', rate: 1400, fee: 1 }), '수수료 반영 수령액'), 138600);
    near(get(calculators.exchange({ amount: 100, from: 'USD', to: 'USD', rate: 0, fee: 1 }), '수수료 반영 수령액'), 100);
    assert.throws(() => calculators.exchange({ amount: 100, from: 'USD', to: 'KRW', rate: 0, fee: 1 }), /환율/);
  });
  await t.test('날짜 차이', () => {
    near(get(calculators['date-diff']({ start: '2026-01-01', end: '2026-01-11', includeStart: 'no' }), '총 일수'), 10);
    near(get(calculators['date-diff']({ start: '2026-01-11', end: '2026-01-01', includeStart: 'no' }), '총 일수'), 10);
    near(get(calculators['date-diff']({ start: '2024-02-28', end: '2024-03-01', includeStart: 'no' }), '총 일수'), 2);
  });
  await t.test('날짜 전후', () => {
    assert.match(get(calculators['date-offset']({ base: '2026-10-01', days: 100, direction: 'after' }), '계산한 날짜'), /^2027-01-09/);
    assert.match(get(calculators['date-offset']({ base: '2026-12-31', days: 1, direction: 'after' }), '계산한 날짜'), /^2027-01-01/);
    assert.throws(() => calculators['date-offset']({ base: '2025-02-29', days: 1, direction: 'after' }), /존재/);
  });
  await t.test('D-Day', () => {
    assert.equal(get(calculators.dday({ start: '2026-10-01', target: '2026-10-11' }), 'D-Day'), 'D-10');
    assert.equal(get(calculators.dday({ start: '2026-10-11', target: '2026-10-01' }), 'D-Day'), 'D+10');
    assert.equal(get(calculators.dday({ start: '2026-10-01', target: '2026-10-01' }), 'D-Day'), 'D-Day');
  });
  await t.test('영업일', () => {
    near(get(calculators['business-days']({ start: '2026-09-28', end: '2026-10-04', includeStart: 'yes' }), '평일 수'), 5);
    near(get(calculators['business-days']({ start: '2026-09-28', end: '2026-10-04', includeStart: 'no' }), '평일 수'), 4);
    near(get(calculators['business-days']({ start: '2026-10-03', end: '2026-10-04', includeStart: 'yes' }), '평일 수'), 0);
  });
  await t.test('근무시간', () => {
    assert.equal(get(calculators['work-time']({ startTime: '09:00', endTime: '18:00', breakMinutes: 60 }), '실제 근무시간'), '8시간 0분');
    assert.equal(get(calculators['work-time']({ startTime: '22:00', endTime: '06:00', breakMinutes: 60 }), '실제 근무시간'), '7시간 0분');
    assert.throws(() => calculators['work-time']({ startTime: '09:00', endTime: '10:00', breakMinutes: 61 }), /휴게시간/);
  });
  await t.test('영상 배속', () => {
    assert.equal(get(calculators['playback-speed']({ hours: 2, minutes: 30, speed: '1.5', startTime: '13:00' }), '실제 시청시간'), '1시간 40분');
    assert.equal(get(calculators['playback-speed']({ hours: 2, minutes: 30, speed: '2', startTime: '23:30' }), '종료 예상 시각'), '00:45 (+1일)');
    assert.throws(() => calculators['playback-speed']({ hours: 0, minutes: 0, speed: '1', startTime: '13:00' }), /0보다/);
  });
  await t.test('퇴근시계', () => {
    assert.equal(get(calculators['work-clock']({ startTime: '09:00', endTime: '18:00', breakMinutes: 60, nowSeconds: 8 * 3600 }), '퇴근 상태'), '근무 시작 전');
    assert.equal(get(calculators['work-clock']({ startTime: '22:00', endTime: '06:00', breakMinutes: 60, nowSeconds: 23 * 3600 }), '퇴근 상태'), '근무 중');
    assert.equal(get(calculators['work-clock']({ startTime: '22:00', endTime: '06:00', breakMinutes: 60, nowSeconds: 7 * 3600 }), '퇴근 상태'), '퇴근 완료');
  });
  await t.test('월급시계', () => {
    const input = { monthlySalary: 3000000, workDays: 20, dailyHours: 8, startTime: '09:00', endTime: '18:00', breakMinutes: 60, salaryType: 'gross' };
    near(get(calculators['salary-clock']({ ...input, nowSeconds: 8 * 3600 }), '오늘 번 돈'), 0);
    near(get(calculators['salary-clock']({ ...input, nowSeconds: 13 * 3600 }), '오늘 번 돈'), 150000 * 4 / 9);
    near(get(calculators['salary-clock']({ ...input, nowSeconds: 19 * 3600 }), '오늘 번 돈'), 150000);
  });
});
