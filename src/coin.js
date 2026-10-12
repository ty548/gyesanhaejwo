// Exact, browser-only spot-trading estimations. No market APIs or trading calls.
// The input convention is KRW per coin and coin quantity; up to 12 decimal places.
// Product units preserve 24 decimal places until display rounding.
const SCALE = 1000000000000n;
const ONE_HUNDRED = SCALE * 100n;

export function parseCoinDecimal(value, label, allowZero = false) {
  const source = String(value ?? '').trim();
  if (!/^\d{1,15}(?:\.\d{1,12})?$/.test(source)) {
    throw new Error(label + ': 음수가 아닌 숫자를 소수점 이하 최대 12자리로 입력해 주세요. (지수 표기 불가)');
  }
  const [integer, fractional = ''] = source.split('.');
  const scaled = BigInt(integer) * SCALE + BigInt(fractional.padEnd(12, '0') || '0');
  if (!allowZero && scaled === 0n) throw new Error(label + ': 0보다 큰 값을 입력해 주세요.');
  return scaled;
}

const abs = value => value < 0n ? -value : value;
const roundDiv = (value, divisor) => {
  if (divisor <= 0n) throw new Error('계산 분모가 0 이하입니다.');
  const signed = value < 0n ? -1n : 1n;
  return signed * ((abs(value) + divisor / 2n) / divisor);
};
const ceilDiv = (value, divisor) => (value + divisor - 1n) / divisor;
export function formatCoinDecimal(value) {
  const sign = value < 0n ? '-' : '';
  const positive = abs(value);
  const whole = (positive / SCALE).toLocaleString('ko-KR');
  const fraction = (positive % SCALE).toString().padStart(12, '0').replace(/0+$/, '');
  return sign + whole + (fraction ? '.' + fraction : '');
}
const money = raw => formatCoinDecimal(roundDiv(raw, SCALE)) + '원';
const quantity = scaled => formatCoinDecimal(scaled) + '개';
const coinPrice = scaled => formatCoinDecimal(scaled) + '원';
const percent = (numerator, denominator) =>
  denominator === 0n ? '계산 불가' : formatCoinDecimal(roundDiv(numerator * ONE_HUNDRED, denominator)) + '%';

function feePercent(value, label) {
  const fee = parseCoinDecimal(value, label, true);
  if (fee >= ONE_HUNDRED) throw new Error(label + ': 0% 이상 100% 미만으로 입력해 주세요.');
  return fee;
}
const calcFee = (grossRaw, fee) => roundDiv(grossRaw * fee, ONE_HUNDRED);
const entry = (label, value) => [label, value, 'text'];

function optionalPair(values, priceKey, quantityKey, label) {
  const hasPrice = values[priceKey] !== undefined && String(values[priceKey]).trim() !== '';
  const hasQty = values[quantityKey] !== undefined && String(values[quantityKey]).trim() !== '';
  if (hasPrice !== hasQty) throw new Error(label + ': 가격과 수량을 함께 입력하거나 모두 비워 주세요.');
  if (!hasPrice) return null;
  return {
    price: parseCoinDecimal(values[priceKey], label + ' 가격'),
    amount: parseCoinDecimal(values[quantityKey], label + ' 수량')
  };
}

