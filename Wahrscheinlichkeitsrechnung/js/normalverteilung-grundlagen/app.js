// ══════════════════════════════════════════════
// Lernpfad: Normalverteilung (Grundlagen) — App
// ══════════════════════════════════════════════
const TOTAL_SECTIONS = 7;
let completedSections = new Set();
let currentTab = 0;
let bellChart = null;
let ruleChart = null;
let bellInitialized = false;
let ruleInitialized = false;

let currentFQ = 0;
let fqAnswers = [];

// ── Parsing ──
function parseNum(str) {
  return parseFloat(String(str).replace(',', '.').trim());
}
function parseProbability(str) {
  const x = parseNum(str);
  if (Number.isNaN(x)) return NaN;
  if (x > 1 && x <= 100) return x / 100;
  return x;
}
function approxEq(a, b, tol) {
  return Math.abs(a - b) <= (tol || 0.01);
}

// ── Normalverteilung: Dichte & Verteilungsfunktion ──
function normalPDF(x, mu, sigma) {
  if (sigma <= 0) return NaN;
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/** Standardnormalverteilung: Φ(z) = P(Z ≤ z) */
function standardNormalCDF(z) {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/** P(X ≤ x) für X ~ N(μ, σ²) */
function normalCDF(x, mu, sigma) {
  if (sigma <= 0) return NaN;
  return standardNormalCDF((x - mu) / sigma);
}

// ══════════════════════════════════════════════
// TABS & FORTSCHRITT
// ══════════════════════════════════════════════
function switchTab(idx) {
  currentTab = idx;
  document.querySelectorAll('.tab-panel').forEach((p, i) => {
    p.classList.toggle('active', i === idx);
  });
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
  const bar = document.querySelector('.tab-bar');
  if (bar) bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (idx === 2 && !ruleInitialized) {
    ruleInitialized = true;
    setTimeout(() => initRuleChart(), 80);
  }
  if (idx === 3 && !bellInitialized) {
    bellInitialized = true;
    setTimeout(() => initBellChart(), 80);
  }

  if (window.MathJax && MathJax.typesetPromise) {
    const panel = document.getElementById('panel' + idx);
    if (panel) MathJax.typesetPromise([panel]).catch(function () {});
  }
  if (idx === 2 && ruleChart) setTimeout(() => ruleChart.resize(), 60);
  if (idx === 3 && bellChart) setTimeout(() => bellChart.resize(), 60);
  if (typeof window.nvRechnerRedrawAll === 'function') {
    setTimeout(() => window.nvRechnerRedrawAll(), 100);
  }
}

function updateProgress() {
  const pct = Math.round((completedSections.size / TOTAL_SECTIONS) * 100);
  const fill = document.getElementById('progressFill');
  const pt = document.getElementById('progressPercent');
  const tx = document.getElementById('progressText');
  if (fill) fill.style.width = pct + '%';
  if (pt) pt.textContent = pct + ' %';
  if (tx) tx.textContent = 'Station ' + completedSections.size + ' von ' + TOTAL_SECTIONS + ' abgeschlossen';
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('completed-tab', completedSections.has(i + 1));
  });
}

function markComplete(secNum) {
  completedSections.add(secNum);
  updateProgress();
}

// ══════════════════════════════════════════════
// QUIZ (Multiple Choice)
// ══════════════════════════════════════════════
function selectQuiz(el) {
  const parent = el.closest('.quiz-options');
  parent.querySelectorAll('.quiz-option').forEach(o => {
    o.classList.remove('selected', 'correct-answer', 'wrong-answer');
  });
  el.classList.add('selected');
}

