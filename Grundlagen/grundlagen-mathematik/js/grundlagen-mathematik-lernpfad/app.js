/**
 * Lernpfad 01: Grundlagen der Mathematik — Zahlenmengen
 */
var TOTAL_SECTIONS = 8;
var completedSections = new Set();
var currentTab = 0;
var currentFQ = 0;
var fqAnswers = [];
var numberLineReady = false;

function parseNum(str) {
  return parseFloat(String(str).replace(',', '.').trim());
}

function approxEq(a, b, tol) {
  return Math.abs(a - b) <= (tol || 0.001);
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

  if (idx === 5 && !numberLineReady) {
    numberLineReady = true;
    setTimeout(drawNumberLine, 40);
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
  if (tx)
    tx.textContent =
      'Station ' + completedSections.size + ' von ' + TOTAL_SECTIONS + ' abgeschlossen';
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

function normalizeExample(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/sqrt\(2\)|sqrt2|wurzel2/, '\u221a2')
    .replace(/^pi$|π/, '\u03c0')
    .replace(/,/g, '.');
}

function checkClassify() {
  var nEl = document.getElementById('cl_n');
  var zEl = document.getElementById('cl_z');
  var qEl = document.getElementById('cl_q');
  var rEl = document.getElementById('cl_r');
  var fb = document.getElementById('fb_classify');

  var nVal = nEl ? parseNum(nEl.value) : NaN;
  var okN = Number.isFinite(nVal) && nVal >= 0 && Math.abs(nVal - Math.round(nVal)) < 1e-9;

  var zRaw = zEl ? zEl.value.trim() : '';
  var zVal = parseNum(zRaw);
  var okZ =
    Number.isFinite(zVal) &&
    Math.abs(zVal - Math.round(zVal)) < 1e-9 &&
    (zVal < 0 || zRaw.indexOf('-') >= 0);

  var qRaw = qEl ? normalizeExample(qEl.value) : '';
  var okQ =
    qRaw.indexOf('/') >= 0 ||
    (Number.isFinite(parseNum(qRaw)) && Math.abs(parseNum(qRaw)) > 0 && Math.abs(parseNum(qRaw) % 1) > 1e-9) ||
    ['0.5', '0.75', '0.25', '2', '1/2', '1/3', '3/4', '-3/4'].indexOf(qRaw) >= 0;

  var rRaw = rEl ? normalizeExample(rEl.value) : '';
  var okR =
    rRaw === '\u221a2' ||
    rRaw === '\u03c0' ||
    rRaw === 'e' ||
    rRaw.indexOf('\u221a') >= 0 ||
    Number.isFinite(parseNum(rRaw));

  if (nEl) nEl.style.borderColor = okN ? 'var(--green)' : 'var(--red)';
  if (zEl) zEl.style.borderColor = okZ ? 'var(--green)' : 'var(--red)';
  if (qEl) qEl.style.borderColor = okQ ? 'var(--green)' : 'var(--red)';
  if (rEl) rEl.style.borderColor = okR ? 'var(--green)' : 'var(--red)';

  if (okN && okZ && okQ && okR) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Sehr gut — du hast zu jeder Menge ein passendes Beispiel genannt.';
    markComplete(7);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u274c Mindestens ein Beispiel passt nicht. Tipp: \u2115 z.\u00a0B. 0 oder 3; \u2124 z.\u00a0B. \u22125; \u211a z.\u00a0B. 1/2; \u211d z.\u00a0B. \u221a2 oder \u03c0.';
  }
}

