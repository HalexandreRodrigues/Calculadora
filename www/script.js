const display = document.getElementById('display');
const historyContainer = document.getElementById('history-container');
let firstValue = null;
let operator = null;
let waitingForSecond = false;
let secondValue = ''; 
let justComputed = false;
let historyList = [];

// Formata visualmente: 1000.5 -> 1.000,5
function formatVisual(numStr) {
    if (numStr === 'Erro' || numStr === '0') return numStr;
    if (!numStr) return '';
    const hasPercent = numStr.includes('%');
    const cleanNum = numStr.replace('%', '');
    const parts = cleanNum.split('.');
    let formattedInt = new Intl.NumberFormat('pt-BR').format(parts[0]);
    let result = parts.length > 1 ? formattedInt + ',' + parts[1] : formattedInt;
    return hasPercent ? result + '%' : result;
}

function updateDisplay(text) {
    display.textContent = formatVisual(String(text));
    adjustFontSize(); // Chama o ajuste de tamanho toda vez que o visor muda
}
function adjustFontSize() {
    const length = display.textContent.length;
    
    // Tamanho padrão
    let newSize = '3.5rem';

    // Se o número for muito longo, diminui a fonte progressivamente
    if (length > 9) {
        newSize = '2.8rem';
    }
    if (length > 12) {
        newSize = '2.2rem';
    }
    if (length > 15) {
        newSize = '1.7rem';
    }
    if (length > 18) {
        newSize = '1.3rem';
    }

    display.style.fontSize = newSize;
}

function updateHistoryUI() {
    if (historyList.length > 6) historyList.shift();
    historyContainer.innerHTML = '';
    historyList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = item.split(' ').map(term => {
            return (isNaN(term.replace(',', '.')) || term === '') ? term : formatVisual(term);
        }).join(' ');
        historyContainer.appendChild(div);
    });
}

// Substitua a função inputNumber inteira por esta:
function inputNumber(num) {
    // 1. LIMITE DE SEGURANÇA: Se já tem 18 caracteres (contando pontos), não deixa digitar mais
    if (display.textContent.length >= 18 && operator === null && !waitingForSecond) {
        return; 
    }

    if (operator !== null) {
        if (waitingForSecond) {
            secondValue = num;
            waitingForSecond = false;
        } else {
            // Limite também para o segundo número da conta
            if (secondValue.length >= 18) return; 
            secondValue = (secondValue === '0') ? num : secondValue + num;
        }
        updateDisplay(secondValue);
        return;
    }
    
    let current = display.textContent.replace(/\./g, '').replace(',', '.');
    let next = (current === '0' || justComputed) ? num : current + num;
    updateDisplay(next);
    justComputed = false;
}

function adjustFontSize() {
    const length = display.textContent.length;
    let newSize = '3.5rem';

    if (length > 7) {
        newSize = '3.0rem';
    }
    if (length > 9) {
        newSize = '2.5rem';
    }
    if (length > 11) {
        newSize = '2.0rem';
    }
    if (length > 14) {
        newSize = '1.5rem';
    }

    display.style.fontSize = newSize;
}

function inputDecimal() {
    let current = waitingForSecond ? '0' : (operator !== null ? secondValue : display.textContent.replace(/\./g, '').replace(',', '.'));
    if (!current.includes('.')) {
        current = (current === '' ? '0' : current) + '.';
        if (operator !== null) {
            secondValue = current;
            waitingForSecond = false;
        }
        updateDisplay(current);
    }
}

function handleOperator(nextOperator) {
    if (operator !== null && secondValue !== '') equals();
    firstValue = parseFloat(display.textContent.replace(/\./g, '').replace(',', '.').replace('%', ''));
    operator = nextOperator;
    waitingForSecond = true;
}

function handlePercent() {
    let currentVal = display.textContent.replace(/\./g, '').replace(',', '.');
    if (currentVal.includes('%') || currentVal === '0') return;
    updateDisplay(currentVal + '%');
    if (operator !== null && firstValue !== null) {
        let percentualRelativo = (firstValue * parseFloat(currentVal)) / 100;
        secondValue = percentualRelativo.toString();
    } else {
        justComputed = true;
    }
}

function equals() {
    if (operator === null || waitingForSecond) return;
    const v1 = firstValue;
    const v2Text = secondValue === '' ? display.textContent.replace(/\./g, '').replace(',', '.') : secondValue;
    const v2 = parseFloat(v2Text.replace('%', '')) / (v2Text.includes('%') ? 100 : 1);
    const result = compute(v1, v2, operator);
    if (result === 'Erro') {
        updateDisplay('Erro');
        setTimeout(clearAll, 1000);
        return;
    }
    const calculation = `${String(v1)} ${operator} ${v2Text} = ${String(result)}`;
    historyList.push(calculation);
    updateHistoryUI();
    updateDisplay(String(result));
    firstValue = result;
    operator = null;
    secondValue = '';
    justComputed = true;
}

function compute(a, b, op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '×': case '*': return a * b;
        case '÷': case '/': return b === 0 ? 'Erro' : a / b;
        default: return b;
    }
}

function clearAll() {
    firstValue = null; operator = null; secondValue = '';
    waitingForSecond = false; historyList = [];
    updateHistoryUI(); updateDisplay('0');
}

document.querySelector('.buttons').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const val = btn.textContent.trim();
    if (action === 'number') inputNumber(val);
    if (action === 'operator') handleOperator(val);
    if (action === 'equals') equals();
    if (action === 'clear') clearAll();
    if (action === 'percent') handlePercent();
    if (action === 'decimal') inputDecimal();
    if (action === 'backspace') {
        let current = display.textContent.replace(/\./g, '').replace(',', '.');
        let next = current.length > 1 ? current.slice(0, -1) : '0';
        if (operator !== null) secondValue = next;
        updateDisplay(next);
    }
});