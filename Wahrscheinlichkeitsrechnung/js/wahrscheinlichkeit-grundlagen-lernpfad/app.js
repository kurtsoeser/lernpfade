/**
 * Lernpfad: Kombinatorik & Grundlagen der Wahrscheinlichkeit
 */
const TOTAL_SECTIONS = 7;
let completedSections = new Set();
let currentTab = 0;
let wgWidgetsInit = false;

let currentFQ = 0;
let fqAnswers = [];

function parseNum(str) {
  return parseFloat(String(str).replace(',', '.').trim());
}

function approxEq(a, b, tol) {
  return Math.abs(a - b) <= (tol || 0.001);
}

function parseFractionOrDecimal(str) {
  str = String(str).trim().replace(/\s/g, '');
  if (!str) return NaN;
  str = str.replace(',', '.');
  if (str.indexOf('/') >= 0) {
    var p = str.split('/');
    if (p.length !== 2) return NaN;
    return parseNum(p[0]) / parseNum(p[1]);
  }
  return parseNum(str);
}

// ══════════════════════════════════════════════
// Fakultät & Binomialkoeffizient (BigInt)
// ══════════════════════════════════════════════
function factorialBigInt(n) {
  var ni = Math.floor(Number(n));
  if (!Number.isFinite(ni) || ni < 0) return null;
  if (ni === 0) return 1n;
  var r = 1n;
  for (var i = 2n; i <= BigInt(ni); i++) r *= i;
  return r;
}

function binomialCoefficientBigInt(n, k) {
  var nn = Math.floor(Number(n));
  var kk = Math.floor(Number(k));
  if (!Number.isFinite(nn) || !Number.isFinite(kk)) return null;
  if (kk < 0 || kk > nn) return 0n;
  if (kk === 0 || kk === nn) return 1n;
  if (kk > nn - kk) kk = nn - kk;
  var c = 1n;
  for (var i = 0n; i < BigInt(kk); i++) {
    c = (c * (BigInt(nn) - i)) / (i + 1n);
  }
  return c;
}

function switchTab(idx) {
  currentTab = idx;
  document.querySelectorAll('.tab-panel').forEach(function (p, i) {
    p.classList.toggle('active', i === idx);
  });
  document.querySelectorAll('.tab-btn').forEach(function (b, i) {
    b.classList.toggle('active', i === idx);
  });
  var bar = document.querySelector('.tab-bar');
  if (bar) bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (idx === 5 && !wgWidgetsInit) {
    wgWidgetsInit = true;
    setTimeout(function () {
      initWgWidgets();
    }, 80);
  }

  if (window.MathJax && MathJax.typesetPromise) {
    var panel = document.getElementById('panel' + idx);
    if (panel) MathJax.typesetPromise([panel]).catch(function () {});
  }
}

function updateProgress() {
  var pct = Math.round((completedSections.size / TOTAL_SECTIONS) * 100);
  var fill = document.getElementById('progressFill');
  var pt = document.getElementById('progressPercent');
  var tx = document.getElementById('progressText');
  if (fill) fill.style.width = pct + '%';
  if (pt) pt.textContent = pct + ' %';
  if (tx) tx.textContent = 'Station ' + completedSections.size + ' von ' + TOTAL_SECTIONS + ' abgeschlossen';
  document.querySelectorAll('.tab-btn').forEach(function (btn, i) {
    btn.classList.toggle('completed-tab', completedSections.has(i + 1));
  });
}

function markComplete(secNum) {
  completedSections.add(secNum);
  updateProgress();
}

function selectQuiz(el) {
  var parent = el.closest('.quiz-options');
  parent.querySelectorAll('.quiz-option').forEach(function (o) {
    o.classList.remove('selected', 'correct-answer', 'wrong-answer');
  });
  el.classList.add('selected');
}

