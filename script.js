const display = document.getElementById('display');
let firstValue = null;
let operator = null;
let waitingForSecond = false;
let secondValue = ''; // string for building the second operand
let justComputed = false; // when true, typing a number should replace the display (start new input)

let FEATURES = {};

function updateDisplay(text) {
  display.textContent = String(text);
  // detect overflow and toggle fade indicator
  checkOverflow();
}

// load config.json to set feature flags (if present)
fetch('config.json').then(r => r.json()).then(cfg => {
  FEATURES = cfg.features || {};
  updateFeatureIndicator();
}).catch(() => {
  // no config found — FEATURES remains {}
});

function updateFeatureIndicator() {
  const el = document.getElementById('feature-indicator');
  if (!el) return;
  if (FEATURES && FEATURES.claude_haiku_4_5) {
    el.textContent = 'Claude Haiku 4.5: ON';
    el.classList.add('on');
  } else {
    el.textContent = '';
    el.classList.remove('on');
  }
}

function checkOverflow() {
  // if content wider than visible area, show fade at left
  if (display.scrollWidth > display.clientWidth + 2) display.classList.add('has-overflow');
  else display.classList.remove('has-overflow');
}

// update on resize as well
window.addEventListener('resize', checkOverflow);
// initial check
setTimeout(checkOverflow, 0);

function inputNumber(num) {
  // If we just computed a result and no operator is selected, start a new number
  if (justComputed && operator === null) {
    updateDisplay(num);
    justComputed = false;
    return;
  }

  // if we are entering the second operand, build it and show both values
  if (operator !== null) {
    if (waitingForSecond) {
      secondValue = num;
      waitingForSecond = false;
    } else {
      secondValue = (secondValue === '0') ? num : secondValue + num;
    }
    updateDisplay(`${removeTrailingZeros(firstValue)} ${operator} ${secondValue}`);
    justComputed = false;
    return;
  }

  // no operator yet — normal input for first value
  if (display.textContent === '0') updateDisplay(num);
  else updateDisplay(display.textContent + num);
  justComputed = false;
}

function inputDecimal() {
  // If we just computed and no operator, start a new decimal number
  if (justComputed && operator === null) {
    updateDisplay('0.');
    justComputed = false;
    return;
  }

  if (operator !== null) {
    if (waitingForSecond) {
      secondValue = '0.';
      waitingForSecond = false;
    } else if (!secondValue.includes('.')) {
      secondValue = secondValue === '' ? '0.' : secondValue + '.';
    }
    updateDisplay(`${removeTrailingZeros(firstValue)} ${operator} ${secondValue}`);
    justComputed = false;
    return;
  }

  if (waitingForSecond) {
    updateDisplay('0.');
    waitingForSecond = false;
    return;
  }
  if (!display.textContent.includes('.')) display.textContent += '.';
  justComputed = false;
}

function clearAll() {
  firstValue = null;
  operator = null;
  waitingForSecond = false;
  secondValue = '';
  updateDisplay('0');
}

function backspace() {
  // if we are typing second value, remove last char of secondValue
  if (operator !== null && secondValue !== '') {
    secondValue = secondValue.slice(0, -1);
    if (secondValue === '') updateDisplay(`${removeTrailingZeros(firstValue)} ${operator}`);
    else updateDisplay(`${removeTrailingZeros(firstValue)} ${operator} ${secondValue}`);
    return;
  }

  // otherwise operate on main display
  let text = display.textContent;
  if (text.length <= 1) updateDisplay('0');
  else updateDisplay(text.slice(0, -1));
}

function percent() {
  if (operator !== null && secondValue !== '') {
    const value = parseFloat(secondValue);
    if (isNaN(value)) return;
    secondValue = String(removeTrailingZeros(value / 100));
    updateDisplay(`${removeTrailingZeros(firstValue)} ${operator} ${secondValue}`);
    return;
  }
  const value = parseFloat(display.textContent);
  if (isNaN(value)) return;
  updateDisplay(removeTrailingZeros(value / 100));
}

function handleOperator(nextOperator) {
  // if operator already set and we have a secondValue, compute first
  if (operator !== null && secondValue !== '') {
    const inputValue = parseFloat(secondValue);
    const result = compute(firstValue, inputValue, operator);
    if (result === 'Erro') {
      updateDisplay('Erro');
      firstValue = null;
      operator = null;
      secondValue = '';
      waitingForSecond = false;
      return;
    }
    firstValue = result;
    secondValue = '';
  } else if (firstValue == null) {
    // no firstValue yet — take from display
    firstValue = parseFloat(display.textContent);
  }

  operator = nextOperator;
  waitingForSecond = true;
  updateDisplay(`${removeTrailingZeros(firstValue)} ${operator}`);
}

function equals() {
  if (!operator) return;
  // if second value is being typed, use it; otherwise try to parse from display
  const inputValue = (secondValue !== '') ? parseFloat(secondValue) : parseFloat(display.textContent);
  if (isNaN(inputValue)) return;
  const result = compute(firstValue, inputValue, operator);
  updateDisplay(result === 'Erro' ? 'Erro' : removeTrailingZeros(result));
  firstValue = null;
  operator = null;
  secondValue = '';
  waitingForSecond = false;
  justComputed = true; // mark that the last action produced a result
}

function compute(a, b, op) {
  if (isNaN(a) || isNaN(b)) return b;
  let res;
  switch (op) {
    case '+': res = a + b; break;
    case '-': res = a - b; break;
    case '×': res = a * b; break;
    case '÷':
      if (b === 0) return 'Erro';
      res = a / b; break;
    default: return b;
  }
  return Number.isFinite(res) ? parseFloat(res.toFixed(10)) : 'Erro';
}

function removeTrailingZeros(n) {
  if (typeof n !== 'number') return n;
  return parseFloat(String(n));
}

// Event delegation for buttons
const buttons = document.querySelector('.buttons');
buttons.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const btnText = btn.textContent.trim();

  if (!action) return; // safety

  switch (action) {
    case 'number': inputNumber(btnText); break;
    case 'decimal': inputDecimal(); break;
    case 'clear': clearAll(); break;
    case 'backspace': backspace(); break;
    case 'percent': percent(); break;
    case 'operator': handleOperator(btnText); break;
    case 'equals': equals(); break;
    default: break;
  }
});

// Keyboard support (basic)
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') inputNumber(e.key);
  if (e.key === '.') inputDecimal();
  if (e.key === 'Backspace') backspace();
  if (e.key === 'Enter' || e.key === '=') equals();
  if (e.key === '+') handleOperator('+');
  if (e.key === '-') handleOperator('-');
  if (e.key === '*') handleOperator('×');
  if (e.key === '/') handleOperator('÷');
  if (e.key === '%') percent();
});