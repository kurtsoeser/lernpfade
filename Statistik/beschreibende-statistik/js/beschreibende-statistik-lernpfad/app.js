/**
 * Lernpfad: Beschreibende Statistik (Lage, Streuung, Zusammenhang, Konzentration)
 */
var TOTAL_SECTIONS = 9;
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
        fb.textContent =
          '\u274c Leider falsch. Die richtige Antwort ist markiert.';
      }
      allCorrect = false;
    }
  });

  if (allCorrect) markComplete(tabIdx + 1);
}

function checkBsMeanExercise() {
  var v = parseNum(document.getElementById('bs_mean_input').value);
  var fb = document.getElementById('fb_bs_mean');
  if (approxEq(v, 14, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Richtig: \\(\\bar{x} = 70/5 = 14\\).';
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u274c Summe aller Werte durch \\(n=5\\).';
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  }
}

function checkBsRangeExercise() {
  var v = parseNum(document.getElementById('bs_range_input').value);
  var fb = document.getElementById('fb_bs_range');
  if (approxEq(v, 38, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Richtig: \\(R = 58 - 20 = 38\\).';
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.innerHTML = '\u274c Spannweite = Maximum \u2212 Minimum.';
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  }
}

var finalQuizData = [
  {
    q: 'F\u00fcr nominalskalierte Daten (z.\u00a0B. Lieblingsmarke) ist sinnvoll vor allem …',
    opts: [
      'das arithmetische Mittel',
      'der Modus (h\u00e4ufigste Auspr\u00e4gung)',
      'der Median',
      'das geometrische Mittel'
    ],
    correct: 1,
    explain:
      'Nominal: nur h\u00e4ufigste Kategorie (Modus) ist fachlich sinnvoll — kein Mittelwert der „Labels“.'
  },
  {
    q: 'Bei starken Ausrei\u00dfern bei metrischen Einkommensdaten ist oft sinnvoller als das arithmetische Mittel …',
    opts: [
      'der Modus allein',
      'der Median',
      'die Spannweite allein ohne Median',
      'ein Kreisdiagramm ohne Zahlen'
    ],
    correct: 1,
    explain:
      'Der Median ist robust gegen\u00fcber Extremwerten und beschreibt die „Mitte“ oft besser bei Schiefe.'
  },
  {
    q: 'Die Standardabweichung unterscheidet sich von der Varianz vor allem dadurch, dass …',
    opts: [
      'sie immer negativ sein kann',
      'sie wieder in der urspr\u00fcnglichen Einheit der Daten angegeben wird',
      'sie nur f\u00fcr nominale Daten definiert ist',
      'sie ohne Mittelwert berechenbar ist'
    ],
    correct: 1,
    explain: '\\(\\sigma = \\sqrt{\\sigma^2}\\) — gleiche Einheit wie die Daten, besser interpretierbar.'
  },
  {
    q: 'Der Interquartilsabstand (IQR) beschreibt typischerweise …',
    opts: [
      'die Spannweite der Extremwerte',
      'die Streuung der mittleren 50\u00a0% der Daten (\\(Q_3-Q_1\\))',
      'den Median',
      'die Korrelation zweier Merkmale'
    ],
    correct: 1,
    explain: 'IQR = \\(Q_3 - Q_1\\) — robuste Streuungsma\u00df f\u00fcr die mittlere H\u00e4lfte.'
  },
  {
    q: 'Der Korrelationskoeffizient nach Pearson misst …',
    opts: [
      'jede Art von Zusammenhang, auch stark gekr\u00fcmmt',
      'die St\u00e4rke eines linearen Zusammenhangs (metrisch)',
      'die Ursache eines Effekts',
      'die Konzentration einer Einkommensverteilung'
    ],
    correct: 1,
    explain:
      'Pearson-\\(r\\): linearer Zusammenhang; keine Kausalit\u00e4t; nicht-linear kann \\(r\\) klein sein.'
  },
  {
    q: 'Eine Lorenzkurve liegt umso weiter unter der 45\u00b0-Gleichverteilungslinie, …',
    opts: [
      'desto gleicher ist die Verteilung',
      'desto ungleicher ist die Verteilung (st\u00e4rkere Konzentration)',
      'desto kleiner ist immer der Median',
      'desto gr\u00f6\u00dfer ist immer die Standardabweichung der Stichprobe'
    ],
    correct: 1,
    explain:
      'Abstand zur Gleichverteilungslinie: Ma\u00df f\u00fcr Ungleichverteilung (Lorenz, Gini).'
  },
  {
    q: 'Der Gini-Koeffizient \\(G\\) mit \\(G=0\\) bedeutet …',
    opts: [
      'maximale Konzentration',
      'vollkommene Gleichverteilung',
      'keine Daten',
      'perfekte negative Korrelation'
    ],
    correct: 1,
    explain: '\\(G=0\\): vollkommene Gleichheit; \\(G\\) nahe 1: starke Konzentration.'
  },
  {
    q: 'Im Boxplot zeigt die L\u00e4nge der Box vor allem …',
    opts: [
      'die Anzahl der Datenpunkte',
      'die Streuung der mittleren 50\u00a0% (Abstand \\(Q_1\\) bis \\(Q_3\\))',
      'immer den Mittelwert',
      'die Korrelation'
    ],
    correct: 1,
    explain: 'Box von \\(Q_1\\) bis \\(Q_3\\) — je breiter, desto gr\u00f6\u00dfer die Streuung der mittleren 50\u00a0%.'
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
      dot.classList.add('correct-dot');
    } else {
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
    msg = 'Ausgezeichnet — Lage, Streuung, Zusammenhang und Konzentration sitzen!';
    badges = '<span class="earned-badge gold">Gold \u2014 Beschreibende Statistik</span>';
  } else if (pct >= 75) {
    msg = 'Sehr gut! Die markierten Fragen kurz wiederholen.';
    badges = '<span class="earned-badge silver">Silber \u2014 solider Stand</span>';
  } else {
    msg =
      'Wiederhole Zentralma\u00dfe nach Datentyp, Streuung, Pearson, Lorenz/Gini und Boxplot.';
    badges = '<span class="earned-badge bronze">Bronze \u2014 weiter \u00fcben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;

  if (score >= 6) markComplete(9);

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