function checkQuizGroup(tabIdx, quizIds) {
  var allCorrect = true;
  quizIds.forEach(function (qid) {
    var container = document.querySelector('[data-quiz="' + qid + '"]');
    if (!container) return;
    var correct = parseInt(container.dataset.correct, 10);
    var selected = container.querySelector('.quiz-option.selected');
    var fb = document.getElementById('fb_' + qid);

    if (!selected) {
      if (fb) {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent = 'Bitte wähle eine Antwort aus.';
      }
      allCorrect = false;
      return;
    }

    var idx = parseInt(selected.dataset.idx, 10);
    if (idx === correct) {
      container.querySelectorAll('.quiz-option').forEach(function (o) {
        o.classList.remove('selected');
      });
      selected.classList.add('correct-answer');
      if (fb) {
        fb.className = 'feedback correct';
        fb.style.display = 'block';
        fb.textContent = '\u2705 Richtig!';
      }
    } else {
      selected.classList.add('wrong-answer');
      container.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
      if (fb) {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent = '\u274c Leider falsch. Die richtige Antwort ist markiert.';
      }
      allCorrect = false;
    }
  });

  if (allCorrect) markComplete(tabIdx + 1);
}

// ══════════════════════════════════════════════
// Interaktive Rechner (Tab 6)
// ══════════════════════════════════════════════
function initWgWidgets() {
  var facBtn = document.getElementById('wgCalcFac');
  var binBtn = document.getElementById('wgCalcBin');
  if (facBtn) facBtn.addEventListener('click', updateWgFactorial);
  if (binBtn) binBtn.addEventListener('click', updateWgBinomial);
  var fn = document.getElementById('wgFacN');
  var bn = document.getElementById('wgBinN');
  var bk = document.getElementById('wgBinK');
  if (bn && bk) {
    bn.addEventListener('input', function () {
      var n = parseInt(bn.value, 10);
      if (!Number.isNaN(n) && n >= 0) bk.setAttribute('max', String(n));
    });
  }
  if (fn) {
    fn.addEventListener('change', updateWgFactorial);
    fn.addEventListener('keyup', function (e) {
      if (e.key === 'Enter') updateWgFactorial();
    });
  }
  if (bn) {
    bn.addEventListener('change', updateWgBinomial);
    bn.addEventListener('keyup', function (e) {
      if (e.key === 'Enter') updateWgBinomial();
    });
  }
  if (bk) {
    bk.addEventListener('change', updateWgBinomial);
    bk.addEventListener('keyup', function (e) {
      if (e.key === 'Enter') updateWgBinomial();
    });
  }
  updateWgFactorial();
  updateWgBinomial();
}

