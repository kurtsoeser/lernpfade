/**
 * Lernpfad: Optimierungsprozesse - Teil B
 * Regression, Residuen, Modellgüte.
 */
var TOTAL_SECTIONS = 8;
var completedSections = new Set();
var currentTab = 0;

var datasets = {
  study: {
    label: 'Lernzeit und Testpunkte',
    note: 'Mehr Lernzeit hängt hier ungefähr linear mit mehr Punkten zusammen. Das Modell ist nur im beobachteten Bereich plausibel.',
    xLabel: 'Stunden',
    yLabel: 'Punkte',
    points: [
      { x: 1, y: 42 }, { x: 2, y: 50 }, { x: 3, y: 57 },
      { x: 4, y: 63 }, { x: 5, y: 69 }, { x: 6, y: 76 }
    ]
  },
  ad: {
    label: 'Werbeausgaben und Absatz',
    note: 'Der Absatz steigt zuerst deutlich, danach flacht der Effekt ab. Ein quadratisches Modell beschreibt diese Sättigung im Datenbereich oft besser.',
    xLabel: 'Werbung in 100 EUR',
    yLabel: 'Absatz',
    points: [
      { x: 1, y: 32 }, { x: 2, y: 48 }, { x: 3, y: 61 },
      { x: 4, y: 70 }, { x: 5, y: 76 }, { x: 6, y: 79 }
    ]
  },
  cooling: {
    label: 'Abkühlung eines Getränks',
    note: 'Der Verlauf ist gekrümmt. Eine lineare Regression kann lokal brauchbar sein, aber fachlich ist ein Abkühlungsprozess meist nicht langfristig linear.',
    xLabel: 'Minuten',
    yLabel: 'Temperatur',
    points: [
      { x: 0, y: 82 }, { x: 2, y: 65 }, { x: 4, y: 54 },
      { x: 6, y: 47 }, { x: 8, y: 42 }, { x: 10, y: 38 }
    ]
  }
};

var regState = { dataset: 'study', model: 'linear' };
var currentQuiz = 0;
var quizAnswers = [];

function fmt(num, digits) {
  if (!Number.isFinite(num)) return '-';
  return num.toLocaleString('de-AT', {
    minimumFractionDigits: digits == null ? 2 : digits,
    maximumFractionDigits: digits == null ? 2 : digits
  });
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

  completedSections.add(idx + 1);
  updateProgress();

  if (idx === 1) updateResidualDemo();
  if (idx === 3) setTimeout(drawRegressionLab, 60);
  if (idx === 4) updateR2Demo();
  if (idx === 7) buildQuiz();

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
  if (tx) tx.textContent = 'Station ' + completedSections.size + ' von ' + TOTAL_SECTIONS + ' besucht';
  document.querySelectorAll('.tab-btn').forEach(function (btn, i) {
    btn.classList.toggle('completed-tab', completedSections.has(i + 1));
  });
}

function linearFit(points) {
  var n = points.length;
  var sx = 0, sy = 0, sxx = 0, sxy = 0;
  points.forEach(function (p) {
    sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y;
  });
  var a = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  var b = (sy - a * sx) / n;
  return { type: 'linear', a: a, b: b, predict: function (x) { return a * x + b; } };
}

function solve3(A, b) {
  var m = [
    [A[0][0], A[0][1], A[0][2], b[0]],
    [A[1][0], A[1][1], A[1][2], b[1]],
    [A[2][0], A[2][1], A[2][2], b[2]]
  ];
  for (var c = 0; c < 3; c++) {
    var pivot = c;
    for (var r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[pivot][c])) pivot = r;
    var tmp = m[c]; m[c] = m[pivot]; m[pivot] = tmp;
    var div = m[c][c] || 1;
    for (var j = c; j < 4; j++) m[c][j] /= div;
    for (var rr = 0; rr < 3; rr++) {
      if (rr === c) continue;
      var factor = m[rr][c];
      for (var jj = c; jj < 4; jj++) m[rr][jj] -= factor * m[c][jj];
    }
  }
  return [m[0][3], m[1][3], m[2][3]];
}

function quadraticFit(points) {
  var n = points.length;
  var sx = 0, sx2 = 0, sx3 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0;
  points.forEach(function (p) {
    var x2 = p.x * p.x;
    sx += p.x; sx2 += x2; sx3 += x2 * p.x; sx4 += x2 * x2;
    sy += p.y; sxy += p.x * p.y; sx2y += x2 * p.y;
  });
  var sol = solve3([[sx4, sx3, sx2], [sx3, sx2, sx], [sx2, sx, n]], [sx2y, sxy, sy]);
  return { type: 'quadratic', a: sol[0], b: sol[1], c: sol[2], predict: function (x) { return sol[0] * x * x + sol[1] * x + sol[2]; } };
}