export function coinAverage(values) {
  const fee = feePercent(values.buyFee, '매수 수수료율');
  let totalQty = 0n, totalGross = 0n, totalFees = 0n, count = 0;
  for (let index = 1; index <= 5; index++) {
    const buy = optionalPair(values, 'price' + index, 'qty' + index, index + '회차 매수');
    if (!buy) continue;
    const gross = buy.price * buy.amount;
    totalQty += buy.amount;
    totalGross += gross;
    totalFees += calcFee(gross, fee);
    count++;
  }
  if (!count) throw new Error('최소 한 번의 매수 가격과 수량을 입력해 주세요.');
  const totalCost = totalGross + totalFees;
  const avg = roundDiv(totalCost, totalQty);
  const additional = optionalPair(values, 'extraPrice', 'extraQty', '추가 매수 시뮬레이션');
  const rows = [entry('현재 평단가 (매수 수수료 포함)', coinPrice(avg))];
  if (additional) {
    const extraGross = additional.price * additional.amount;
    const extraFee = calcFee(extraGross, fee);
    const newQuantity = totalQty + additional.amount;
    const newCost = totalCost + extraGross + extraFee;
    rows.push(entry('추가 매수 후 평단가', coinPrice(roundDiv(newCost, newQuantity))));
    rows.push(entry('추가 매수 후 보유 수량', quantity(newQuantity)));
    rows.push(entry('추가 매수 후 총 원가', money(newCost)));
    rows.push(entry('추가 매수 예상 수수료', money(extraFee)));
  }
  rows.push(entry('현재 보유 수량', quantity(totalQty)));
  rows.push(entry('현재 매입금액 (수수료 제외)', money(totalGross)));
  rows.push(entry('현재 매수 수수료 합계', money(totalFees)));
  rows.push(entry('현재 총 매입 원가', money(totalCost)));
  rows.push(entry('합산된 매수 횟수', count + '회'));
  return {
    rows,
    featured: additional ? [0, 1] : [0],
    note: '매수 수수료를 원화 매입원가에 더한 현물 거래 평단가입니다. 최대 5회 분할매수 기록과 별도 추가 매수 가정을 입력할 수 있습니다. 입력은 최대 소수 12자리, 내부 거래금액은 소수 24자리로 보존한 뒤 결과를 표시합니다. 매도 수수료·세금·스프레드 및 거래소의 별도 반올림 규칙은 반영하지 않습니다.'
  };
}

export function coinProfit(values) {
  const buyPrice = parseCoinDecimal(values.buyPrice, '평균 매수가');
  const currentPrice = parseCoinDecimal(values.sellPrice, '현재 매도가');
  const qty = parseCoinDecimal(values.quantity, '보유 수량');
  const buyFeeRate = feePercent(values.buyFee, '매수 수수료율');
  const sellFeeRate = feePercent(values.sellFee, '매도 수수료율');
  const grossBuy = buyPrice * qty;
  const grossSell = currentPrice * qty;
  const buyFee = calcFee(grossBuy, buyFeeRate);
  const sellFee = calcFee(grossSell, sellFeeRate);
  const cost = grossBuy + buyFee;
  const proceeds = grossSell - sellFee;
  const profit = proceeds - cost;
  const breakEvenPrice = ceilDiv(cost * ONE_HUNDRED, qty * (ONE_HUNDRED - sellFeeRate));
  const additionalRise = breakEvenPrice > currentPrice ? breakEvenPrice - currentPrice : 0n;
  return {
    rows: [
      entry('매도 시 순손익', money(profit)),
      entry('수수료 포함 수익률', percent(profit, cost)),
      entry('손익분기 매도가 (1개 기준)', coinPrice(breakEvenPrice)),
      entry('현재가 대비 본전 필요 상승률', percent(additionalRise, currentPrice)),
      entry('총 매입 원가', money(cost)),
      entry('매도 후 수령 예상액', money(proceeds)),
      entry('매수 수수료', money(buyFee)),
      entry('매도 수수료', money(sellFee)),
      entry('보유 수량', quantity(qty))
    ],
    featured: [0, 1, 2, 3],
    note: '현물 코인 전체 수량을 입력한 현재 매도가로 매도한다고 가정합니다. 매수 수수료는 원가에 더하고 매도 수수료는 매도 금액에서 뺍니다. 손익분기 가격은 수수료를 충당하는 최소 이론가이며, 본전 필요 상승률은 이미 본전 이상이면 0%입니다. 최대 소수 12자리 입력 기준으로 계산하며 세금·슬리피지·호가 차이·거래소 반올림은 제외합니다.'
  };
}

export const coinCalculators = {
  'coin-average': coinAverage,
  'coin-profit': coinProfit
};
