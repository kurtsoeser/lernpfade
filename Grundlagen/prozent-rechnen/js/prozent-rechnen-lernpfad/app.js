/**
 * Lernpfad 03: Rechnen mit Prozenten
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

function runPercentCalc() {
  var mode = document.getElementById('pc_mode').value;
  var g = parseNum(document.getElementById('pc_g').value);
  var w = parseNum(document.getElementById('pc_w').value);
  var p = parseNum(document.getElementById('pc_p').value);
  var out = document.getElementById('pc_out');

  if (mode === 'W') {
    if (!Number.isFinite(g) || !Number.isFinite(p)) {
      out.textContent = 'Bitte Grundwert G und Prozentsatz p eingeben.';
      out.style.color = 'var(--red)';
      return;
    }
    var W = (g * p) / 100;
    out.style.color = 'var(--green)';
    out.textContent =
      'W = G \u00b7 p / 100 = ' +
      g +
      ' \u00b7 ' +
      p +
      ' / 100 = ' +
      W.toLocaleString('de-AT', { maximumFractionDigits: 4 });
  } else if (mode === 'G') {
    if (!Number.isFinite(w) || !Number.isFinite(p) || p === 0) {
      out.textContent = 'Bitte Prozentwert W und Prozentsatz p (\u2260 0) eingeben.';
      out.style.color = 'var(--red)';
      return;
    }
    var G = (w * 100) / p;
    out.style.color = 'var(--green)';
    out.textContent =
      'G = W \u00b7 100 / p = ' +
      w +
      ' \u00b7 100 / ' +
      p +
      ' = ' +
      G.toLocaleString('de-AT', { maximumFractionDigits: 4 });
  } else {
    if (!Number.isFinite(w) || !Number.isFinite(g) || g === 0) {
      out.textContent = 'Bitte Prozentwert W und Grundwert G (\u2260 0) eingeben.';
      out.style.color = 'var(--red)';
      return;
    }
    var P = (w / g) * 100;
    out.style.color = 'var(--green)';
    out.textContent =
      'p = W / G \u00b7 100 = ' +
      w +
      ' / ' +
      g +
      ' \u00b7 100 = ' +
      P.toLocaleString('de-AT', { maximumFractionDigits: 4 }) +
      ' %';
  }
}

function checkThreeSizes() {
  var w = parseNum(document.getElementById('ts_w').value);
  var g = parseNum(document.getElementById('ts_g').value);
  var p = parseNum(document.getElementById('ts_p').value);
  var fb = document.getElementById('fb_ts');
  var ok =
    approxEq(w, 45, 0.05) && approxEq(g, 200, 0.05) && approxEq(p, 12, 0.05);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Stimmt:<br>W = 15\u00a0% von 300 = 45<br>G bei W=24 und p=12\u00a0%: G = 200<br>p bei W=18 und G=150: p = 12\u00a0%';
    markComplete(3);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Formeln: W = G\u00b7p/100, G = W\u00b7100/p, p = W/G\u00b7100. Nochmal versuchen!';
  }
}

function checkChange() {
  var a = parseNum(document.getElementById('ch_a').value);
  var b = parseNum(document.getElementById('ch_b').value);
  var fb = document.getElementById('fb_ch');
  if (approxEq(a, 92, 0.05) && approxEq(b, 20, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 80 \u00b7 1,15 = 92; Erh\u00f6hung von 50 auf 60 ist +20\u00a0%.';
    markComplete(4);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c a) Faktor 1,15 bei +15\u00a0%. b) Differenz/Ausgangswert\u00b7100.';
  }
}

function checkContext() {
  var a = parseNum(document.getElementById('cx_a').value);
  var b = parseNum(document.getElementById('cx_b').value);
  var fb = document.getElementById('fb_cx');
  if (approxEq(a, 42.5, 0.1) && approxEq(b, 8, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Neuer Preis 42,50 \u20ac; Ausschuss 8 von 100 = 8\u00a0%.';
    markComplete(5);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c a) 50 \u00b7 0,85 = 42,5. b) 8 von 100 sind 8\u00a0%.';
  }
}

function checkPermille() {
  var a = parseNum(document.getElementById('pm_a').value);
  var b = parseNum(document.getElementById('pm_b').value);
  var fb = document.getElementById('fb_pm');
  if (approxEq(a, 0.003, 0.0001) || approxEq(a, 0.3, 0.01)) {
    // accept 3‰ as 0.003 or wrongly as 0.3% - only 0.003
  }
  var okA = approxEq(a, 0.003, 0.00005);
  var okB = approxEq(b, 12, 0.05);
  if (okA && okB) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 3\u2030 = 0,003; 18 von 1500 = 12\u2030.';
    markComplete(6);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c 1\u2030 = 1/1000 = 0,001. Anteil\u00b71000 ergibt Promille.';
  }
}

function checkMixed() {
  var a = parseNum(document.getElementById('mx_a').value);
  var b = parseNum(document.getElementById('mx_b').value);
  var fb = document.getElementById('fb_mx');
  if (approxEq(a, 126.5, 0.1) && approxEq(b, 25, 0.1)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 110 \u00b7 1,15 = 126,5; 15 ist 25\u00a0% von 60.';
    markComplete(7);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c a) +15\u00a0% \u21d2 \u00b7 1,15. b) 15/60\u00b7100 = 25.';
  }
}

var finalQuizData = [
  {
    q: '1\u00a0% bedeutet \u2026',
    opts: ['1 von 10', '1 von 100', '1 von 1000', '1 von 10000'],
    correct: 1,
    explain: 'Prozent = von Hundert: 1\u00a0% = 1/100.'
  },
  {
    q: '1\u2030 (Promille) bedeutet \u2026',
    opts: ['1/100', '1/10', '1/1000', '10\u00a0%'],
    correct: 2,
    explain: 'Promille = von Tausend: 1\u2030 = 1/1000.'
  },
  {
    q: 'Prozentwert W bei G = 200 und p = 15\u00a0% ist \u2026',
    opts: ['15', '30', '3', '215'],
    correct: 1,
    explain: 'W = 200 \u00b7 15 / 100 = 30.'
  },
  {
    q: 'Eine Erh\u00f6hung um 20\u00a0% entspricht dem Faktor \u2026',
    opts: ['0,20', '1,20', '20', '0,80'],
    correct: 1,
    explain: 'Neu = Alt \u00b7 (1 + 0,20) = Alt \u00b7 1,20.'
  },
  {
    q: 'Eine Verminderung um 20\u00a0% entspricht dem Faktor \u2026',
    opts: ['1,20', '0,20', '0,80', '20'],
    correct: 2,
    explain: 'Neu = Alt \u00b7 (1 \u2212 0,20) = Alt \u00b7 0,80.'
  },
  {
    q: 'p = W/G \u00b7 100 liefert \u2026',
    opts: [
      'den Grundwert in Euro',
      'den Prozentsatz',
      'immer den Rabatt',
      'das Promille'
    ],
    correct: 1,
    explain: 'Das ist die Formel f\u00fcr den Prozentsatz p.'
  },
  {
    q: 'Ein Artikel kostet 80\u00a0\u20ac und wird um 25\u00a0% reduziert. Neuer Preis:',
    opts: ['55\u00a0\u20ac', '60\u00a0\u20ac', '75\u00a0\u20ac', '105\u00a0\u20ac'],
    correct: 1,
    explain: '80 \u00b7 0,75 = 60.'
  },
  {
    q: '12 von 400 entsprechen \u2026',
    opts: ['12\u00a0%', '3\u00a0%', '0,3\u00a0%', '30\u00a0%'],
    correct: 1,
    explain: '12/400 \u00b7 100 = 3\u00a0%.'
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
    msg = 'Ausgezeichnet — Prozent und Promille beherrschst du sicher!';
    badges = '<span class="earned-badge gold">Gold \u2014 Prozentrechnen</span>';
  } else if (pct >= 75) {
    msg = 'Sehr gut! Schau dir die markierten Fragen noch einmal an.';
    badges = '<span class="earned-badge silver">Silber \u2014 solider Stand</span>';
  } else {
    msg = 'Wiederhole W = G\u00b7p/100 und die Faktoren bei Erh\u00f6hen/Vermindern.';
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