function checkQuizGroup(tabIdx, quizIds) {
  let allCorrect = true;
  quizIds.forEach(qid => {
    const container = document.querySelector('[data-quiz="' + qid + '"]');
    if (!container) return;
    const correct = parseInt(container.dataset.correct, 10);
    const selected = container.querySelector('.quiz-option.selected');
    const fb = document.getElementById('fb_' + qid);

    if (!selected) {
      if (fb) {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent = 'Bitte wähle eine Antwort aus.';
      }
      allCorrect = false;
      return;
    }

    const idx = parseInt(selected.dataset.idx, 10);
    if (idx === correct) {
      container.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
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
// CHART: 68–95–99,7 (Regel)
// ══════════════════════════════════════════════
function buildPDFPoints(mu, sigma, xMin, xMax, nSteps) {
  const step = (xMax - xMin) / nSteps;
  const pts = [];
  for (let x = xMin; x <= xMax; x += step) {
    pts.push({ x: x, y: normalPDF(x, mu, sigma) });
  }
  return pts;
}

/** Nur Punkte im Intervall — für gefüllte Fläche unter dem Kurvenstück */
function bandPoints(pts, lo, hi) {
  return pts.filter(p => p.x >= lo && p.x <= hi);
}

function initRuleChart() {
  const canvas = document.getElementById('ruleChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const mu = parseFloat(document.getElementById('ruleMu')?.value || '100');
  const sigma = parseFloat(document.getElementById('ruleSigma')?.value || '10');
  const mode = document.querySelector('input[name="ruleBand"]:checked')?.value || '68';

  const span = sigma * 4;
  const xMin = mu - span;
  const xMax = mu + span;
  const pts = buildPDFPoints(mu, sigma, xMin, xMax, 200);

  let lo = mu - sigma;
  let hi = mu + sigma;
  if (mode === '95') {
    lo = mu - 2 * sigma;
    hi = mu + 2 * sigma;
  } else if (mode === '997') {
    lo = mu - 3 * sigma;
    hi = mu + 3 * sigma;
  }

  const bandPts = bandPoints(pts, lo, hi);

  const data = {
    datasets: [
      {
        label: 'hervorgehobenes Intervall',
        data: bandPts,
        order: 1,
        borderColor: 'rgba(243,156,18,0.9)',
        backgroundColor: 'rgba(243,156,18,0.22)',
        fill: true,
        tension: 0.15,
        pointRadius: 0,
        borderWidth: 0
      },
      {
        label: 'Dichte f(x)',
        data: pts,
        order: 2,
        borderColor: '#2563A0',
        backgroundColor: 'rgba(59,130,196,0.08)',
        fill: false,
        tension: 0.15,
        pointRadius: 0,
        borderWidth: 2
      }
    ]
  };

  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, labels: { font: { family: 'Nunito' } } },
        tooltip: { enabled: true }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'x' },
          ticks: { maxTicksLimit: 8 }
        },
        y: {
          title: { display: true, text: 'f(x)' },
          beginAtZero: true
        }
      }
    }
  };

  if (ruleChart) ruleChart.destroy();
  ruleChart = new Chart(canvas.getContext('2d'), config);
}

function updateRuleChart() {
  if (!ruleChart) {
    initRuleChart();
    return;
  }
  const mu = parseFloat(document.getElementById('ruleMu').value);
  const sigma = parseFloat(document.getElementById('ruleSigma').value);
  const mode = document.querySelector('input[name="ruleBand"]:checked').value;

  const span = sigma * 4;
  const xMin = mu - span;
  const xMax = mu + span;
  const pts = buildPDFPoints(mu, sigma, xMin, xMax, 200);

  let lo = mu - sigma;
  let hi = mu + sigma;
  if (mode === '95') {
    lo = mu - 2 * sigma;
    hi = mu + 2 * sigma;
  } else if (mode === '997') {
    lo = mu - 3 * sigma;
    hi = mu + 3 * sigma;
  }

  ruleChart.data.datasets[0].data = bandPoints(pts, lo, hi);
  ruleChart.data.datasets[1].data = pts;
  ruleChart.update();
}

