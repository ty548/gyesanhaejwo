import test from 'node:test';
import assert from 'node:assert/strict';
import { calculators, loanPayment, loanSchedule } from '../src/calculations.js';
import { loanBreakdown } from '../src/property.js';
import { lookupRate, rateErrorMessages, rateErrors } from '../src/rates.js';
import { currencies } from '../src/forms.js';

const row = (result, label) => result.rows.find(([name]) => name === label)?.[1];
const close = (a, b, tolerance = .01) => assert.ok(Math.abs(a - b) <= tolerance, `${a} ≠ ${b}`);

test('아파트 상세 비용·자기자본·중개 VAT가 합계와 일치', () => {
  const result = calculators['apartment-cost']({ price: 1000, area: 84, taxRate: 1, brokerageRate: .4, legalFee: 10, bondDiscount: 0, stamp: 0, registry: 0, moving: 0, renovation: 0, loanCosts: 0, miscCost: 0, loan: 500, rate: 0, years: 1, method: 'annuity' });
  close(row(result, '취득 관련 세금'), 100000);
  close(row(result, '중개보수'), 40000);
  close(row(result, '중개보수 VAT'), 4000);
  close(row(result, '총 필요금액'), 10244000);
  close(row(result, '필요한 자기자본'), 5244000);
  close(row(result, '1년차 총 상환액'), 5000000);
});

test('원리금균등·원금균등의 1년차 이자와 납입액', () => {
  const principal = 12000000, rate = 12;
  const annuity = loanBreakdown(principal, rate, 1, 'annuity', loanPayment);
  const equal = loanBreakdown(principal, rate, 1, 'equal-principal', loanPayment);
  close(annuity.firstPayment, loanPayment(principal, rate, 12));
  close(annuity.firstYearInterest, loanSchedule(principal, rate, 12).totalInterest);
  close(equal.firstPayment, 1120000);
  close(equal.firstYearInterest, principal * rate / 1200 * 6.5);
  close(equal.firstYearPayment, principal + equal.firstYearInterest);
});

test('상가 NOI·공실·Cap Rate·CoC·DSCR의 분모와 부채상환', () => {
  const result = calculators['commercial-property']({ price: 10000, taxRate: 0, brokerageRate: 0, legal: 0, other: 0, deposit: 0, rent: 100, otherIncome: 0, vacancyRate: 10, ownerManagement: 0, propertyTax: 0, insurance: 0, repairs: 0, otherOperating: 0, loan: 5000, rate: 0, years: 1, method: 'equal-principal' });
  close(row(result, '연 총임대수입'), 12000000);
  close(row(result, '공실 손실'), 1200000);
  close(row(result, 'NOI'), 10800000);
  close(row(result, 'Cap Rate (매매가 기준)'), 10.8);
  close(row(result, '연간 대출 상환액 (1년차)'), 50000000);
  close(row(result, '세전 현금흐름'), -39200000);
  close(row(result, 'CoC'), -78.4);
  close(row(result, 'DSCR'), .216);
});

test('환율 직접 입력·수수료 우대·동일 통화와 18개 통화', () => {
  assert.equal(currencies.length, 18);
  const result = calculators.exchange({ amount: 100, from: 'USD', to: 'KRW', rate: 1400, fee: 2, preferential: 50 });
  close(row(result, '수수료 반영 수령액'), 137200);
  close(row(result, '우대율 적용 수령액'), 138600);
  assert.equal(calculators.exchange({ amount: 100, from: 'USD', to: 'USD', rate: 9, fee: 9 }).rows[0][1], 100);
});

test('환율 API 오류 유형은 각각 직접 입력 안내로 연결', async () => {
  const cases = [
    [async () => { throw new Error('offline'); }, rateErrors.NETWORK_ERROR],
    [async () => ({ ok: false, status: 503 }), rateErrors.API_ERROR],
    [async () => ({ ok: false, status: 422, json: async () => ({ message: 'invalid currency: XXX' }) }), rateErrors.UNSUPPORTED_CURRENCY],
    [async () => ({ ok: false, status: 404, json: async () => ({ message: 'rate not found' }) }), rateErrors.MANUAL_RATE_REQUIRED],
    [async () => ({ ok: true, json: async () => ({ rate: 0, date: '2026-10-01' }) }), rateErrors.INVALID_RATE],
    [async () => ({ ok: true, json: async () => { throw new Error('bad json'); } }), rateErrors.INVALID_RATE]
  ];
  for (const [fetcher, error] of cases) {
    assert.deepEqual(await lookupRate(fetcher, 'USD', 'KRW'), { rate: null, date: null, error });
    assert.match(rateErrorMessages[error], /직접 환율을 입력/);
  }
  assert.deepEqual(await lookupRate(async () => ({ ok: true, json: async () => ({ rate: 1400, date: '2026-10-01' }) }), 'USD', 'KRW'), { rate: 1400, date: '2026-10-01', error: null });
  assert.deepEqual(await lookupRate(async () => { throw new Error('must not fetch'); }, 'KRW', 'KRW'), { rate: 1, date: null, error: null });
});
