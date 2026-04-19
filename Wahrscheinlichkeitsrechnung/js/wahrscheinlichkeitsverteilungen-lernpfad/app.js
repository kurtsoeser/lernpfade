/**
 * Lernpfad: Wahrscheinlichkeitsverteilungen (Grundlagen)
 */
const TOTAL_SECTIONS = 7;
let completedSections = new Set();
let currentTab = 0;
let diceChart = null;
let uniformChart = null;
let chartsWvInitialized = false;

let currentFQ = 0;
let fqAnswers = [];

function parseNum(str) {
  return parseFloat(String(str).replace(',', '.').trim());
}

function approxEq(a, b, tol) {
  return Math.abs(a - b) <= (tol || 0.01);
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

  if (idx === 5 && !chartsWvInitialized) {
    chartsWvInitialized = true;
    setTimeout(function () {
      initDiceChart();
      initUniformChart();
      syncUniformProbDisplay();
    }, 120);
  }

  if (window.MathJax && MathJax.typesetPromise) {
    var panel = document.getElementById('panel' + idx);
    if (panel) MathJax.typesetPromise([panel]).catch(function () {});
  }

  if (idx === 5) {
    setTimeout(function () {
      if (diceChart) diceChart.resize();
      if (uniformChart) uniformChart.resize();
    }, 80);
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
// Chart.js: fairer Würfel (PMF)
// ══════════════════════════════════════════════
function initDiceChart() {
  var canvas = document.getElementById('diceChart');
  if (!canvas || typeof Chart === 'undefined') return;

  var labels = ['1', '2', '3', '4', '5', '6'];
  var data = [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6];

  if (diceChart) diceChart.destroy();

  diceChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'P(X = k)',
          data: data,
          backgroundColor: 'rgba(59,130,196,0.55)',
          borderColor: '#2563A0',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return 'P(X = ' + ctx.label + ') = ' + (1 / 6).toFixed(4).replace('.', ',');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 0.35,
          title: { display: true, text: 'Wahrscheinlichkeit' }
        },
        x: {
          title: { display: true, text: 'Augenzahl k' }
        }
      }
    }
  });
}

// ══════════════════════════════════════════════
// Gleichverteilung auf [0, 10]
// ══════════════════════════════════════════════
function getUniformBounds() {
  var a = parseNum(document.getElementById('uniA').value);
  var b = parseNum(document.getElementById('uniB').value);
  if (Number.isNaN(a) || Number.isNaN(b)) return { lo: 2, hi: 5 };
  var lo = Math.max(0, Math.min(a, b));
  var hi = Math.min(10, Math.max(a, b));
  return { lo: lo, hi: hi };
}

function syncUniformProbDisplay() {
  var el = document.getElementById('uniProbOut');
  if (!el) return;
  var u = getUniformBounds();
  var p = (u.hi - u.lo) / 10;
  el.textContent = p.toFixed(4).replace('.', ',');
  var ua = document.getElementById('uniA');
  var ub = document.getElementById('uniB');
  var av = document.getElementById('uniAVal');
  var bv = document.getElementById('uniBVal');
  if (ua && av) av.textContent = String(ua.value).replace('.', ',');
  if (ub && bv) bv.textContent = String(ub.value).replace('.', ',');
}

function initUniformChart() {
  var canvas = document.getElementById('uniformChart');
  if (!canvas || typeof Chart === 'undefined') return;
  updateUniformChart();
  var ua = document.getElementById('uniA');
  var ub = document.getElementById('uniB');
  if (ua) ua.addEventListener('input', updateUniformChart);
  if (ub) ub.addEventListener('input', updateUniformChart);
}

function updateUniformChart() {
  var canvas = document.getElementById('uniformChart');
  if (!canvas || typeof Chart === 'undefined') return;

  var density = 0.1;
  var u = getUniformBounds();
  var lo = u.lo;
  var hi = u.hi;

  var linePts = [];
  for (var x = 0; x <= 10.01; x += 0.25) {
    linePts.push({ x: x, y: density });
  }

  var bandPts = [
    { x: lo, y: 0 },
    { x: lo, y: density },
    { x: hi, y: density },
    { x: hi, y: 0 }
  ];

  if (uniformChart) uniformChart.destroy();

  uniformChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'P(' + lo.toString().replace('.', ',') + ' \u2264 Y \u2264 ' + hi.toString().replace('.', ',') + ')',
          data: bandPts,
          order: 1,
          parsing: false,
          borderColor: 'rgba(243,156,18,0.95)',
          backgroundColor: 'rgba(243,156,18,0.28)',
          fill: true,
          tension: 0,
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'f(y) = 1/10',
          data: linePts,
          order: 2,
          parsing: false,
          borderColor: '#2563A0',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0,
          pointRadius: 0,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, labels: { font: { family: 'Nunito' }, boxWidth: 12 } }
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: 10,
          title: { display: true, text: 'y' }
        },
        y: {
          min: 0,
          max: 0.14,
          title: { display: true, text: 'f(y)' }
        }
      }
    }
  });

  syncUniformProbDisplay();
}