// ══════════════════════════════════════════════
// CHART: μ und σ spielerisch (festes x: 0–100, feste f-Skala)
// ══════════════════════════════════════════════
/** Sichtbares x-Intervall — immer gleich, damit Lage & Streuung vergleichbar sind */
const BELL_X_MIN = 0;
const BELL_X_MAX = 100;
/** Obere Grenze f(x): genug Platz für σ = 1 (max. Dichte ≈ 0,399) */
const BELL_Y_MAX = 0.42;

function initBellChart() {
  const canvas = document.getElementById('bellChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const mu = parseFloat(document.getElementById('bellMu').value);
  const sigma = parseFloat(document.getElementById('bellSigma').value);
  const pts = buildPDFPoints(mu, sigma, BELL_X_MIN, BELL_X_MAX, 220);

  const data = {
    datasets: [
      {
        label: 'f(x) — Normalverteilung',
        data: pts,
        borderColor: '#F39C12',
        backgroundColor: 'rgba(243,156,18,0.15)',
        fill: true,
        tension: 0.15,
        pointRadius: 0,
        borderWidth: 2
      }
    ]
  };

  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 200 },
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: 'Glockenkurve (Dichte) — x von 0 bis 100',
          font: { family: 'Patrick Hand', size: 18 }
        }
      },
      scales: {
        x: {
          type: 'linear',
          min: BELL_X_MIN,
          max: BELL_X_MAX,
          title: { display: true, text: 'x' }
        },
        y: {
          min: 0,
          max: BELL_Y_MAX,
          title: { display: true, text: 'f(x)' }
        }
      }
    }
  };

  if (bellChart) bellChart.destroy();
  bellChart = new Chart(canvas.getContext('2d'), config);
  updateBellLabels();
}

function updateBellChart() {
  const mu = parseFloat(document.getElementById('bellMu').value);
  const sigma = parseFloat(document.getElementById('bellSigma').value);
  document.getElementById('valBellMu').textContent = String(mu).replace('.', ',');
  document.getElementById('valBellSigma').textContent = String(sigma).replace('.', ',');

  if (!bellChart) {
    initBellChart();
    return;
  }
  const pts = buildPDFPoints(mu, sigma, BELL_X_MIN, BELL_X_MAX, 220);
  bellChart.data.datasets[0].data = pts;
  bellChart.options.scales.x.min = BELL_X_MIN;
  bellChart.options.scales.x.max = BELL_X_MAX;
  bellChart.options.scales.y.min = 0;
  bellChart.options.scales.y.max = BELL_Y_MAX;
  bellChart.update();
  updateBellLabels();
}

function updateBellLabels() {
  const mu = parseFloat(document.getElementById('bellMu').value);
  const sigma = parseFloat(document.getElementById('bellSigma').value);
  const el = document.getElementById('bellInterpret');
  if (!el) return;
  var streu =
    sigma < 3 ? 'sehr schmale' : sigma > 12 ? 'breite' : 'mittlere';
  el.innerHTML =
    '<strong>Aktuell:</strong> \\(' +
    '\\mu = ' +
    mu +
    '\\), \\(' +
    '\\sigma = ' +
    sigma +
    '\\) — ' +
    streu +
    ' Streuung.';
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(function () {});
}

// ══════════════════════════════════════════════
// z-Rechner & P(X ≤ x)
// ══════════════════════════════════════════════
function computeZ() {
  const x = parseNum(document.getElementById('z_x').value);
  const mu = parseNum(document.getElementById('z_mu').value);
  const sigma = parseNum(document.getElementById('z_sigma').value);
  const out = document.getElementById('z_out');
  if (Number.isNaN(x) || Number.isNaN(mu) || Number.isNaN(sigma) || sigma <= 0) {
    out.textContent = 'Bitte gültige Zahlen eintragen (σ > 0).';
    out.style.color = 'var(--red)';
    return;
  }
  const z = (x - mu) / sigma;
  out.textContent = 'z = ' + z.toFixed(4).replace('.', ',');
  out.style.color = 'var(--green)';
}

