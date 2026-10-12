import test from 'node:test';
import assert from 'node:assert/strict';
import { coinAverage, coinProfit, parseCoinDecimal, formatCoinDecimal } from '../src/coin.js';
import { calculators } from '../src/calculations.js';

const at = (result, label) => {
  const found = result.rows.find(row => row[0] === label);
  assert.ok(found, '결과 행 누락: ' + label);
  return found[1];
};
const baseAverage = {
  buyFee: '0', price1: '100000', qty1: '0.1',
  price2: '80000', qty2: '0.2',
  price3: '', qty3: '', price4: '', qty4: '',
  price5: '', qty5: '', extraPrice: '', extraQty: ''
};
const baseProfit = {
  buyPrice: '100', quantity: '1', sellPrice: '50', buyFee: '0', sellFee: '0'
};
test('21개 기존 계산기는 그대로 존재하고 코인 2개만 분리된 함수로 추가', () => {
  assert.equal(Object.keys(calculators).filter(name => name.startsWith('coin-')).length, 2);
  assert.equal(calculators['coin-average'], coinAverage);
  assert.equal(calculators['coin-profit'], coinProfit);
});
test('0.1 + 0.2 수량을 부동소수점 오차 없이 합산', () => {
  const r = coinAverage(baseAverage);
  assert.equal(at(r, '현재 보유 수량'), '0.3개');
  assert.equal(at(r, '현재 매입금액 (수수료 제외)'), '26,000원');
  assert.equal(at(r, '현재 평단가 (매수 수수료 포함)'), '86,666.666666666667원');
});
test('5회 분할매수와 물타기 가정을 분리해 표시', () => {
  const r = coinAverage({
    ...baseAverage, extraPrice: '70000', extraQty: '0.1',
    price3: '70000', qty3: '0.1', price4: '60000', qty4: '0.1', price5: '50000', qty5: '0.1'
  });
  assert.equal(at(r, '현재 보유 수량'), '0.6개');
  assert.equal(at(r, '추가 매수 후 보유 수량'), '0.7개');
  assert.equal(at(r, '추가 매수 후 총 원가'), '51,000원');
  assert.equal(at(r, '추가 매수 후 평단가'), '72,857.142857142857원');
  assert.deepEqual(r.featured, [0,1]);
});
test('매수 수수료는 원가에 더하고 평단에 반영', () => {
  const r = coinAverage({ ...baseAverage, buyFee: '0.1' });
  assert.equal(at(r, '현재 매수 수수료 합계'), '26원');
  assert.equal(at(r, '현재 총 매입 원가'), '26,026원');
  assert.equal(at(r, '현재 평단가 (매수 수수료 포함)'), '86,753.333333333333원');
});
test('소수 12자리와 극소 금액도 정밀도 손실 없이 처리', () => {
  const r = coinAverage({ buyFee:'0', price1:'0.000000000001', qty1:'0.000000000001', price2:'', qty2:'', price3:'', qty3:'', price4:'', qty4:'', price5:'', qty5:'', extraPrice:'', extraQty:'' });
  assert.equal(at(r, '현재 평단가 (매수 수수료 포함)'), '0.000000000001원');
  assert.equal(at(r, '현재 보유 수량'), '0.000000000001개');
  assert.equal(parseCoinDecimal('0.00000001','수량').toString(),'10000');
  assert.equal(formatCoinDecimal(parseCoinDecimal('0.1','수량') + parseCoinDecimal('0.2','수량')), '0.3');
});
test('편의 입력으로 일부 행은 비워도 되고 단독 가격/수량은 오류', () => {
  assert.equal(at(coinAverage({ ...baseAverage, price2:'', qty2:'' }), '현재 보유 수량'), '0.1개');
  assert.throws(() => coinAverage({ ...baseAverage, qty2:'' }), /함께 입력/);
  assert.throws(() => coinAverage({ ...baseAverage, extraPrice:'20000', extraQty:'' }), /함께 입력/);
  assert.throws(() => coinAverage({ ...baseAverage, price1:'', qty1:'', price2:'', qty2:'' }), /최소 한 번/);
});
test('수수료 및 0, 음수, 지수, 13자리 소수는 검증 실패', () => {
  assert.throws(() => coinAverage({ ...baseAverage, buyFee:'100' }), /100% 미만/);
  assert.throws(() => coinAverage({ ...baseAverage, price1:'0' }), /0보다 큰/);
  assert.throws(() => coinAverage({ ...baseAverage, qty1:'-1' }), /음수가 아닌/);
  assert.throws(() => coinAverage({ ...baseAverage, qty1:'1e-8' }), /지수 표기 불가/);
  assert.throws(() => coinAverage({ ...baseAverage, qty1:'0.1234567890123' }), /최대 12자리/);
});
test('수수료 없는 손실: -50원, -50%, 본전까지 +100%', () => {
  const r = coinProfit(baseProfit);
  assert.equal(at(r, '매도 시 순손익'), '-50원');
  assert.equal(at(r, '수수료 포함 수익률'), '-50%');
  assert.equal(at(r, '손익분기 매도가 (1개 기준)'), '100원');
  assert.equal(at(r, '현재가 대비 본전 필요 상승률'), '100%');
});
test('매수·매도 수수료 1%씩 적용하고 본전가격을 상향 계산', () => {
  const r = coinProfit({ ...baseProfit, sellPrice:'100', buyFee:'1', sellFee:'1' });
  assert.equal(at(r, '매도 시 순손익'), '-2원');
  assert.equal(at(r, '손익분기 매도가 (1개 기준)'), '102.020202020203원');
  assert.equal(at(r, '현재가 대비 본전 필요 상승률'), '2.020202020203%');
});
test('이미 이익이면 본전 필요 상승률은 0%', () => {
  const r = coinProfit({ ...baseProfit, sellPrice:'120' });
  assert.equal(at(r, '매도 시 순손익'), '20원');
  assert.equal(at(r, '수수료 포함 수익률'), '20%');
  assert.equal(at(r, '현재가 대비 본전 필요 상승률'), '0%');
});
test('매수·매도 각각 수수료가 적용되는 소수 보유 수량', () => {
  const r = coinProfit({ buyPrice:'100000', sellPrice:'120000', quantity:'0.3', buyFee:'0.1', sellFee:'0.1' });
  assert.equal(at(r, '총 매입 원가'), '30,030원');
  assert.equal(at(r, '매도 후 수령 예상액'), '35,964원');
  assert.equal(at(r, '매도 시 순손익'), '5,934원');
});
test('본전가격 산식은 절대 음수가 아니고 매도 수수료가 100%면 오류', () => {
  assert.throws(() => coinProfit({ ...baseProfit, sellFee:'100' }), /100% 미만/);
  assert.throws(() => coinProfit({ ...baseProfit, sellPrice:'0' }), /0보다 큰/);
  assert.throws(() => coinProfit({ ...baseProfit, quantity:'0' }), /0보다 큰/);
});
