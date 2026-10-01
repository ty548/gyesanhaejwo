import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExpression, appendCalculatorInput, backspaceCalculatorInput, clearCalculatorInput, toggleCalculatorSign, formatCalculatorResult } from '../src/general-calculator.js';

test('사칙연산과 연산자 우선순위', () => {
  assert.equal(evaluateExpression('2+3'), 5);
  assert.equal(evaluateExpression('10-7'), 3);
  assert.equal(evaluateExpression('6×7'), 42);
  assert.equal(evaluateExpression('10÷4'), 2.5);
  assert.equal(evaluateExpression('2+3×4'), 14);
});

test('소수·백분율·괄호·제곱·제곱근', () => {
  assert.equal(evaluateExpression('0.1+0.2'), 0.30000000000000004);
  assert.equal(formatCalculatorResult(evaluateExpression('0.1+0.2')), '0.3');
  assert.equal(formatCalculatorResult(evaluateExpression('1÷10000000')), '0.0000001');
  assert.equal(evaluateExpression('200×10%'), 20);
  assert.equal(evaluateExpression('(2+3)×4'), 20);
  assert.equal(evaluateExpression('5²'), 25);
  assert.equal(evaluateExpression('√(81)'), 9);
});

test('0으로 나누기와 잘못된 식은 오류로 안내', () => {
  assert.throws(() => evaluateExpression('2÷0'), /0으로 나눌 수 없습니다/);
  assert.throws(() => evaluateExpression('(2+3'), /계산식을 확인/);
  assert.throws(() => evaluateExpression('alert(1)'), /계산식을 확인/);
  assert.throws(() => evaluateExpression('√(−1)'), /음수의 제곱근/);
});

test('키패드 입력·부호·한 글자 삭제·전체 지우기', () => {
  const expression = appendCalculatorInput(appendCalculatorInput('', '2'), '+');
  assert.equal(expression, '2+');
  assert.equal(backspaceCalculatorInput(expression), '2');
  assert.equal(clearCalculatorInput(), '');
  assert.equal(toggleCalculatorSign('5+2'), '5+−2');
  assert.equal(toggleCalculatorSign('5+−2'), '5+2');
  assert.equal(evaluateExpression(toggleCalculatorSign('5+2')), 3);
  assert.throws(() => appendCalculatorInput('', '<'), /계산식을 확인/);
});