function drawNumberLine() {
  var canvas = document.getElementById('numberLineCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var cssW = canvas.clientWidth || 720;
  var cssH = 220;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var showN = document.getElementById('nl_N') && document.getElementById('nl_N').checked;
  var showZ = document.getElementById('nl_Z') && document.getElementById('nl_Z').checked;
  var showQ = document.getElementById('nl_Q') && document.getElementById('nl_Q').checked;
  var showR = document.getElementById('nl_R') && document.getElementById('nl_R').checked;

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = '#FBFCFE';
  ctx.fillRect(0, 0, cssW, cssH);

  var pad = 36;
  var y = 120;
  var x0 = pad;
  var x1 = cssW - pad;
  var min = -5;
  var max = 5;

  function xOf(v) {
    return x0 + ((v - min) / (max - min)) * (x1 - x0);
  }

  if (showR) {
    ctx.strokeStyle = 'rgba(37,99,235,0.18)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  // arrows
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 - 10, y - 6);
  ctx.lineTo(x1 - 10, y + 6);
  ctx.closePath();
  ctx.fillStyle = '#334155';
  ctx.fill();

  for (var i = min; i <= max; i++) {
    var x = xOf(i);
    ctx.beginPath();
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = '700 12px Nunito, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i), x, y + 28);
  }

  function drawDot(v, color, label, dy) {
    var x = xOf(v);
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (label) {
      ctx.fillStyle = color;
      ctx.font = '700 12px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + dy);
    }
  }

  if (showN) {
    for (var n = 0; n <= 5; n++) drawDot(n, '#16A34A', '', 0);
  }
  if (showZ) {
    for (var z = -5; z <= 5; z++) {
      if (!showN || z < 0) drawDot(z, '#2563EB', '', 0);
    }
  }
  if (showQ) {
    drawDot(-1.5, '#E11D48', '-3/2', -18);
    drawDot(0.5, '#E11D48', '1/2', -18);
    drawDot(2.25, '#E11D48', '9/4', -18);
  }
  if (showR) {
    drawDot(Math.SQRT2, '#7C3AED', '\u221a2', 48);
    drawDot(Math.PI, '#7C3AED', '\u03c0', 48);
  }

  var legend = document.getElementById('nlLegend');
  if (legend) {
    var parts = [];
    if (showN) parts.push('<span style="color:#16A34A;font-weight:800;">\u2115</span> natürliche Zahlen (hier ab 0)');
    if (showZ) parts.push('<span style="color:#2563EB;font-weight:800;">\u2124</span> ganze Zahlen');
    if (showQ) parts.push('<span style="color:#E11D48;font-weight:800;">\u211a</span> ausgewählte rationale Zahlen');
    if (showR) parts.push('<span style="color:#7C3AED;font-weight:800;">\u211d</span> auch irrationale Punkte (\u221a2, \u03c0)');
    legend.innerHTML = parts.length
      ? parts.join(' · ')
      : 'Aktiviere mindestens eine Menge, um Punkte zu sehen.';
  }
}

function checkNumberLineTask() {
  var a = document.getElementById('nl_task_a');
  var b = document.getElementById('nl_task_b');
  var fb = document.getElementById('fb_nl_task');
  var okA = a && parseInt(a.dataset.correct, 10) === parseInt(a.value, 10);
  var okB = b && parseInt(b.dataset.correct, 10) === parseInt(b.value, 10);
  if (okA && okB) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Genau: \u22125 liegt in \u2124 (und \u211a, \u211d), aber nicht in \u2115. \u221a2 ist reell, aber nicht rational.';
    markComplete(6);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Noch nicht. Denk an: negative ganze Zahlen \u2208 \u2124; \u221a2 ist irrational \u21d2 in \u211d, aber nicht in \u211a.';
  }
}

