/**
 * Lernpfad: Binomialverteilung
 */
const TOTAL_SECTIONS = 7;
let completedSections = new Set();
let currentTab = 0;
let binomBarChart = null;
let binomChartInitialized = false;

let currentFQ = 0;
let fqAnswers = [];

function parseNum(str) {
  return parseFloat(String(str).replace(',', '.').trim());
}

function approxEq(a, b, tol) {
  return Math.abs(a - b) <= (tol || 0.01);
}

/** ln C(n,k) über Summen der Logarithmen */
function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  if (k === 0 || k === n) return 0;
  var kk = k < n - k ? k : n - k;
  var s = 0;
  for (var i = 0; i < kk; i++) {
    s += Math.log(n - i) - Math.log(i + 1);
  }
  return s;
}

/** P(X = k) für X ~ Bin(n,p) */
function binomialPMF(n, k, p) {
  if (!Number.isFinite(n) || !Number.isFinite(k) || !Number.isFinite(p)) return NaN;
  var ni = Math.floor(n);
  var ki = Math.floor(k);
  if (ni < 0 || ki < 0 || ki > ni) return 0;
  if (p <= 0) return ki === 0 ? 1 : 0;
  if (p >= 1) return ki === ni ? 1 : 0;
  var lc = logChoose(ni, ki);
  return Math.exp(lc + ki * Math.log(p) + (ni - ki) * Math.log(1 - p));
}

/** P(X <= k0), k0 ganzzahlig */
function binomialCDFAt(n, k0, p) {
  var ni = Math.floor(n);
  var kmax = Math.min(Math.floor(k0), ni);
  if (kmax < 0) return 0;
  var s = 0;
  for (var k = 0; k <= kmax; k++) {
    s += binomialPMF(ni, k, p);
  }
  return s;
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

  if (idx === 5 && !binomChartInitialized) {
    binomChartInitialized = true;
    setTimeout(function () {
      initBinomChartListeners();
      updateBinomChart();
    }, 120);
  }

  /* Binomial-Rechner (Canvas) liegt in Tab 3 (PMF); bei display:none war die erste Zeichnung breite 0 */
  if (idx === 2 && typeof window.bvRechnerRedrawAll === 'function') {
    setTimeout(function () {
      window.bvRechnerRedrawAll();
    }, 80);
  }

  if (window.MathJax && MathJax.typesetPromise) {
    var panel = document.getElementById('panel' + idx);
    if (panel) MathJax.typesetPromise([panel]).catch(function () {});
  }

  if (idx === 5 && binomBarChart) {
    setTimeout(function () {
      binomBarChart.resize();
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
// Chart: PMF Binomial
// ══════════════════════════════════════════════
function getBinomParams() {
  var nEl = document.getElementById('binN');
  var pEl = document.getElementById('binP');
  var n = nEl ? parseInt(nEl.value, 10) : 10;
  var p = pEl ? parseNum(pEl.value) : 0.3;
  if (Number.isNaN(n) || n < 1) n = 10;
  if (n > 30) n = 30;
  if (Number.isNaN(p) || p < 0.01) p = 0.01;
  if (p > 0.99) p = 0.99;
  return { n: n, p: p };
}

function updateBinomProbLabels() {
  var u = getBinomParams();
  var n = u.n;
  var p = u.p;
  var kEl = document.getElementById('binK');
  var k = kEl ? parseInt(kEl.value, 10) : 3;
  if (Number.isNaN(k) || k < 0) k = 0;
  if (k > n) {
    k = n;
    if (kEl) kEl.value = String(k);
  }

  var pmf = binomialPMF(n, k, p);
  var outPmf = document.getElementById('binPmfOut');
  if (outPmf) {
    outPmf.textContent = (pmf * 100).toFixed(2).replace('.', ',') + ' %  (' + pmf.toFixed(4).replace('.', ',') + ')';
  }

  var xEl = document.getElementById('binXcdf');
  var xcdf = xEl ? parseInt(xEl.value, 10) : 2;
  if (Number.isNaN(xcdf) || xcdf < 0) xcdf = 0;
  if (xcdf > n) {
    xcdf = n;
    if (xEl) xEl.value = String(xcdf);
  }
  var cdf = binomialCDFAt(n, xcdf, p);
  var outCdf = document.getElementById('binCdfOut');
  if (outCdf) {
    outCdf.textContent = (cdf * 100).toFixed(2).replace('.', ',') + ' %  (' + cdf.toFixed(4).replace('.', ',') + ')';
  }

  var ex = document.getElementById('binExOut');
  var vx = document.getElementById('binVarOut');
  var sx = document.getElementById('binSigmaOut');
  if (ex) ex.textContent = (n * p).toFixed(4).replace('.', ',');
  if (vx) vx.textContent = (n * p * (1 - p)).toFixed(4).replace('.', ',');
  if (sx) sx.textContent = Math.sqrt(n * p * (1 - p)).toFixed(4).replace('.', ',');
}

function updateBinomChart() {
  var u = getBinomParams();
  var n = u.n;
  var p = u.p;

  var nEl = document.getElementById('binN');
  var pEl = document.getElementById('binP');
  if (nEl) nEl.value = String(n);
  if (pEl) pEl.value = p.toFixed(2).replace('.', ',');

  var nr = document.getElementById('binNRange');
  var pr = document.getElementById('binPRange');
  if (nr) nr.value = String(n);
  if (pr) pr.value = String(p);

  var nLab = document.getElementById('binNLabel');
  var pLab = document.getElementById('binPLabel');
  if (nLab) nLab.textContent = String(n);
  if (pLab) pLab.textContent = p.toFixed(2).replace('.', ',');

  var kEl = document.getElementById('binK');
  if (kEl) {
    kEl.setAttribute('max', String(n));
    var kv = parseInt(kEl.value, 10);
    if (Number.isNaN(kv) || kv < 0) kv = 0;
    if (kv > n) kEl.value = String(n);
  }
  var xcdfEl = document.getElementById('binXcdf');
  if (xcdfEl) {
    xcdfEl.setAttribute('max', String(n));
    var xv = parseInt(xcdfEl.value, 10);
    if (Number.isNaN(xv) || xv < 0) xv = 0;
    if (xv > n) xcdfEl.value = String(n);
  }

  var labels = [];
  var vals = [];
  for (var kk = 0; kk <= n; kk++) {
    labels.push(String(kk));
    vals.push(binomialPMF(n, kk, p));
  }

  var canvas = document.getElementById('binomChart');
  if (!canvas || typeof Chart === 'undefined') return;

  var kInput = document.getElementById('binK');
  var hi = kInput ? parseInt(kInput.value, 10) : NaN;
  if (Number.isNaN(hi)) hi = Math.round(n * p);
  hi = Math.max(0, Math.min(n, hi));

  var bg = vals.map(function (_v, i) {
    return i === hi ? 'rgba(243,156,18,0.75)' : 'rgba(59,130,196,0.55)';
  });
  var border = vals.map(function (_v, i) {
    return i === hi ? '#D68910' : '#2563A0';
  });

  if (binomBarChart) binomBarChart.destroy();

  binomBarChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'P(X = k)',
          data: vals,
          backgroundColor: bg,
          borderColor: border,
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
              var v = ctx.parsed.y;
              return 'P(X = ' + ctx.label + ') = ' + v.toFixed(4).replace('.', ',');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Wahrscheinlichkeit' }
        },
        x: {
          title: { display: true, text: 'k (Treffer)' }
        }
      }
    }
  });

  updateBinomProbLabels();
}