function updateWgFactorial() {
  var el = document.getElementById('wgFacN');
  var out = document.getElementById('wgFacOut');
  if (!el || !out) return;
  var n = parseInt(el.value, 10);
  if (Number.isNaN(n) || n < 0) {
    out.textContent = 'Bitte eine natürliche Zahl \u2265 0.';
    out.style.color = 'var(--red)';
    return;
  }
  if (n > 30) {
    out.innerHTML =
      'F\u00fcr n &gt; 30 wird die Ausgabe sehr lang. Bitte w\u00e4hle n \u2264 30 (oder nutze den Taschenrechner schrittweise).';
    out.style.color = 'var(--text-light)';
    return;
  }
  var f = factorialBigInt(n);
  out.style.color = 'var(--green)';
  out.textContent = String(n) + '! = ' + f.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function updateWgBinomial() {
  var nEl = document.getElementById('wgBinN');
  var kEl = document.getElementById('wgBinK');
  var out = document.getElementById('wgBinOut');
  if (!nEl || !kEl || !out) return;
  var n = parseInt(nEl.value, 10);
  var k = parseInt(kEl.value, 10);
  if (Number.isNaN(n) || Number.isNaN(k) || n < 0 || k < 0) {
    out.textContent = 'Bitte nichtnegative ganze Zahlen.';
    out.style.color = 'var(--red)';
    return;
  }
  if (k > n) {
    out.textContent = 'Es gilt k \u2264 n. (Sonst ist \\(\\binom{n}{k}=0\\).)';
    out.style.color = 'var(--red)';
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([out]).catch(function () {});
    return;
  }
  if (n > 60) {
    out.textContent = 'Bitte n \u2264 60 w\u00e4hlen (Browser-Schutz).';
    out.style.color = 'var(--text-light)';
    return;
  }
  var c = binomialCoefficientBigInt(n, k);
  out.style.color = 'var(--green)';
  out.innerHTML =
    '\\(\\displaystyle\\binom{' +
    n +
    '}{' +
    k +
    '} = \\) ' +
    c.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([out]).catch(function () {});
}

// ══════════════════════════════════════════════
// Abschlussquiz
// ══════════════════════════════════════════════
var finalQuizData = [
  {
    q: 'Es gilt \\(0! = \\) …',
    opts: ['0', '1', 'undefiniert', '10'],
    correct: 1,
    explain:
      'Per Definition ist \\(0! = 1\\) (leeres Produkt / sinnvolle Fortsetzung der Fakultät).'
  },
  {
    q: 'Wie viele Möglichkeiten gibt es, aus 8 Personen genau 3 auszuwählen (ohne Reihenfolge)?',
    opts: ['24', '56', '336', '512'],
    correct: 1,
    explain: '\\(\\binom{8}{3}=56\\).'
  },
  {
    q: 'Beim fairen Würfel: Wie groß ist die Wahrscheinlichkeit für eine Augenzahl größer als 4?',
    opts: ['\\(1/6\\)', '\\(1/3\\)', '\\(1/2\\)', '\\(2/3\\)'],
    correct: 1,
    explain:
      'Günstig sind 5 und 6 — zwei von sechs gleich wahrscheinlichen Ergebnissen: \\(2/6=1/3\\).'
  },
  {
    q: 'Die Formel \\(P(A\\cup B)=P(A)+P(B)-P(A\\cap B)\\) brauchst du vor allem, wenn …',
    opts: [
      'A und B sich ausschließen',
      'A und B gleichzeitig eintreten können',
      'A und B unabhängig sind',
      'P(A)=0 ist'
    ],
    correct: 1,
    explain:
      'Bei Überschneidung darfst du den Schnitt nicht doppelt zählen — daher \\(-P(A\\cap B)\\).'
  },
  {
    q: 'Für unabhängige Ereignisse A und B gilt typischerweise …',
    opts: [
      '\\(P(A\\cap B)=P(A)+P(B)\\)',
      '\\(P(A\\cap B)=P(A)\\cdot P(B)\\)',
      '\\(P(A\\cap B)=P(A\\mid B)\\)',
      '\\(P(A\\cap B)=1\\)'
    ],
    correct: 1,
    explain: 'Unabhängigkeit: \\(P(A\\cap B)=P(A)\\cdot P(B)\\).'
  },
  {
    q: 'Die bedingte Wahrscheinlichkeit \\(P(B\\mid A)\\) ist definiert als …',
    opts: [
      '\\(P(A)\\cdot P(B)\\)',
      '\\(P(A\\cap B)/P(A)\\) (für \\(P(A)\\neq 0\\))',
      '\\(P(A)+P(B)\\)',
      '\\(P(B)/P(A)\\)'
    ],
    correct: 1,
    explain:
      '\\(P(B\\mid A)=P(A\\cap B)/P(A)\\) (Anteil des „A und B“ innerhalb von A).'
  }
];

function buildFinalQuiz() {
  var stepper = document.getElementById('finalQuizStepper');
  if (!stepper) return;
  stepper.innerHTML = '';
  for (var i = 0; i < finalQuizData.length; i++) {
    var dot = document.createElement('div');
    dot.className = 'quiz-step-dot' + (i === 0 ? ' active' : '');
    dot.textContent = i + 1;
    dot.id = 'fqDot' + i;
    stepper.appendChild(dot);
  }
  fqAnswers = new Array(finalQuizData.length).fill(-1);
  showFinalQuestion(0);
}

function showFinalQuestion(idx) {
  currentFQ = idx;
  var q = finalQuizData[idx];
  var container = document.getElementById('finalQuizContainer');
  var html = '<div class="exercise" style="animation:fadeIn 0.3s ease;">';
  html += '<p style="font-weight:700; margin-bottom:12px;">Frage ' + (idx + 1) + ' von ' + finalQuizData.length + '</p>';
  html += '<p>' + q.q + '</p>';
  q.opts.forEach(function (opt, i) {
    var sel = fqAnswers[idx] === i ? ' selected' : '';
    html += '<div class="quiz-option' + sel + '" onclick="selectFQ(' + i + ')">' + opt + '</div>';
  });
  html += '<div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">';
  if (idx > 0) html += '<button type="button" class="btn btn-prev" onclick="showFinalQuestion(' + (idx - 1) + ')">\u2190 Zur\u00fcck</button>';
  if (idx < finalQuizData.length - 1) {
    html += '<button type="button" class="btn btn-next" onclick="showFinalQuestion(' + (idx + 1) + ')">Weiter \u2192</button>';
  } else {
    html += '<button type="button" class="btn btn-check" onclick="evaluateFinalQuiz()">Auswerten \u2713</button>';
  }
  html += '</div></div>';
  container.innerHTML = html;

  document.querySelectorAll('.quiz-step-dot').forEach(function (d, i) {
    d.classList.toggle('active', i === idx);
  });

  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([container]).catch(function () {});
}

function selectFQ(optIdx) {
  fqAnswers[currentFQ] = optIdx;
  document.querySelectorAll('#finalQuizContainer .quiz-option').forEach(function (o, i) {
    o.classList.toggle('selected', i === optIdx);
  });
}

function evaluateFinalQuiz() {
  var score = 0;
  finalQuizData.forEach(function (q, i) {
    var dot = document.getElementById('fqDot' + i);
    if (fqAnswers[i] === q.correct) {
      score++;
      dot.classList.add('correct-dot');
    } else {
      dot.classList.add('wrong-dot');
    }
  });

  var html = '';
  finalQuizData.forEach(function (q, i) {
    var isCorrect = fqAnswers[i] === q.correct;
    html += '<div class="info-box ' + (isCorrect ? 'success' : 'danger') + '" style="margin:8px 0;">';
    html += '<div class="icon">' + (isCorrect ? '\u2705' : '\u274c') + '</div><div>';
    html += '<strong>Frage ' + (i + 1) + ':</strong> ' + q.explain;
    if (!isCorrect && fqAnswers[i] >= 0) {
      html += '<br><em>Deine Antwort: ' + q.opts[fqAnswers[i]] + '</em>';
    }
    html += '</div></div>';
  });
  document.getElementById('finalQuizContainer').innerHTML = html;

  document.getElementById('finalResult').style.display = 'block';
  document.getElementById('finalScore').textContent = score + ' von ' + finalQuizData.length + ' richtig!';

  var pct = Math.round((score / finalQuizData.length) * 100);
  var msg;
  var badges;
  if (pct === 100) {
    msg = 'Ausgezeichnet — Grundlagen sitzen!';
    badges = '<span class="earned-badge gold">Gold — Grundlagen</span>';
  } else if (pct >= 67) {
    msg = 'Sehr gut! Die markierten Fragen kurz wiederholen.';
    badges = '<span class="earned-badge silver">Silber — guter Stand</span>';
  } else {
    msg = 'Wiederhole Fakultät, Laplace, Additionssatz und bedingte Wahrscheinlichkeit.';
    badges = '<span class="earned-badge bronze">Bronze — weiter \u00fcben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;

  if (score >= 4) markComplete(7);

  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise().catch(function () {});
}

function resetFinalQuiz() {
  fqAnswers = new Array(finalQuizData.length).fill(-1);
  document.getElementById('finalResult').style.display = 'none';
  document.querySelectorAll('.quiz-step-dot').forEach(function (d) {
    d.classList.remove('correct-dot', 'wrong-dot');
  });
  showFinalQuestion(0);
}

// ══════════════════════════════════════════════
// Übungen
// ══════════════════════════════════════════════
function checkWgU1() {
  var v = parseNum(document.getElementById('wg_u1').value);
  var fb = document.getElementById('fb_wg_u1');
  if (approxEq(v, 120, 0)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Richtig: 5! = 120.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Tipp: 5\u00b74\u00b73\u00b72\u00b71.';
  }
}

function checkWgU2() {
  var v = parseNum(document.getElementById('wg_u2').value);
  var fb = document.getElementById('fb_wg_u2');
  if (approxEq(v, 15, 0)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Ja: \\(\\binom{6}{2}=15\\) Zweiergruppen.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c \\(\\binom{6}{2}=\\dfrac{6!}{2!\\,4!}\\).';
  }
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
}

function checkWgU3() {
  var v = parseFractionOrDecimal(document.getElementById('wg_u3').value);
  var fb = document.getElementById('fb_wg_u3');
  if (approxEq(v, 1 / 3, 0.02)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Stimmt: 2 g\u00fcnstige von 6 — \\(2/6=1/3\\).';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c G\u00fcnstig: 5 und 6.';
  }
}

function checkWgU4() {
  var v = parseFractionOrDecimal(document.getElementById('wg_u4').value);
  var fb = document.getElementById('fb_wg_u4');
  if (approxEq(v, 0.8, 0.02)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Richtig: 0,6 + 0,4 \u2212 0,2 = 0,8.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Additionssatz: Summe minus Schnitt.';
  }
}

function checkWgU5() {
  var v = parseFractionOrDecimal(document.getElementById('wg_u5').value);
  var fb = document.getElementById('fb_wg_u5');
  var exp = (5 / 8) * (4 / 7);
  if (approxEq(v, exp, 0.02) || approxEq(v, 5 / 14, 0.02)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Passt: \\(\\frac{5}{8}\\cdot\\frac{4}{7}=\\frac{20}{56}=\\frac{5}{14}\\).';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Ohne Zur\u00fccklegen: \\(\\frac{5}{8}\\cdot\\frac{4}{7}\\).';
  }
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
}

// ══════════════════════════════════════════════
// Taschenrechner
// ══════════════════════════════════════════════
var calcStored = null;
var calcPendingOp = null;
var calcDisplay = '0';
var calcInputNew = true;

function calcRender() {
  var el = document.getElementById('calcDisplay');
  if (el) el.value = calcDisplay.replace('.', ',');
}
function calcReset() {
  calcStored = null;
  calcPendingOp = null;
  calcDisplay = '0';
  calcInputNew = true;
  calcRender();
}
function calcFormat(n) {
  if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) return 'Fehler';
  var s = String(Math.round(n * 1e12) / 1e12);
  return s.replace('.', ',');
}
function calcCompute(a, b, op) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (op === '/') return b === 0 ? NaN : a / b;
  return b;
}
function calcPressDigit(d) {
  if (calcDisplay === 'Fehler') calcClear();
  if (calcInputNew) {
    calcDisplay = d === '.' ? '0.' : d;
    calcInputNew = false;
  } else {
    if (d === '.' && String(calcDisplay).indexOf('.') >= 0) return;
    calcDisplay += d;
  }
  calcRender();
}
function calcPressOp(op) {
  if (calcDisplay === 'Fehler') {
    calcClear();
    return;
  }
  var v = parseFloat(String(calcDisplay).replace(',', '.'));
  if (calcStored !== null && calcPendingOp && !calcInputNew) {
    v = calcCompute(calcStored, v, calcPendingOp);
    calcDisplay = calcFormat(v);
    if (calcDisplay === 'Fehler') {
      calcRender();
      return;
    }
    v = parseFloat(String(calcDisplay).replace(',', '.'));
  }
  calcStored = v;
  calcPendingOp = op;
  calcInputNew = true;
  calcRender();
}
function calcEquals() {
  if (calcDisplay === 'Fehler') {
    calcClear();
    return;
  }
  if (calcPendingOp === null || calcStored === null) return;
  var v = parseFloat(String(calcDisplay).replace(',', '.'));
  var r = calcCompute(calcStored, v, calcPendingOp);
  calcDisplay = calcFormat(r);
  calcStored = null;
  calcPendingOp = null;
  calcInputNew = true;
  calcRender();
}
function calcClear() {
  calcReset();
}
function calcBackspace() {
  if (calcDisplay === 'Fehler' || calcInputNew) return;
  calcDisplay = String(calcDisplay).slice(0, -1);
  if (calcDisplay === '' || calcDisplay === '-') calcDisplay = '0';
  calcRender();
}
function openCalculatorModal() {
  var m = document.getElementById('calcModal');
  if (m) {
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  calcReset();
}
function closeCalculatorModal() {
  var m = document.getElementById('calcModal');
  if (m) {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  updateProgress();
  buildFinalQuiz();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && typeof closeCalculatorModal === 'function') closeCalculatorModal();
});
