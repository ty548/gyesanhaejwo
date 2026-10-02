import test from 'node:test';
import assert from 'node:assert/strict';
import { calculators } from '../src/calculations.js';

const row = (result, label) => result.rows.find(([name]) => name === label)?.[1];
const near = (actual, expected, tolerance = 0.01) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

// 고용노동부 노동포털 퇴직금 계산 예제: 1,080일, 92일, 임금 7,080,000원,
// 상여 가산 1,000,000원, 연차수당 가산 75,000원.
test('고용노동부 퇴직금 공식 예제와 결과 비교', () => {
  const result = calculators.severance({ start: '2014-10-02', end: '2017-09-16', wages: 708, bonus: 107.5, ordinaryDaily: 0, weekHours: 40 });
  near(row(result, '계속근로기간'), 1080);
  near(row(result, '1일 평균임금'), 8155000 / 92);
  near(row(result, '예상 퇴직금'), 8155000 / 92 * 30 * 1080 / 365);
});

// 국민연금공단: 2026년 사업장 근로자 4.75%, 2026.7.1~ 기준소득월액 41만~659만원.
// 국민건강보험공단: 2026년 근로자 건강 3.595%, 장기요양 0.4724%.
// 고용보험: 근로자 실업급여 0.9%.
test('2026년 급여 보험료 독립 산식과 상·하한 비교', () => {
  const standard = calculators.salary({ annual: 2400, nontax: 0, incomeTax: 0 });
  const expected = 2000000 - 95000 - 71900 - 9448 - 18000;
  near(row(standard, '예상 월 실수령액'), expected);
  const lower = calculators.salary({ annual: 480, nontax: 0, incomeTax: 0 });
  near(row(lower, '4대보험 근로자 부담'), 410000 * .0475 + 400000 * (.03595 + .004724 + .009));
  const upper = calculators.salary({ annual: 12000, nontax: 0, incomeTax: 0 });
  near(row(upper, '4대보험 근로자 부담'), 6590000 * .0475 + 10000000 * (.03595 + .004724 + .009));
});

// 고용노동부 2026년 최저임금 고시: 10,320원 × 209시간 = 2,156,880원.
test('2026년 공식 최저임금 월 환산 예제 비교', () => {
  const result = calculators.hourly({ hourly: 10320, hours: 40, attendance: 'yes' });
  near(row(result, '월 환산 시간'), 209);
  near(row(result, '예상 월급'), 2156880);
  near(row(result, '주휴수당 / 주'), 82560);
});

test('불균등 주 2일 근무의 주휴시간은 직접 입력해 반영', () => {
  const result = calculators.hourly({ hourly: 10320, hours: 16, attendance: 'yes', holidayHours: 8 });
  near(row(result, '주휴수당 / 주'), 82560);
  near(row(result, '주급'), 10320 * 24);
  assert.throws(() => calculators.hourly({ hourly: 10320, hours: 16, attendance: 'yes', holidayHours: 9 }), /0~8시간/);
});

// 국세청 일반과세자 10%: 공급가액 100만원, 매출세액 10만원.
test('일반과세자 부가세 공급가액 독립 예제 비교', () => {
  const excluded = calculators.vat({ mode: 'excluded', amount: 100, inputVat: 3 });
  near(row(excluded, '매출 부가세'), 100000);
  near(row(excluded, '예상 납부세액'), 70000);
  const included = calculators.vat({ mode: 'included', amount: 110, inputVat: 0 });
  near(row(included, '공급가액'), 1000000);
  near(row(included, '매출 부가세'), 100000);
});

// 국세청 일반 이자소득 원천징수 14% + 지방세법 특별징수 10% = 15.4%.
test('일반 예금 이자소득 세후 계산 예제 비교', () => {
  const result = calculators.savings({ type: 'deposit', amount: 100, rate: 12, months: 12, tax: 15.4 });
  near(row(result, '세전 이자'), 120000);
  near(row(result, '이자 과세'), 18480);
  near(row(result, '세후 만기 수령액'), 1101520);
});