function computePX() {
  const x = parseNum(document.getElementById('px_x').value);
  const mu = parseNum(document.getElementById('px_mu').value);
  const sigma = parseNum(document.getElementById('px_sigma').value);
  const out = document.getElementById('px_out');
  if (Number.isNaN(x) || Number.isNaN(mu) || Number.isNaN(sigma) || sigma <= 0) {
    out.textContent = 'Bitte gültige Zahlen eintragen (σ > 0).';
    out.style.color = 'var(--red)';
    return;
  }
  const p = normalCDF(x, mu, sigma);
  out.innerHTML =
    'P(X ≤ ' +
    String(x).replace('.', ',') +
    ') ≈ ' +
    (p * 100).toFixed(2).replace('.', ',') +
    ' %  (Dezimal: ' +
    p.toFixed(4).replace('.', ',') +
    ')';
  out.style.color = 'var(--green)';
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([out]).catch(function () {});
}

// ══════════════════════════════════════════════
// Übungen (numerisch)
// ══════════════════════════════════════════════
function checkU1() {
  const z = parseNum(document.getElementById('u1_z').value);
  const fb = document.getElementById('fb_u1');
  if (approxEq(z, -2, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Genau: z = (490 − 500) / 5 = −2.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Tipp: z = (x − μ) / σ.';
  }
}

function checkU2() {
  const p = parseProbability(document.getElementById('u2_p').value);
  const fb = document.getElementById('fb_u2');
  if (!Number.isNaN(p) && approxEq(p, 0.0228, 0.02)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Passt! Φ(−2) ≈ 0,0228 — also rund <strong>2,3 %</strong>. (Technologie kann minimal abweichen.)';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Erwartet: etwa 0,023 bzw. 2,3 % (z = −2). Nutze den Rechner oben oder GeoGebra.';
  }
}

function checkU3() {
  const lo = parseNum(document.getElementById('u3_lo').value);
  const hi = parseNum(document.getElementById('u3_hi').value);
  const fb = document.getElementById('fb_u3');
  const okLo = approxEq(lo, 495, 0.5);
  const okHi = approxEq(hi, 505, 0.5);
  if (okLo && okHi) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Richtig: μ ± σ = 500 ± 5 ml.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Faustregel 68 %: Intervall [μ − σ ; μ + σ].';
  }
}