// ══════════════════════════════════════════════
// Abschlussquiz
// ══════════════════════════════════════════════
var finalQuizData = [
  {
    q: 'Bei einer kontinuierlichen Zufallsvariable gilt für jeden einzelnen Wert x typischerweise …',
    opts: [
      'P(X = x) = 1',
      'P(X = x) = 0',
      'P(X = x) = f(x)',
      'P(X = x) hängt nur von der Einheit ab'
    ],
    correct: 1,
    explain:
      'Einzelpunkte haben keine Fläche unter der Dichte — daher ist die Punktwahrscheinlichkeit 0; Wahrscheinlichkeiten entstehen über Intervalle.'
  },
  {
    q: 'Die Wahrscheinlichkeitsdichte f(x) an der Stelle x ist …',
    opts: [
      'gleich P(X = x)',
      'eine „Höhe“ — die Wahrscheinlichkeit eines Intervalls ist eine Fläche unter f',
      'immer maximal 1',
      'nur für diskrete Variablen definiert'
    ],
    correct: 1,
    explain: 'f(x) ist keine Wahrscheinlichkeit; erst das Integrale über ein Intervall liefert eine Wahrscheinlichkeit.'
  },
  {
    q: 'Die Verteilungsfunktion ist definiert als …',
    opts: ['F(x) = P(X \u2265 x)', 'F(x) = P(X \u2264 x)', 'F(x) = f(x)', 'F(x) = E(X)'],
    correct: 1,
    explain: 'Per Definition: F(x) = P(X \u2264 x) — Anteil der Masse links von (einschließlich) x.'
  },
  {
    q: 'Für einen fairen Würfel (X = Augenzahl) ist E(X) gleich …',
    opts: ['3', '3,5', '6', '21'],
    correct: 1,
    explain: 'E(X) = \u2211 x\u00b7p(x) = (1+2+3+4+5+6)/6 = 3,5.'
  },
  {
    q: 'Die praktische Rechenformel f\u00fcr die Varianz lautet oft …',
    opts: ['Var(X) = E(X)\u00b2', 'Var(X) = E(X\u00b2) \u2212 (E(X))\u00b2', 'Var(X) = \u03c3', 'Var(X) = E(X) \u2212 x'],
    correct: 1,
    explain: 'Verschiebungssatz: Var(X) = E(X\u00b2) \u2212 (E(X))\u00b2 (neben der Definition mit quadratischen Abweichungen).'
  },
  {
    q: 'Y sei gleichverteilt auf [0; 10]. Wie gro\u00df ist P(2 \u2264 Y \u2264 5)?',
    opts: ['0', '3/10', '1/10', '5/10'],
    correct: 1,
    explain: 'L\u00e4nge des Intervalls ist 3, Gesamtintervalll\u00e4nge 10 \u2192 P = 3/10.'
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
  if (idx > 0) html += '<button class="btn btn-prev" onclick="showFinalQuestion(' + (idx - 1) + ')">\u2190 Zur\u00fcck</button>';
  if (idx < finalQuizData.length - 1) {
    html += '<button class="btn btn-next" onclick="showFinalQuestion(' + (idx + 1) + ')">Weiter \u2192</button>';
  } else {
    html += '<button class="btn btn-check" onclick="evaluateFinalQuiz()">Auswerten \u2713</button>';
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
    msg = 'Ausgezeichnet — du beherrschst die Begriffe rund um Verteilungen!';
    badges = '<span class="earned-badge gold">Gold — Verteilungen</span>';
  } else if (pct >= 67) {
    msg = 'Sehr gut! Ein kurzer Blick auf die markierten Fragen reicht oft.';
    badges = '<span class="earned-badge silver">Silber — guter Stand</span>';
  } else {
    msg = 'Wiederhole die Stationen zu PMF/PDF, CDF und zu E(X)/Var(X).';
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
// Numerische Mini-\u00dcbungen (Tab 6)
// ══════════════════════════════════════════════
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

function checkWvU1() {
  var v = parseFractionOrDecimal(document.getElementById('wv_u1').value);
  var fb = document.getElementById('fb_wv_u1');
  if (approxEq(v, 2 / 3, 0.02)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Richtig: P(X \u2264 4) = 4/6 = 2/3 (CDF bei 4 oder Summe der vier Trefferwahrscheinlichkeiten).';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Tipp: Vier g\u00fcnstige Augen von sechs gleich wahrscheinlichen.';
  }
}

function checkWvU2() {
  var v = parseNum(document.getElementById('wv_u2').value);
  var fb = document.getElementById('fb_wv_u2');
  if (approxEq(v, 91 / 6 - 3.5 * 3.5, 0.05) || approxEq(v, 2.9167, 0.06)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Passt: Var(X) = E(X\u00b2) \u2212 (E(X))\u00b2 = 91/6 \u2212 3,5\u00b2 \u2248 2,9167.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Nutze E(X\u00b2) = 91/6 und E(X) = 3,5 in der Verschiebungsformel.';
  }
}

function checkWvU3() {
  var v = parseNum(document.getElementById('wv_u3').value);
  var fb = document.getElementById('fb_wv_u3');
  if (approxEq(v, Math.sqrt(91 / 6 - 3.5 * 3.5), 0.04) || approxEq(v, 1.708, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Ja: \u03c3 = \u221aVar(X) \u2248 1,708.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c \u03c3 ist die Wurzel aus der Varianz des W\u00fcrfels.';
  }
}

// ══════════════════════════════════════════════
// Taschenrechner (Modal)
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
