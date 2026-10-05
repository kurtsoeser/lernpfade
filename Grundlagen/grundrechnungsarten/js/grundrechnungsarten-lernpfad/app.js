/**
 * Lernpfad 02: Die 4 Grundrechnungsarten
 */
var TOTAL_SECTIONS = 8;
var completedSections = new Set();
var currentTab = 0;
var currentFQ = 0;
var fqAnswers = [];

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

function checkOrderExercise() {
  var v = parseNum(document.getElementById('ord_input').value);
  var fb = document.getElementById('fb_ord');
  if (approxEq(v, 14, 0)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Genau: 2 + 3 \u00b7 4 = 2 + 12 = 14 (Punkt vor Strich).';
    markComplete(4);
  } else if (approxEq(v, 20, 0)) {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c 20 w\u00e4re (2+3)\u00b74 \u2014 aber ohne Klammern gilt Punkt vor Strich.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Tipp: Zuerst 3\u00b74, dann +2.';
  }
}

function runRoundTool() {
  var raw = parseNum(document.getElementById('rnd_value').value);
  var places = parseInt(document.getElementById('rnd_places').value, 10);
  var out = document.getElementById('rnd_out');
  if (!Number.isFinite(raw) || !Number.isFinite(places) || places < 0) {
    out.textContent = 'Bitte g\u00fcltige Zahl und Nachkommastellen eingeben.';
    out.style.color = 'var(--red)';
    return;
  }
  var f = Math.pow(10, places);
  var rounded = Math.round((raw + Number.EPSILON) * f) / f;
  out.style.color = 'var(--green)';
  out.textContent =
    raw.toLocaleString('de-AT') +
    ' gerundet auf ' +
    places +
    ' Nachkommastelle(n): ' +
    rounded.toLocaleString('de-AT', {
      minimumFractionDigits: places,
      maximumFractionDigits: places
    });
}

function checkRoundExercise() {
  var a = parseNum(document.getElementById('rnd_ex_a').value);
  var b = parseNum(document.getElementById('rnd_ex_b').value);
  var fb = document.getElementById('fb_rnd_ex');
  var okA = approxEq(a, 3.14, 0.001);
  var okB = approxEq(b, 2.5, 0.001) || approxEq(b, 2.50, 0.001);
  if (okA && okB) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Stimmt: \u03c0 \u2248 3,14 (2 NK); 2,45 \u2192 2,5 (kaufm\u00e4nnisch, 1 NK).';
    markComplete(5);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Erwartet: 3,14 und 2,5. Merke: ab 5 wird in der Regel aufgerundet (kaufm\u00e4nnisch).';
  }
}

function checkEstimate() {
  var choice = document.querySelector('[data-quiz="est1"] .quiz-option.selected');
  var num = parseNum(document.getElementById('est_num').value);
  var fb = document.getElementById('fb_est');
  var okChoice = choice && parseInt(choice.dataset.idx, 10) === 1;
  var okNum = approxEq(num, 50, 5) || (num >= 45 && num <= 55);
  if (okChoice && okNum) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Gut abgesch\u00e4tzt: 19,8 \u2248 20 und 2,4 \u2248 2,5 \u21d2 etwa 50.';
    markComplete(6);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c W\u00e4hle die sinnvolle Gr\u00f6\u00dfenordnung und tippe eine Sch\u00e4tzung nahe 50.';
  }
}

function checkPractice() {
  var a = parseNum(document.getElementById('pra_a').value);
  var b = parseNum(document.getElementById('pra_b').value);
  var c = parseNum(document.getElementById('pra_c').value);
  var fb = document.getElementById('fb_pra');
  var ok =
    approxEq(a, -1.5, 0.01) && approxEq(b, 0.25, 0.01) && approxEq(c, 12.6, 0.05);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Sehr gut!<br>a) 3/2 \u2212 3 = \u22121,5<br>b) (\u22121/2)\u00b7(\u22121/2)=1/4=0,25<br>c) 4,2\u00b73=12,6';
    markComplete(7);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Noch nicht alle richtig. Achte auf Vorzeichen, Br\u00fcche und Punkt-vor-Strich.';
  }
}