// ══════════════════════════════════════════════
// ABSCHLUSSQUIZ
// ══════════════════════════════════════════════
const finalQuizData = [
  {
    q: 'Die Gesamtfläche unter der Dichtekurve einer Normalverteilung beträgt …',
    opts: ['0,5', '1 (100 %)', 'σ', 'μ'],
    correct: 1,
    explain: 'Die Fläche unter f(x) ist immer 1 — das entspricht 100 % Wahrscheinlichkeit.'
  },
  {
    q: 'Welche Aussage zu \\(\\mu\\) und \\(\\sigma\\) ist zutreffend?',
    opts: [
      '\\(\\mu\\) beschreibt die Streuung, \\(\\sigma\\) die Lage',
      '\\(\\mu\\) verschiebt die Kurve, \\(\\sigma\\) bestimmt die Breite',
      '\\(\\mu\\) und \\(\\sigma\\) sind immer gleich groß',
      '\\(\\sigma\\) ist das Quadrat von \\(\\mu\\)'
    ],
    correct: 1,
    explain: '\\(\\mu\\) ist die Lage (Mitte), \\(\\sigma\\) die typische Streuung (Breite der Glocke).'
  },
  {
    q: 'Die Wendepunkte der Glockenkurve liegen bei …',
    opts: ['x = μ', 'x = μ ± σ²', 'x = μ ± σ', 'x = 0'],
    correct: 2,
    explain: 'Die Wendepunkte sind bei \\(\\mu - \\sigma\\) und \\(\\mu + \\sigma\\).'
  },
  {
    q: 'Nach der Faustregel liegen etwa 95 % der Werte in …',
    opts: ['[μ − σ ; μ + σ]', '[μ − 2σ ; μ + 2σ]', '[μ − 3σ ; μ + 3σ]', '[0 ; 1]'],
    correct: 1,
    explain: 'Etwa 95 % liegen innerhalb von zwei Standardabweichungen: \\([\\mu - 2\\sigma;\\; \\mu + 2\\sigma]\\).'
  },
  {
    q: 'Für die Standardisierung gilt \\(z = \\ldots\\)',
    opts: ['\\(\\dfrac{x + \\mu}{\\sigma}\\)', '\\(\\dfrac{x - \\mu}{\\sigma}\\)', '\\(\\dfrac{\\mu - x}{\\sigma}\\)', '\\(x - \\mu - \\sigma\\)'],
    correct: 1,
    explain: 'Standardisierung: \\(z = \\dfrac{x - \\mu}{\\sigma}\\).'
  },
  {
    q: 'Für die Standardnormalverteilung \\(Z \\sim N(0;\\,1)\\) ist \\(\\Phi(0) = P(Z \\le 0)\\) gleich …',
    opts: ['0', '0,25', '0,5', '1'],
    correct: 2,
    explain: 'Die Kurve ist symmetrisch um 0; die halbe Fläche liegt links von 0: \\(\\Phi(0) = 0{,}5\\).'
  }
];

