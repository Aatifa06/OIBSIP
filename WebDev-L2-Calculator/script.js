let expression = "";
let answer = 0;
let previousAnswer = 0;
let memory = 0;
let angleMode = "DEG";
let justCalculated = false;

const expressionEl = document.getElementById("expression");
const answerEl = document.getElementById("answer");
const displayModeEl = document.getElementById("displayMode");
const historyList = document.getElementById("historyList");

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  if (Math.abs(value) < 1e-12) value = 0;
  return Number(value.toPrecision(12)).toString();
}

function updateDisplay() {
  displayModeEl.textContent = angleMode;
  expressionEl.textContent = expression || "0";

  if (!expression) {
    answerEl.textContent = "0";
    return;
  }

  // IMPORTANT:
  // Incomplete functions such as tan( must stay exactly as tan(
  // and must NEVER be evaluated as tan(0).
  if (isIncompleteExpression(expression)) {
    answerEl.textContent = "…";
    return;
  }

  try {
    answerEl.textContent = formatNumber(evaluate(expression));
  } catch {
    answerEl.textContent = "…";
  }
}

function isIncompleteExpression(exp) {
  return (
    /(?:sin|cos|tan|asin|acos|atan|log|ln|sqrt|cbrt)\($/.test(exp) ||
    /[+\-*/^.(]$/.test(exp)
  );
}

function toRadians(x) {
  if (angleMode === "RAD") return x;
  if (angleMode === "GRAD") return x * Math.PI / 200;
  return x * Math.PI / 180;
}

function fromRadians(x) {
  if (angleMode === "RAD") return x;
  if (angleMode === "GRAD") return x * 200 / Math.PI;
  return x * 180 / Math.PI;
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) {
    throw new Error("Invalid factorial");
  }

  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function evaluate(exp) {
  let s = exp
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("π", "PI");

  // Percentage: 50% => 0.5
  s = s.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

  // Factorial
  s = s.replace(/(\d+(?:\.\d+)?)!/g, "FACT($1)");

  // Power
  s = s.replace(/\^/g, "**");

  // Function names
  s = s.replace(/asin\(/g, "ASIN(")
       .replace(/acos\(/g, "ACOS(")
       .replace(/atan\(/g, "ATAN(")
       .replace(/sin\(/g, "SIN(")
       .replace(/cos\(/g, "COS(")
       .replace(/tan\(/g, "TAN(")
       .replace(/log\(/g, "LOG(")
       .replace(/ln\(/g, "LN(")
       .replace(/sqrt\(/g, "SQRT(")
       .replace(/cbrt\(/g, "CBRT(");

  // Implicit multiplication
  s = s.replace(/(PI|E|\d|\))(?=\()/g, "$1*(");
  s = s.replace(/\)(?=(PI|E|\d))/g, ")*");

  const SIN = x => Math.sin(toRadians(x));
  const COS = x => Math.cos(toRadians(x));

  const TAN = x => {
    const r = toRadians(x);
    if (Math.abs(Math.cos(r)) < 1e-12) throw new Error("Undefined");
    return Math.tan(r);
  };

  const ASIN = x => fromRadians(Math.asin(x));
  const ACOS = x => fromRadians(Math.acos(x));
  const ATAN = x => fromRadians(Math.atan(x));

  const LOG = x => {
    if (x <= 0) throw new Error("Invalid log");
    return Math.log10(x);
  };

  const LN = x => {
    if (x <= 0) throw new Error("Invalid ln");
    return Math.log(x);
  };

  const SQRT = x => {
    if (x < 0) throw new Error("Invalid sqrt");
    return Math.sqrt(x);
  };

  const CBRT = x => Math.cbrt(x);
  const ABS = x => Math.abs(x);
  const FACT = factorial;
  const PI = Math.PI;
  const E = Math.E;

  // Allow only known function/constant names.
  const cleaned = s.replace(/[A-Za-z]+/g, name => {
    const allowed = [
      "SIN","COS","TAN","ASIN","ACOS","ATAN",
      "LOG","LN","SQRT","CBRT","ABS","FACT","PI","E"
    ];
    return allowed.includes(name) ? "" : name;
  });

  if (/[A-Za-z]/.test(cleaned)) {
    throw new Error("Invalid expression");
  }

  // eslint-disable-next-line no-new-func
  return Function(
    "SIN","COS","TAN","ASIN","ACOS","ATAN",
    "LOG","LN","SQRT","CBRT","ABS","FACT","PI","E",
    `"use strict"; return (${s});`
  )(SIN,COS,TAN,ASIN,ACOS,ATAN,LOG,LN,SQRT,CBRT,ABS,FACT,PI,E);
}

function append(value) {
  if (justCalculated && !["+", "-", "*", "/", "^", ")"].includes(value)) {
    expression = "";
  }

  justCalculated = false;
  expression += value;
  updateDisplay();
}

function addFunction(value) {
  if (justCalculated) {
    expression = "";
    justCalculated = false;
  }

  // This is the key behavior:
  // Clicking tan inserts "tan(" only.
  // It does NOT insert 0 and does NOT calculate immediately.
  expression += value;
  updateDisplay();
}

function clearAll() {
  expression = "";
  answer = 0;
  justCalculated = false;
  updateDisplay();
}

function backspace() {
  justCalculated = false;

  const funcs = [
    "asin(", "acos(", "atan(",
    "sqrt(", "cbrt(", "sin(", "cos(",
    "tan(", "log(", "ln("
  ];

  const fn = funcs.find(item => expression.endsWith(item));

  if (fn) {
    expression = expression.slice(0, -fn.length);
  } else {
    expression = expression.slice(0, -1);
  }

  updateDisplay();
}

function calculate() {
  if (!expression || isIncompleteExpression(expression)) return;

  let finalExpression = expression;

  const open = (finalExpression.match(/\(/g) || []).length;
  const close = (finalExpression.match(/\)/g) || []).length;

  if (open > close) {
    finalExpression += ")".repeat(open - close);
  }

  try {
    const value = evaluate(finalExpression);

    previousAnswer = value;
    answer = value;
    expressionEl.textContent = finalExpression;
    answerEl.textContent = formatNumber(value);

    addHistory(finalExpression, formatNumber(value));

    expression = formatNumber(value);
    justCalculated = true;
  } catch {
    answerEl.textContent = "Error";
    justCalculated = true;
  }
}

function addHistory(exp, result) {
  if (historyList.querySelector(".empty-history")) {
    historyList.innerHTML = "";
  }

  const item = document.createElement("div");
  item.className = "history-item";
  item.innerHTML = `
    <div class="history-expression">${escapeHtml(exp)}</div>
    <div class="history-answer">= ${escapeHtml(result)}</div>
  `;

  item.addEventListener("click", () => {
    expression = exp;
    justCalculated = false;
    updateDisplay();
  });

  historyList.prepend(item);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    const value = button.dataset.value;

    if (action === "input") append(value);
    if (action === "constant") append(value === "pi" ? "π" : "e");

    if (action === "function") {
      if (["sin(","cos(","tan(","asin(","acos(","atan(","log(","ln(","sqrt(","cbrt("].includes(value)) {
        addFunction(value);
      } else if (value === "square") {
        append("^2");
      } else if (value === "cube") {
        append("^3");
      } else if (value === "inverse") {
        expression = expression ? `1/(${expression})` : "1/(";
        justCalculated = false;
        updateDisplay();
      } else if (value === "factorial") {
        append("!");
      } else if (value === "abs") {
        expression = `ABS(${expression})`;
        justCalculated = false;
        updateDisplay();
      } else if (value === "10^") {
        addFunction("10^(");
      } else if (value === "e^") {
        addFunction("e^(");
      }
    }

    if (action === "clear") clearAll();
    if (action === "backspace") backspace();
    if (action === "equals") calculate();

    if (action === "ans") {
      append(formatNumber(previousAnswer));
    }

    if (action === "memory-clear") memory = 0;

    if (action === "memory-recall") {
      append(formatNumber(memory));
    }

    if (action === "memory-add") {
      try { memory += evaluate(expression); } catch {}
    }

    if (action === "memory-subtract") {
      try { memory -= evaluate(expression); } catch {}
    }
  });
});

// Angle mode
document.querySelectorAll(".angle").forEach(button => {
  button.addEventListener("click", () => {
    angleMode = button.dataset.angle;

    document.querySelectorAll(".angle").forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    updateDisplay();
  });
});

// Clear history
document.getElementById("clearHistory").addEventListener("click", () => {
  historyList.innerHTML = '<div class="empty-history">No calculations yet.</div>';
});

// Keyboard support
document.addEventListener("keydown", e => {
  if (/^[0-9.]$/.test(e.key)) append(e.key);
  else if (["+", "-", "*", "/", "^", "(", ")", "%"].includes(e.key)) append(e.key);
  else if (e.key === "Enter" || e.key === "=") calculate();
  else if (e.key === "Backspace") backspace();
  else if (e.key === "Escape") clearAll();
});

updateDisplay();
