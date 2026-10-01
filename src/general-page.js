const keys = [
  ['AC', 'AC', 'utility'], ['±', '±', 'utility extended'], ['%', '%', 'utility'], ['⌫', 'Backspace', 'utility'],
  ['(', '(', 'extended'], [')', ')', 'extended'], ['√', '√', 'extended'], ['x²', '²', 'extended'],
  ['7', '7'], ['8', '8'], ['9', '9'], ['÷', '÷', 'operator'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['×', '×', 'operator'],
  ['1', '1'], ['2', '2'], ['3', '3'], ['−', '−', 'operator'],
  ['0', '0'], ['.', '.'], ['=', '=', 'equals'], ['+', '+', 'operator']
];

const labels = { AC: '모두 지우기', '±': '부호 바꾸기', Backspace: '한 글자 지우기', '√': '제곱근', '²': '제곱', '=': '결과 계산하기' };
const miniKeys = [keys[0], keys[3], keys[2], keys[11], ...keys.slice(8, 11), keys[15], ...keys.slice(12, 15), keys[19], ...keys.slice(16, 19), keys[23], ...keys.slice(20, 23)];

export function generalCalculatorMarkup(compact = false) {
  return `<div class="general-calculator${compact ? ' general-calculator-mini' : ''}" data-general-calculator>
    <div class="general-display"><label class="sr-only" for="${compact ? 'mini' : 'full'}-expression">계산식</label><input id="${compact ? 'mini' : 'full'}-expression" class="general-expression" value="" placeholder="0" readonly inputmode="none" aria-describedby="${compact ? 'mini' : 'full'}-keyboard-help"><output class="general-result" aria-live="polite" aria-atomic="true">0</output></div>
    <div class="general-keys">${(compact ? miniKeys : keys).map(([label, key, kind = '']) => `<button type="button" data-key="${key}" class="general-key ${kind}" aria-label="${labels[key] || label}">${label}</button>`).join('')}</div>
    <p id="${compact ? 'mini' : 'full'}-keyboard-help" class="general-help">키보드 숫자·연산자 입력 · Enter 계산 · Esc 초기화</p>
  </div>`;
}