function buildFinalQuiz() {
  const stepper = document.getElementById('finalQuizStepper');
  if (!stepper) return;
  stepper.innerHTML = '';
  for (let i = 0; i < finalQuizData.length; i++) {
    const dot = document.createElement('div');
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
  const q = finalQuizData[idx];
  const container = document.getElementById('finalQuizContainer');
  let html = '<div class="exercise" style="animation:fadeIn 0.3s ease;">';
  html += '<p style="font-weight:700; margin-bottom:12px;">Frage ' + (idx + 1) + ' von ' + finalQuizData.length + '</p>';
  html += '<p>' + q.q + '</p>';
  q.opts.forEach((opt, i) => {
    const sel = fqAnswers[idx] === i ? ' selected' : '';
    html += '<div class="quiz-option' + sel + '" onclick="selectFQ(' + i + ')">' + opt + '</div>';
  });
  html += '<div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">';
  if (idx > 0) html += '<button class="btn btn-prev" onclick="showFinalQuestion(' + (idx - 1) + ')">\u2190 Zurück</button>';
  if (idx < finalQuizData.length - 1) {
    html += '<button class="btn btn-next" onclick="showFinalQuestion(' + (idx + 1) + ')">Weiter \u2192</button>';
  } else {
    html += '<button class="btn btn-check" onclick="evaluateFinalQuiz()">Auswerten \u2713</button>';
  }
  html += '</div></div>';
  container.innerHTML = html;

  document.querySelectorAll('.quiz-step-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });

  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([container]).catch(function () {});
}

function selectFQ(optIdx) {
  fqAnswers[currentFQ] = optIdx;
  document.querySelectorAll('#finalQuizContainer .quiz-option').forEach((o, i) => {
    o.classList.toggle('selected', i === optIdx);
  });
}

function evaluateFinalQuiz() {
  let score = 0;
  finalQuizData.forEach((q, i) => {
    const dot = document.getElementById('fqDot' + i);
    if (fqAnswers[i] === q.correct) {
      score++;
      dot.classList.add('correct-dot');
    } else {
      dot.classList.add('wrong-dot');
    }
  });

  let html = '';
  finalQuizData.forEach((q, i) => {
    const isCorrect = fqAnswers[i] === q.correct;
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

  const pct = Math.round((score / finalQuizData.length) * 100);
  let msg, badges;
  if (pct === 100) {
    msg = 'Hervorragend — du hast die Grundlagen der Normalverteilung sicher im Griff!';
    badges = '<span class="earned-badge gold">Gold — Normalverteilung</span>';
  } else if (pct >= 67) {
    msg = 'Sehr gut! Kleine Wiederholung schadet nie.';
    badges = '<span class="earned-badge silver">Silber — guter Stand</span>';
  } else {
    msg = 'Lies die Stationen noch einmal gezielt nach — besonders μ, σ und die Faustregel.';
    badges = '<span class="earned-badge bronze">Bronze — weiter üben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;

  if (score >= 4) markComplete(7);

  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise().catch(function () {});
}

function resetFinalQuiz() {
  fqAnswers = new Array(finalQuizData.length).fill(-1);
  document.getElementById('finalResult').style.display = 'none';
  document.querySelectorAll('.quiz-step-dot').forEach(d => {
    d.classList.remove('correct-dot', 'wrong-dot');
  });
  showFinalQuestion(0);
}

// ══════════════════════════════════════════════
// GeoGebra Modal
// ══════════════════════════════════════════════
function closeBinomModal() {
  const modal = document.getElementById('binomModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

function openBinomModal() {
  closeGeoGebraModal();
  if (typeof closeCalculatorModal === 'function') closeCalculatorModal();
  const modal = document.getElementById('binomModal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  if (typeof window.bvRechnerRedrawAll === 'function') {
    setTimeout(function () { window.bvRechnerRedrawAll(); }, 80);
  }
  if (window.MathJax && MathJax.typesetPromise) {
    const body = document.getElementById('binomModalBody');
    if (body) MathJax.typesetPromise([body]).catch(function () {});
  }
}

function openGeoGebraModal() {
  closeBinomModal();
  const modal = document.getElementById('geogebraModal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  if (typeof window.nvRechnerRedrawAll === 'function') {
    setTimeout(function () { window.nvRechnerRedrawAll(); }, 80);
  }
  if (window.MathJax && MathJax.typesetPromise) {
    const body = document.getElementById('ggModalBody');
    if (body) MathJax.typesetPromise([body]).catch(function () {});
  }
}

function closeGeoGebraModal() {
  const modal = document.getElementById('geogebraModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// ══════════════════════════════════════════════
// Schwebende Werkzeuge (Taschenrechner — gekürzt wie Original)
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
  closeGeoGebraModal();
  if (typeof closeBinomModal === 'function') closeBinomModal();
  closeFloatingToolsMenu();
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
function toggleFloatingToolsMenu() {
  var menu = document.getElementById('floatingToolsMenu');
  var fab = document.getElementById('floatingToolsFab');
  if (!menu || !fab) return;
  var open = !menu.classList.contains('open');
  menu.classList.toggle('open', open);
  fab.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function closeFloatingToolsMenu() {
  var menu = document.getElementById('floatingToolsMenu');
  var fab = document.getElementById('floatingToolsFab');
  if (menu) menu.classList.remove('open');
  if (fab) fab.setAttribute('aria-expanded', 'false');
}
function openGeoGebraFromFloatingTools() {
  closeCalculatorModal();
  closeFloatingToolsMenu();
  openGeoGebraModal();
}

function openBinomFromFloatingTools() {
  closeCalculatorModal();
  closeFloatingToolsMenu();
  openBinomModal();
}

document.addEventListener('DOMContentLoaded', function () {
  updateProgress();
  buildFinalQuiz();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    if (typeof closeGeoGebraModal === 'function') closeGeoGebraModal();
    if (typeof closeBinomModal === 'function') closeBinomModal();
    if (typeof closeCalculatorModal === 'function') closeCalculatorModal();
    if (typeof closeFloatingToolsMenu === 'function') closeFloatingToolsMenu();
  }
});