function initBinomChartListeners() {
  function bind(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', fn);
    if (el) el.addEventListener('change', fn);
  }
  bind('binNRange', function () {
    var v = parseInt(document.getElementById('binNRange').value, 10);
    var nEl = document.getElementById('binN');
    if (nEl) nEl.value = String(v);
    var kEl = document.getElementById('binK');
    if (kEl) {
      var kk = parseInt(kEl.value, 10);
      if (kk > v) kEl.value = String(v);
    }
    updateBinomChart();
  });
  bind('binPRange', function () {
    var v = parseNum(document.getElementById('binPRange').value);
    var pEl = document.getElementById('binP');
    if (pEl) pEl.value = String(v).replace('.', ',');
    updateBinomChart();
  });
  bind('binN', function () {
    var nr = document.getElementById('binNRange');
    if (nr) nr.value = document.getElementById('binN').value;
    updateBinomChart();
  });
  bind('binP', function () {
    var pr = document.getElementById('binPRange');
    if (pr) pr.value = String(parseNum(document.getElementById('binP').value));
    updateBinomChart();
  });
  bind('binK', function () {
    updateBinomChart();
  });
  bind('binXcdf', function () {
    updateBinomProbLabels();
  });
}

// ══════════════════════════════════════════════
// Abschlussquiz
// ══════════════════════════════════════════════
var finalQuizData = [
  {
    q: 'Welche Bedingung passt <em>nicht</em> zum Standard-Binomialmodell?',
    opts: [
      'festes n',
      'genau zwei mögliche Ausgänge pro Versuch',
      'die Versuche sind abhängig voneinander',
      'konstante Erfolgswahrscheinlichkeit p'
    ],
    correct: 2,
    explain:
      'Unabhängigkeit der Versuche ist Voraussetzung — abhängige Versuche würden das einfache Binomialmodell verletzen.'
  },
  {
    q: 'Für X ~ Bin(n, p) gilt der Erwartungswert …',
    opts: ['E(X) = p', 'E(X) = n \u00b7 p', 'E(X) = n + p', 'E(X) = n / p'],
    correct: 1,
    explain: 'Erwartungswert: E(X) = n \u00b7 p.'
  },
  {
    q: 'Die Varianz von X ~ Bin(n, p) ist …',
    opts: ['n \u00b7 p', 'n \u00b7 p \u00b7 (1 \u2212 p)', '(n \u00b7 p)\u00b2', 'p \u00b7 (1 \u2212 p)'],
    correct: 1,
    explain: 'Var(X) = n \u00b7 p \u00b7 (1 \u2212 p).'
  },
  {
    q: 'P(X \u2264 3) bedeutet im Kontext „Anzahl Treffer“ …',
    opts: [
      'genau 3 Treffer',
      'mindestens 3 Treffer',
      'h\u00f6chstens 3 Treffer',
      'keine Treffer'
    ],
    correct: 2,
    explain: 'F(x)=P(X\u2264x): „h\u00f6chstens x“ — hier h\u00f6chstens 3 Treffer.'
  },
  {
    q: 'Die Wahrscheinlichkeitsfunktion P(X = k) bei der Binomialverteilung ist …',
    opts: [
      'eine Dichte, die man integriert',
      'eine Punktwahrscheinlichkeit (diskret)',
      'immer gleich 1/n',
      'nur f\u00fcr kontinuierliche X definiert'
    ],
    correct: 1,
    explain: 'Binomial ist diskret: P(X=k) ist eine echte Wahrscheinlichkeit f\u00fcr einzelne k.'
  },
  {
    q: 'Im Beispiel X ~ Bin(10; 0,3): Was beschreibt P(X = 4) in Worten?',
    opts: [
      'Wahrscheinlichkeit f\u00fcr mindestens 4 Zusagen',
      'Wahrscheinlichkeit f\u00fcr genau 4 Zusagen bei 10 Anrufen',
      'Wahrscheinlichkeit, dass p = 4 ist',
      'Erwartete Anzahl der Zusagen'
    ],
    correct: 1,
    explain: 'P(X=4) ist die Wahrscheinlichkeit f\u00fcr genau 4 Treffer (Zusagen).'
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
    msg = 'Hervorragend — das Binomialmodell sitzt!';
    badges = '<span class="earned-badge gold">Gold — Binomialverteilung</span>';
  } else if (pct >= 67) {
    msg = 'Sehr gut! Die markierten Fragen kurz wiederholen.';
    badges = '<span class="earned-badge silver">Silber — guter Stand</span>';
  } else {
    msg = 'Wiederhole n, p, P(X=k) und die Kennzahlen E(X), Var(X).';
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
// Übungen (numerisch)
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

function checkBioU1() {
  var v = parseFractionOrDecimal(document.getElementById('bio_u1').value);
  var fb = document.getElementById('fb_bio_u1');
  var exp = binomialPMF(10, 3, 0.3);
  if (approxEq(v, exp, 0.015)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Passt! P(X=3) \u2248 ' + exp.toFixed(4).replace('.', ',') + ' (Formel mit Binomialkoeffizient und Potenzen).';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Tipp: \\(\\binom{10}{3}\\,0{,}3^3\\,0{,}7^7\\). Nutze den Rechner auf Station 6 oder das interaktive Diagramm.';
  }
}

function checkBioU2() {
  var v = parseNum(document.getElementById('bio_u2').value);
  var fb = document.getElementById('fb_bio_u2');
  if (approxEq(v, 3, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Richtig: E(X) = n\u00b7p = 10\u00b70,3 = 3.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Erwartungswert: E(X) = n \u00b7 p.';
  }
}

function checkBioU3() {
  var v = parseFractionOrDecimal(document.getElementById('bio_u3').value);
  var fb = document.getElementById('fb_bio_u3');
  var exp = binomialCDFAt(10, 2, 0.3);
  if (approxEq(v, exp, 0.02)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Stimmt: P(X\u22642) = P(0)+P(1)+P(2) \u2248 ' + exp.toFixed(4).replace('.', ',') + '.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Summiere P(X=k) f\u00fcr k = 0, 1, 2 oder nutze die CDF-Anzeige im interaktiven Teil.';
  }
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