var finalQuizData = [
  {
    q: 'Punkt vor Strich bedeutet \u2026',
    opts: [
      'Addition vor Multiplikation',
      'Multiplikation/Division vor Addition/Subtraktion',
      'immer von rechts nach links rechnen',
      'Klammern sind verboten'
    ],
    correct: 1,
    explain: 'Zuerst \u00b7 und :, dann + und \u2212 — Klammern haben Vorrang.'
  },
  {
    q: 'Welche Rechnung ist in \u2115 nicht immer m\u00f6glich (Ergebnis wieder in \u2115)?',
    opts: ['3 + 5', '4 \u00b7 2', '3 \u2212 5', '0 + 7'],
    correct: 2,
    explain: '3 \u2212 5 = \u22122 verl\u00e4sst \u2115 — deshalb brauchen wir \u2124.'
  },
  {
    q: 'Kaufm\u00e4nnisches Runden von 7,45 auf 1 Nachkommastelle ergibt \u2026',
    opts: ['7,4', '7,5', '7,0', '8'],
    correct: 1,
    explain: 'Die Ziffer nach der Rundungsstelle ist 5 \u21d2 aufrunden \u21d2 7,5.'
  },
  {
    q: 'Sinnvolle Genauigkeit: Ein Preis wird oft \u2026',
    opts: [
      'auf 6 Nachkommastellen angegeben',
      'auf Cent (2 Nachkommastellen) gerundet',
      'nur als nat\u00fcrliche Zahl ohne Cent',
      'immer ungerundet gelassen'
    ],
    correct: 1,
    explain: 'Geld: typischerweise 2 Nachkommastellen (Cent).'
  },
  {
    q: 'Absch\u00e4tzen von 49,7 : 9,8 liegt am ehesten bei \u2026',
    opts: ['0,5', '5', '50', '500'],
    correct: 1,
    explain: '50 : 10 = 5 — eine gute Gr\u00f6\u00dfenordnung.'
  },
  {
    q: '(-3) \u00b7 (-4) ergibt \u2026',
    opts: ['-12', '12', '-7', '7'],
    correct: 1,
    explain: 'Minus mal Minus ergibt Plus: 12.'
  },
  {
    q: 'Welche Aussage zu rationalen Zahlen stimmt beim Rechnen?',
    opts: [
      'Summe zweier rationaler Zahlen ist wieder rational',
      'Quotient zweier rationaler Zahlen ist immer ganzzahlig',
      'Man darf durch 0 dividieren',
      'Negative Zahlen sind nie rational'
    ],
    correct: 0,
    explain: '\u211a ist bez\u00fcglich +, \u2212, \u00b7 geschlossen; Division nur f\u00fcr Nenner \u2260 0.'
  },
  {
    q: '2\u00b9/\u00b3 als Taschenrechner-N\u00e4herung 1,25992\u2026 — sinnvoll gerundet auf 2 NK:',
    opts: ['1,25', '1,26', '1,2', '1,30'],
    correct: 1,
    explain: 'Dritte Nachkommastelle 9 \u21d2 aufrunden \u21d2 1,26.'
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
    msg = 'Ausgezeichnet — Rechnen, Runden und Absch\u00e4tzen sitzen!';
    badges = '<span class="earned-badge gold">Gold \u2014 Grundrechenarten</span>';
  } else if (pct >= 75) {
    msg = 'Sehr gut! Die markierten Fragen kurz wiederholen.';
    badges = '<span class="earned-badge silver">Silber \u2014 solider Stand</span>';
  } else {
    msg = 'Wiederhole Punkt-vor-Strich, Vorzeichenregeln und kaufm\u00e4nnisches Runden.';
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
});