function manualFit(points) {
  var aEl = document.getElementById('manualSlope');
  var bEl = document.getElementById('manualIntercept');
  var a = aEl ? parseFloat(aEl.value) : linearFit(points).a;
  var b = bEl ? parseFloat(bEl.value) : linearFit(points).b;
  return { type: 'manual', a: a, b: b, predict: function (x) { return a * x + b; } };
}

function metrics(points, model) {
  var mean = points.reduce(function (s, p) { return s + p.y; }, 0) / points.length;
  var sse = 0, sst = 0;
  points.forEach(function (p) {
    var e = p.y - model.predict(p.x);
    sse += e * e;
    sst += (p.y - mean) * (p.y - mean);
  });
  return { sse: sse, sst: sst, r2: sst === 0 ? 1 : 1 - sse / sst };
}

function modelForState(points) {
  if (regState.model === 'quadratic') return quadraticFit(points);
  if (regState.model === 'manual') return manualFit(points);
  return linearFit(points);
}

function modelLabel(m) {
  if (m.type === 'quadratic') return 'y = ' + fmt(m.a, 2) + 'x² ' + signed(m.b) + 'x ' + signed(m.c);
  return 'y = ' + fmt(m.a, 2) + 'x ' + signed(m.b);
}

function signed(v) {
  return (v < 0 ? '- ' : '+ ') + fmt(Math.abs(v), 2);
}

function setRegDataset(id) {
  regState.dataset = id;
  drawRegressionLab();
}

function setRegModel(model) {
  regState.model = model;
  document.querySelectorAll('.model-chip').forEach(function (b) {
    b.classList.toggle('active', b.dataset.model === model);
  });
  var controls = document.getElementById('manualControls');
  if (controls) controls.style.display = model === 'manual' ? 'grid' : 'none';
  drawRegressionLab();
}

