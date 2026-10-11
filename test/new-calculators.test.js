import test from 'node:test';
import assert from 'node:assert/strict';
import { calculators } from '../src/calculations.js';
const row = (result, label) => result.rows.find(([name]) => name === label)?.[1];
const near = (actual, expected, tolerance = 0.01) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);
test('연봉 역산은 기존 정방향 계산과 동일하고 목표 월 실수령액에 도달', () => {
  for (const targetNet of [100, 300, 500]) {
    const args = { targetNet, nontax: 20, incomeTax: 150000 };
    const result = calculators['salary-reverse'](args);
    const annualWon = row(result, '필요한 세전 연봉');
    const direct = calculators.salary({ annual: annualWon / 10000, nontax: args.nontax, incomeTax: args.incomeTax });
    near(row(result, '예상 월 실수령액'), row(direct, '예상 월 실수령액'));
    assert.ok(row(result, '예상 월 실수령액') >= targetNet * 10000 - 0.001);
    assert.ok(row(result, '예상 월 실수령액') - targetNet * 10000 < 2);
  }
});
test('역산은 비과세 전액·0원·과도한 입력을 처리', () => {
  near(row(calculators['salary-reverse']({ targetNet: 100, nontax: 100, incomeTax: 0 }), '필요한 세전 월급'), 1000000);
  near(row(calculators['salary-reverse']({ targetNet: 0, nontax: 0, incomeTax: 0 }), '필요한 세전 연봉'), 0);
  assert.throws(() => calculators['salary-reverse']({ targetNet: -1, nontax: 0, incomeTax: 0 }), /0 이상/);
  assert.throws(() => calculators['salary-reverse']({ targetNet: 100, nontax: 0, incomeTax: -1 }), /0 이상/);
});
test('할인율은 순차 할인을 합산하지 않고 정확히 계산', () => {
  const args = { price: 100000, firstRate: 20, secondRate: 10, coupon: 5000, points: 1000, shipping: 3000 };
  const result = calculators.discount(args);
  near(row(result, '1차 할인 후 가격'), 80000);
  near(row(result, '2차 할인 후 가격'), 72000);
  near(row(result, '배송 전 결제액'), 66000);
  near(row(result, '최종 결제액'), 69000);
  near(row(result, '총 절감액 (포인트 포함)'), 34000);
  near(row(result, '실질 절감률 (배송비 제외)'), 34);
});
test('할인율 경계: 무료·전액할인·초과쿠폰·반올림·잘못된 값', () => {
  const base = { price: 100000, firstRate: 0, secondRate: 0, coupon: 0, points: 0, shipping: 0 };
  near(row(calculators.discount({ ...base, price: 0, shipping: 3000 }), '최종 결제액'), 3000);
  near(row(calculators.discount({ ...base, firstRate: 100 }), '최종 결제액'), 0);
  near(row(calculators.discount({ ...base, coupon: 200000, points: 30000, shipping: 3000 }), '최종 결제액'), 3000);
  near(row(calculators.discount({ ...base, price: 101, firstRate: 50 }), '최종 결제액'), 51);
  assert.throws(() => calculators.discount({ ...base, firstRate: 101 }), /0~100/);
  assert.throws(() => calculators.discount({ ...base, shipping: -1 }), /0 이상/);
  assert.throws(() => calculators.discount({ ...base, price: 0.5 }), /정수/);
});
test('기존 주휴수당 계산 결과는 변경하지 않음', () => {
  const result = calculators.hourly({ hourly: 10320, hours: 40, attendance: 'yes' });
  near(row(result, '주휴수당 / 주'), 82560);
  near(row(result, '예상 월급'), 2156880);
});
