const MAX_LENGTH = 120;
const invalid = () => new Error('계산식을 확인해 주세요.');

export function evaluateExpression(expression) {
  if (typeof expression !== 'string' || !expression.trim() || expression.length > MAX_LENGTH) throw invalid();
  const source = expression.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-').replace(/\s/g, '');
  if (/[^\d.+\-*/()%²√]/.test(source)) throw invalid();
  let position = 0;
  const peek = () => source[position];
  const consume = character => peek() === character ? (position++, true) : false;
  const finite = value => {
    if (!Number.isFinite(value)) throw new Error('계산할 수 없는 값입니다.');
    return value;
  };

  function primary() {
    if (consume('(')) {
      const value = addition();
      if (!consume(')')) throw invalid();
      return value;
    }
    const start = position;
    while (/\d/.test(peek() || '')) position++;
    if (consume('.')) while (/\d/.test(peek() || '')) position++;
    const token = source.slice(start, position);
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw invalid();
    return finite(Number(token));
  }

  function postfix() {
    let value = primary();
    while (peek() === '%' || peek() === '²') {
      value = consume('%') ? value / 100 : (position++, value * value);
      finite(value);
    }
    return value;
  }

  function unary() {
    if (consume('+')) return unary();
    if (consume('-')) return -unary();
    if (consume('√')) {
      const value = unary();
      if (value < 0) throw new Error('음수의 제곱근은 계산할 수 없습니다.');
      return finite(Math.sqrt(value));
    }
    return postfix();
  }

  function multiplication() {
    let value = unary();
    while (peek() === '*' || peek() === '/') {
      const operator = source[position++];
      const right = unary();
      if (operator === '/' && right === 0) throw new Error('0으로 나눌 수 없습니다.');
      value = finite(operator === '*' ? value * right : value / right);
    }
    return value;
  }

  function addition() {
    let value = multiplication();
    while (peek() === '+' || peek() === '-') {
      const operator = source[position++];
      const right = multiplication();
      value = finite(operator === '+' ? value + right : value - right);
    }
    return value;
  }

  const result = addition();
  if (position !== source.length) throw invalid();
  return Object.is(result, -0) ? 0 : result;
}

export function appendCalculatorInput(expression, key) {
  if (typeof expression !== 'string' || !/^(?:\d|[.+−×÷()%²√])$/.test(key)) throw invalid();
  if (expression.length + key.length > MAX_LENGTH) throw new Error('계산식이 너무 깁니다.');
  return expression + key;
}

export const clearCalculatorInput = () => '';
export const backspaceCalculatorInput = expression => expression.slice(0, -1);

export function toggleCalculatorSign(expression) {
  if (!expression) return '−';
  const match = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)%?$/);
  if (!match) return expression;
  const start = expression.length - match[0].length;
  const prefix = expression.slice(0, start);
  const signIsUnary = prefix.endsWith('−') && (prefix.length === 1 || /[+−×÷(√]$/.test(prefix.slice(0, -1)));
  return `${signIsUnary ? prefix.slice(0, -1) : `${prefix}−`}${match[0]}`;
}

export function formatCalculatorResult(value) {
  if (!Number.isFinite(value)) throw new Error('계산할 수 없는 값입니다.');
  const result = Number(value.toPrecision(12)).toLocaleString('en-US', { useGrouping: false, maximumSignificantDigits: 12, notation: 'standard' });
  if (result.length > MAX_LENGTH) throw new Error('계산 가능한 범위를 초과했습니다.');
  return result;
}