function drawRegressionLab() {
  var canvas = document.getElementById('regCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var ds = datasets[regState.dataset];
  var points = ds.points;
  var model = modelForState(points);
  var m = metrics(points, model);
  var pad = { l: 58, r: 22, t: 28, b: 48 };
  var xs = points.map(function (p) { return p.x; });
  var ys = points.map(function (p) { return p.y; });
  for (var i = 0; i <= 80; i++) {
    var xx = Math.min.apply(null, xs) + (Math.max.apply(null, xs) - Math.min.apply(null, xs)) * i / 80;
    ys.push(model.predict(xx));
  }
  var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
  var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
  var xr = Math.max(1, xmax - xmin), yr = Math.max(1, ymax - ymin);
  xmin -= xr * 0.08; xmax += xr * 0.08; ymin -= yr * 0.14; ymax += yr * 0.14;
  function sx(x) { return pad.l + (x - xmin) / (xmax - xmin) * (canvas.width - pad.l - pad.r); }
  function sy(y) { return canvas.height - pad.b - (y - ymin) / (ymax - ymin) * (canvas.height - pad.t - pad.b); }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FBFCFE'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#D8E2EF'; ctx.lineWidth = 1;
  for (var g = 0; g <= 5; g++) {
    var gx = pad.l + g * (canvas.width - pad.l - pad.r) / 5;
    var gy = pad.t + g * (canvas.height - pad.t - pad.b) / 5;
    ctx.beginPath(); ctx.moveTo(gx, pad.t); ctx.lineTo(gx, canvas.height - pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(canvas.width - pad.r, gy); ctx.stroke();
  }
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pad.l, canvas.height - pad.b); ctx.lineTo(canvas.width - pad.r, canvas.height - pad.b); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, canvas.height - pad.b); ctx.stroke();
  ctx.fillStyle = '#475569'; ctx.font = '14px Nunito, Arial';
  ctx.fillText(ds.xLabel, canvas.width / 2 - 26, canvas.height - 12);
  ctx.save(); ctx.translate(18, canvas.height / 2 + 32); ctx.rotate(-Math.PI / 2); ctx.fillText(ds.yLabel, 0, 0); ctx.restore();
  points.forEach(function (p) {
    var yhat = model.predict(p.x);
    ctx.strokeStyle = '#E11D48'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(sx(p.x), sy(p.y)); ctx.lineTo(sx(p.x), sy(yhat)); ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 4; ctx.beginPath();
  for (var k = 0; k <= 100; k++) {
    var x = xmin + (xmax - xmin) * k / 100;
    var y = model.predict(x);
    if (k === 0) ctx.moveTo(sx(x), sy(y)); else ctx.lineTo(sx(x), sy(y));
  }
  ctx.stroke();
  points.forEach(function (p) {
    ctx.fillStyle = '#FBBF24'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  });
  var eq = document.getElementById('regEq');
  var r2 = document.getElementById('regR2');
  var sse = document.getElementById('regSse');
  var pred = document.getElementById('regPred');
  var text = document.getElementById('regDatasetText');
  var verdict = document.getElementById('regVerdict');
  if (eq) eq.textContent = modelLabel(model);
  if (r2) r2.textContent = fmt(m.r2, 3);
  if (sse) sse.textContent = fmt(m.sse, 2);
  if (pred) pred.textContent = fmt(model.predict(7), 2);
  if (text) text.textContent = ds.label + ': ' + ds.note;
  if (verdict) verdict.textContent = verdictText(regState.dataset, regState.model, m.r2);
}

function verdictText(dataset, model, r2) {
  if (model === 'manual') return 'Beim eigenen Modell siehst du direkt: Schon kleine Parameteränderungen können die Fehlerquadratsumme deutlich verändern.';
  if (dataset === 'ad' && model === 'quadratic') return 'Das quadratische Modell passt hier gut zur abflachenden Wirkung. Trotzdem nur im Datenbereich vorsichtig verwenden.';
  if (dataset === 'cooling' && model === 'linear') return 'Die Gerade beschreibt den Trend grob, aber fachlich ist Abkühlung meist gekrümmt. Das Residuenmuster ist wichtiger als nur R².';
  return r2 > 0.95 ? 'Rechnerisch starke Anpassung. Ergänze in einer Lösung trotzdem immer die sachliche Deutung.' : 'Die Anpassung ist brauchbar, aber prüfe das Residuenmuster und den Kontext genau.';
}

function updateResidualDemo() {
  var points = datasets.study.points;
  var a = parseFloat(document.getElementById('resSlope').value);
  var b = parseFloat(document.getElementById('resIntercept').value);
  var model = { predict: function (x) { return a * x + b; } };
  var sse = 0, sum = 0, maxAbs = 1;
  var residuals = points.map(function (p, i) {
    var r = p.y - model.predict(p.x);
    sse += r * r; sum += r; maxAbs = Math.max(maxAbs, Math.abs(r));
    return { label: String.fromCharCode(65 + i), r: r };
  });
  document.getElementById('resSse').textContent = fmt(sse, 2);
  document.getElementById('resMean').textContent = fmt(sum / points.length, 2);
  var wrap = document.getElementById('residualBars');
  wrap.innerHTML = '';
  residuals.forEach(function (item) {
    var row = document.createElement('div');
    row.className = 'res-row';
    row.innerHTML =
      '<span>Punkt ' + item.label + '</span><span class="res-track"><span class="res-fill ' +
      (item.r < 0 ? 'neg' : '') + '" style="width:' + (Math.abs(item.r) / maxAbs * 48) +
      '%"></span></span><strong>' + fmt(item.r, 1) + '</strong>';
    wrap.appendChild(row);
  });
}

function updateR2Demo() {
  var points = datasets.study.points;
  var a = parseFloat(document.getElementById('r2Slope').value);
  var b = parseFloat(document.getElementById('r2Intercept').value);
  var m = metrics(points, { predict: function (x) { return a * x + b; } });
  document.getElementById('r2Sse').textContent = fmt(m.sse, 2);
  document.getElementById('r2Sst').textContent = fmt(m.sst, 2);
  document.getElementById('r2Value').textContent = fmt(m.r2, 3);
  document.getElementById('r2Label').textContent = m.r2 > 0.95 ? 'sehr hoch' : m.r2 > 0.8 ? 'brauchbar' : 'kritisch';
}

var quizData = [
  { q: 'Was ist ein Residuum?', opts: ['Der Mittelwert aller x-Werte.', 'Die Abweichung y - geschätztes y.', 'Die Steigung der Regressionsgeraden.', 'Die Anzahl der Datenpunkte.'], correct: 1 },
  { q: 'Warum werden bei der Methode der kleinsten Quadrate die Abweichungen quadriert?', opts: ['Damit negative und positive Fehler sich nicht aufheben.', 'Damit alle x-Werte positiv werden.', 'Damit R² immer größer als 1 wird.', 'Damit die Gerade durch alle Punkte geht.'], correct: 0 },
  { q: 'Was bedeutet ein hohes R² sinnvoll formuliert?', opts: ['Das Modell ist automatisch kausal bewiesen.', 'Das Modell erklärt einen großen Teil der Streuung der y-Werte.', 'Alle Residuen sind null.', 'Prognosen außerhalb des Datenbereichs sind sicher.'], correct: 1 },
  { q: 'Welche Aussage zur Modellwahl ist richtig?', opts: ['Das Modell mit dem höchsten R² ist immer fachlich das beste.', 'Der Kontext ist egal, wenn die Rechnung stimmt.', 'Residuenmuster und Plausibilität gehören zur Bewertung.', 'Lineare Modelle dürfen nie verwendet werden.'], correct: 2 },
  { q: 'Was ist bei Prognosen außerhalb des gemessenen Bereichs besonders wichtig?', opts: ['Sie heißen Interpolation.', 'Sie sind immer genauer als Werte im Datenbereich.', 'Man muss sie kritisch kennzeichnen und fachlich prüfen.', 'R² wird dann automatisch besser.'], correct: 2 }
];

function buildQuiz() {
  if (!quizAnswers.length) quizAnswers = new Array(quizData.length).fill(-1);
  var stepper = document.getElementById('opbQuizStepper');
  if (!stepper) return;
  stepper.innerHTML = '';
  quizData.forEach(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'quiz-step-dot' + (i === currentQuiz ? ' active' : '') + (quizAnswers[i] >= 0 ? ' answered' : '');
    b.textContent = i + 1;
    b.onclick = function () { currentQuiz = i; renderQuiz(); };
    stepper.appendChild(b);
  });
  renderQuiz();
}

function renderQuiz() {
  var q = quizData[currentQuiz];
  var wrap = document.getElementById('opbQuizContainer');
  var html = '<div class="quiz-card"><p style="margin-top:0;"><strong>Frage ' + (currentQuiz + 1) + ' von ' + quizData.length + ':</strong> ' + q.q + '</p>';
  html += '<div class="quiz-options">';
  q.opts.forEach(function (opt, i) {
    var cls = 'quiz-option' + (quizAnswers[currentQuiz] === i ? ' selected' : '');
    html += '<div class="' + cls + '" data-idx="' + i + '" onclick="selectFinalQuiz(' + i + ')">' + opt + '</div>';
  });
  html += '</div><div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">';
  if (currentQuiz > 0) html += '<button type="button" class="btn btn-prev" onclick="prevFinalQuiz()">Zurück</button>';
  if (currentQuiz < quizData.length - 1) html += '<button type="button" class="btn btn-next" onclick="nextFinalQuiz()">Weiter</button>';
  else html += '<button type="button" class="btn btn-check" onclick="evaluateFinalQuiz()">Auswerten</button>';
  html += '<button type="button" class="btn btn-prev" onclick="resetFinalQuiz()">Zurücksetzen</button></div></div>';
  wrap.innerHTML = html;
  buildQuizStepperOnly();
}

function buildQuizStepperOnly() {
  document.querySelectorAll('#opbQuizStepper .quiz-step-dot').forEach(function (b, i) {
    b.classList.toggle('active', i === currentQuiz);
    b.classList.toggle('answered', quizAnswers[i] >= 0);
  });
}

function selectFinalQuiz(idx) {
  quizAnswers[currentQuiz] = idx;
  renderQuiz();
}

function nextFinalQuiz() {
  if (currentQuiz < quizData.length - 1) currentQuiz++;
  renderQuiz();
}

function prevFinalQuiz() {
  if (currentQuiz > 0) currentQuiz--;
  renderQuiz();
}

function evaluateFinalQuiz() {
  var score = 0;
  quizData.forEach(function (q, i) {
    if (quizAnswers[i] === q.correct) score++;
  });
  var res = document.getElementById('opbQuizResult');
  res.style.display = 'block';
  res.className = score === quizData.length ? 'feedback correct' : 'feedback hint';
  res.textContent = score + ' von ' + quizData.length + ' richtig. ' +
    (score === quizData.length ? 'Sehr gut: Regression, Residuen und Modellgüte sitzen.' : 'Schau dir die markierten Themen noch einmal an und wiederhole die Auswertung.');
  if (score === quizData.length) completedSections.add(8);
  updateProgress();
}

function resetFinalQuiz() {
  quizAnswers = new Array(quizData.length).fill(-1);
  currentQuiz = 0;
  var res = document.getElementById('opbQuizResult');
  if (res) res.style.display = 'none';
  buildQuiz();
}

document.addEventListener('DOMContentLoaded', function () {
  ['resSlope', 'resIntercept'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateResidualDemo);
  });
  ['r2Slope', 'r2Intercept'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateR2Demo);
  });
  ['manualSlope', 'manualIntercept'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', drawRegressionLab);
  });
  switchTab(0);
});
