import { appendCalculatorInput, backspaceCalculatorInput, clearCalculatorInput, evaluateExpression, formatCalculatorResult, toggleCalculatorSign } from './general-calculator.js';

export function setupGeneralCalculators() {
  const widgets = [...document.querySelectorAll('[data-general-calculator]')];
  for (const widget of widgets) {
    const display = widget.querySelector('.general-expression');
    const result = widget.querySelector('.general-result');
    let expression = '';
    let calculated = false;
    const show = () => { display.value = expression; display.scrollLeft = display.scrollWidth; };
    const action = key => {
      try {
        if (key === 'AC') { expression = clearCalculatorInput(); result.textContent = '0'; calculated = false; }
        else if (key === 'Backspace') { expression = backspaceCalculatorInput(expression); result.textContent = expression ? '입력 중' : '0'; calculated = false; }
        else if (key === '±') { expression = toggleCalculatorSign(expression); result.textContent = '입력 중'; calculated = false; }
        else if (key === '=') {
          const value = formatCalculatorResult(evaluateExpression(expression));
          result.textContent = value;
          expression = value.replaceAll('-', '−');
          calculated = true;
        } else {
          if (calculated && /[\d.(√]/.test(key)) expression = '';
          expression = appendCalculatorInput(expression, key);
          result.textContent = '입력 중';
          calculated = false;
        }
      } catch (error) { result.textContent = error.message || '계산식을 확인해 주세요.'; calculated = false; }
      show();
    };
    widget.addEventListener('click', event => {
      const button = event.target.closest('[data-key]');
      if (button && widget.contains(button)) action(button.dataset.key);
    });
    widget.addEventListener('keydown', event => {
      if (event.target.closest('[data-key]') && (event.key === 'Enter' || event.key === ' ')) return;
      const map = { '*': '×', '/': '÷', '-': '−', Enter: '=', Escape: 'AC', Backspace: 'Backspace' };
      const key = map[event.key] || event.key;
      if (!/^(?:\d|[.+−×÷()%²√]|=|AC|Backspace)$/.test(key)) return;
      event.preventDefault();
      action(key);
    });
    if (document.body.dataset.tool === 'calculator') {
      document.addEventListener('keydown', event => {
        if (widget.contains(event.target) || event.target.closest('a, button, summary, input, textarea, select, [contenteditable="true"], [role="button"]')) return;
        const map = { '*': '×', '/': '÷', '-': '−', Enter: '=', Escape: 'AC', Backspace: 'Backspace' };
        const key = map[event.key] || event.key;
        if (!/^(?:\d|[.+−×÷()%²√]|=|AC|Backspace)$/.test(key)) return;
        event.preventDefault();
        action(key);
      });
    }
  }
}
