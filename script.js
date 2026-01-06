const display = document.getElementById('display');
let firstValue = null;
let operator = null;
let waitingForSecond = false;
let secondValue = ''; 
let justComputed = false;

let FEATURES = {};

// Auxiliar para formatar números nulos ou indefinidos
function formatNum(n) {
  if (n === null || n === undefined) return '';
  return parseFloat(Number(n).toFixed(10)).toString();
}

function updateDisplay(text) {
  display.textContent = String(text);
  checkOverflow();
}

// Config e Feature Flags
fetch('config.json')
  .then(r => r.json())
  .then(cfg => {
    FEATURES = cfg.features || {};
    updateFeatureIndicator();
  })
  .catch(() => {});

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
  if (display.scrollWidth > display.clientWidth + 2) {
    display.classList.add('has-overflow');
  } else {
    display.classList.remove('has-overflow');
  }
}

window.addEventListener('resize', checkOverflow);

function inputNumber(num) {
  if (justComputed && operator === null) {
    updateDisplay(num);
    justComputed = false;
    return;
  }

  if (operator !== null) {
    if (waitingForSecond) {
      secondValue = num;
      waitingForSecond = false;
    } else {
      secondValue = (secondValue === '0') ? num : secondValue + num;
    }
    updateDisplay(`${formatNum(firstValue)} ${operator} ${secondValue}`);
    return;
  }

  if (display.textContent === '0' || justComputed) {
    updateDisplay(num);
  } else {
    updateDisplay(display.textContent + num);
  }
  justComputed = false;
}

function inputDecimal() {
  if (operator !== null) {
    if (waitingForSecond) {
      secondValue = '0.';
      waitingForSecond = false;
    } else if (!secondValue.includes('.')) {
      secondValue = secondValue === '' ? '0.' : secondValue + '.';
    }
    updateDisplay(`${formatNum(firstValue)} ${operator} ${secondValue}`);
    return;
  }

  if (!display.textContent.includes('.')) {
    updateDisplay(display.textContent + '.');
  }
}

function clearAll() {
  firstValue = null;
  operator = null;
  waitingForSecond = false;
  secondValue = '';
  updateDisplay('0');
}

function backspace() {
  if (operator !== null && secondValue !== '') {
    secondValue = secondValue.slice(0, -1);
    updateDisplay(`${formatNum(firstValue)} ${operator} ${secondValue}`);
    return;
  }
  
  let text = display.textContent;
  updateDisplay(text.length <= 1 ? '0' : text.slice(0, -1));
}

function handleOperator(nextOperator) {
  if (operator !== null && secondValue !== '') {
    equals(); // Calcula o anterior antes de seguir
  }
  
  firstValue = parseFloat(display.textContent);
  operator = nextOperator;
  waitingForSecond = true;
  updateDisplay(`${formatNum(firstValue)} ${operator}`);
}

function equals() {
  if (operator === null) return;
  
  const v1 = firstValue;
  const v2 = secondValue === '' ? v1 : parseFloat(secondValue);
  
  const result = compute(v1, v2, operator);
  updateDisplay(formatNum(result));
  
  firstValue = result === 'Erro' ? null : result;
  operator = null;
  secondValue = '';
  waitingForSecond = false;
  justComputed = true;
}

function compute(a, b, op) {
  let res;
  switch (op) {
    case '+': res = a + b; break;
    case '-': res = a - b; break;
    case '×': case '*': res = a * b; break;
    case '÷': case '/': 
      if (b === 0) return 'Erro';
      res = a / b; 
      break;
    default: return b;
  }
  return res;
}

// Event Delegation
document.querySelector('.buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  const action = btn.dataset.action;
  const val = btn.textContent.trim();

  switch (action) {
    case 'number': inputNumber(val); break;
    case 'operator': handleOperator(val); break;
    case 'decimal': inputDecimal(); break;
    case 'equals': equals(); break;
    case 'clear': clearAll(); break;
    case 'backspace': backspace(); break;
  }
});

// Teclado
document.addEventListener('keydown', (e) => {
  if (/[0-9]/.test(e.key)) inputNumber(e.key);
  if (e.key === '.') inputDecimal();
  if (e.key === 'Enter' || e.key === '=') equals();
  if (e.key === 'Backspace') backspace();
  if (['+', '-', '*', '/'].test(e.key)) {
    const opMap = {'*': '×', '/': '÷', '+': '+', '-': '-'};
    handleOperator(opMap[e.key]);
  }
});