var finalQuizData = [
  {
    q: 'Welche Aussage zu den natürlichen Zahlen \u2115 ist üblich in diesem Lernpfad?',
    opts: [
      '\u2115 enthält alle negativen ganzen Zahlen',
      '\u2115 enthält 0, 1, 2, 3, \u2026 (hier mit 0)',
      '\u2115 enthält alle Brüche',
      '\u2115 enthält nur Primzahlen'
    ],
    correct: 1,
    explain: 'Hier arbeiten wir mit \u2115 = {0, 1, 2, 3, \u2026}. (Manche Bücher starten bei 1 — das wird dann klar gekennzeichnet.)'
  },
  {
    q: 'Die Zahl \u22127 gehört zu \u2026',
    opts: ['nur \u2115', '\u2124, \u211a und \u211d', 'nur \u211a', 'keiner der genannten Mengen'],
    correct: 1,
    explain: '\u22127 ist ganzzahlig, damit auch rational und reell — aber nicht natürlich.'
  },
  {
    q: 'Welche Zahl ist rational?',
    opts: ['\u221a2', '\u03c0', '0,125', 'e (Eulersche Zahl)'],
    correct: 2,
    explain: '0,125 = 1/8 ist ein Bruch zweier ganzer Zahlen \u21d2 rational.'
  },
  {
    q: '„\u2115 \u2282 \u2124 \u2282 \u211a \u2282 \u211d“ bedeutet \u2026',
    opts: [
      'die Mengen sind gleich groß und identisch',
      'jede natürliche Zahl ist ganz, jede ganze rational, jede rationale reell',
      'es gibt keine irrationalen Zahlen',
      'reelle Zahlen sind eine Teilmenge der natürlichen Zahlen'
    ],
    correct: 1,
    explain: 'Die Verschachtelung beschreibt echte Teilmengenbeziehungen (mit üblicher Konvention \u2115 \u2282 \u2124).'
  },
  {
    q: 'Das Symbol \u2208 bedeutet \u2026',
    opts: ['ist Teilmenge von', 'ist Element von', 'ist gleich', 'ist parallel zu'],
    correct: 1,
    explain: 'a \u2208 M heißt: a ist Element der Menge M.'
  },
  {
    q: 'Welche Beschreibung passt zu irrationalen Zahlen?',
    opts: [
      'Sie lassen sich als Bruch zweier ganzer Zahlen schreiben',
      'Sie sind alle negativ',
      'Sie sind reell, aber nicht als Bruch p/q mit q \u2260 0 darstellbar',
      'Sie gehören nicht zu \u211d'
    ],
    correct: 2,
    explain: 'Irrational: reell, aber nicht rational — z.\u00a0B. \u221a2 oder \u03c0.'
  },
  {
    q: 'Auf der Zahlengeraden liegen die ganzen Zahlen \u2026',
    opts: [
      'nur rechts von 0',
      'in gleichen Abständen an den ganzzahligen Markierungen',
      'nur zwischen 0 und 1',
      'nirgends, weil sie abstrakt sind'
    ],
    correct: 1,
    explain: 'Ganze Zahlen sitzen auf den ganzzahligen Tick-Marken; der Abstand 1 ist konstant.'
  },
  {
    q: 'Welche Menge enthält \u221a9?',
    opts: [
      'nur \u211d, weil Wurzel',
      '\u2115, \u2124, \u211a und \u211d, weil \u221a9 = 3',
      'nur \u211a',
      'keine, weil Wurzeln immer irrational sind'
    ],
    correct: 1,
    explain: '\u221a9 = 3 ist natürlich (hier mit 0 in \u2115), also in allen genannten Mengen.'
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
  html +=
    '<p style="font-weight:700; margin-bottom:12px;">Frage ' +
    (idx + 1) +
    ' von ' +
    finalQuizData.length +
    '</p>';
  html += '<p>' + q.q + '</p>';
  q.opts.forEach(function (opt, i) {
    var sel = fqAnswers[idx] === i ? ' selected' : '';
    html +=
      '<div class="quiz-option' + sel + '" onclick="selectFQ(' + i + ')">' + opt + '</div>';
  });
  html += '<div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">';
  if (idx > 0)
    html +=
      '<button type="button" class="btn btn-prev" onclick="showFinalQuestion(' +
      (idx - 1) +
      ')">\u2190 Zur\u00fcck</button>';
  if (idx < finalQuizData.length - 1) {
    html +=
      '<button type="button" class="btn btn-next" onclick="showFinalQuestion(' +
      (idx + 1) +
      ')">Weiter \u2192</button>';
  } else {
    html +=
      '<button type="button" class="btn btn-check" onclick="evaluateFinalQuiz()">Auswerten \u2713</button>';
  }
  html += '</div></div>';
  container.innerHTML = html;

  document.querySelectorAll('.quiz-step-dot').forEach(function (d, i) {
    d.classList.toggle('active', i === idx);
  });

  if (window.MathJax && MathJax.typesetPromise)
    MathJax.typesetPromise([container]).catch(function () {});
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
      if (dot) dot.classList.add('correct-dot');
    } else if (dot) {
      dot.classList.add('wrong-dot');
    }
  });

  var html = '';
  finalQuizData.forEach(function (q, i) {
    var isCorrect = fqAnswers[i] === q.correct;
    html +=
      '<div class="info-box ' +
      (isCorrect ? 'success' : 'danger') +
      '" style="margin:8px 0;">';
    html +=
      '<div class="icon">' + (isCorrect ? '\u2705' : '\u274c') + '</div><div>';
    html += '<strong>Frage ' + (i + 1) + ':</strong> ' + q.explain;
    if (!isCorrect && fqAnswers[i] >= 0) {
      html += '<br><em>Deine Antwort: ' + q.opts[fqAnswers[i]] + '</em>';
    }
    html += '</div></div>';
  });
  document.getElementById('finalQuizContainer').innerHTML = html;

  document.getElementById('finalResult').style.display = 'block';
  document.getElementById('finalScore').textContent =
    score + ' von ' + finalQuizData.length + ' richtig!';

  var pct = Math.round((score / finalQuizData.length) * 100);
  var msg;
  var badges;
  if (pct === 100) {
    msg = 'Ausgezeichnet — Zahlenmengen, Symbole und die Zahlengerade sitzen!';
    badges = '<span class="earned-badge gold">Gold \u2014 Zahlenmengen</span>';
  } else if (pct >= 75) {
    msg = 'Sehr gut! Schau dir die markierten Fragen noch einmal an.';
    badges = '<span class="earned-badge silver">Silber \u2014 solider Stand</span>';
  } else {
    msg = 'Wiederhole \u2115 \u2282 \u2124 \u2282 \u211a \u2282 \u211d und die Bedeutung von \u2208 und \u2282.';
    badges = '<span class="earned-badge bronze">Bronze \u2014 weiter \u00fcben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;

  if (score >= 6) markComplete(8);

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

document.addEventListener('DOMContentLoaded', function () {
  updateProgress();
  buildFinalQuiz();
  ['nl_N', 'nl_Z', 'nl_Q', 'nl_R'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', drawNumberLine);
  });
  window.addEventListener('resize', function () {
    if (currentTab === 5) drawNumberLine();
  });
});
