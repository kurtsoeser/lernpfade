/**
 * Lernpfad: Deskriptive Grundlagen (Datentypen, Häufigkeiten, Grafiken)
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
        fb.textContent =
          '\u274c Leider falsch. Die richtige Antwort ist markiert.';
      }
      allCorrect = false;
    }
  });

  if (allCorrect) markComplete(tabIdx + 1);
}

function checkStatFreqExercise() {
  var raw = document.getElementById('sg_freq_input').value;
  var v = parseNum(raw);
  var fb = document.getElementById('fb_sg_freq');
  if (approxEq(v, 0.4, 0.02) || approxEq(v, 40, 0)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Stimmt: 8 von 20 entspricht 0{,}4 bzw. 40\u00a0%.';
    markComplete(4);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u274c Tipp: Teile die absolute H\u00e4ufigkeit des Bus durch die Gesamtanzahl \\(n=20\\).';
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  }
}

var finalQuizData = [
  {
    q: 'Die Frage „Mit welchem Verkehrsmittel kommst du zur Schule?“ (Auto, Bus, \u2026) liefert Daten auf welchem Niveau?',
    opts: ['nominalskaliert', 'ordinalskaliert', 'metrisch', 'intervallskaliert ohne Ordnung'],
    correct: 0,
    explain:
      'Kategorien ohne sinnvolle Rangfolge sind nominalskaliert — man zählt und vergleicht Häufigkeiten.'
  },
  {
    q: 'Schulnoten von 1 bis 5 sind typischerweise …',
    opts: [
      'metrisch, weil es Zahlen sind',
      'ordinalskaliert, weil eine Reihenfolge besteht, Abstände aber nicht gleich interpretierbar sind',
      'nominalskaliert, weil es Symbole sind',
      'metrisch, weil man Mittelwerte immer bilden darf'
    ],
    correct: 1,
    explain:
      'Ordinal: Reihenfolge ja, gleiche „Abstände“ zwischen Noten sind fachlich nicht garantiert — Mittelwerte sind kritisch zu sehen.'
  },
  {
    q: 'Die relative H\u00e4ufigkeit erhält man durch …',
    opts: [
      'Summe aller absoluten H\u00e4ufigkeiten',
      'absolute H\u00e4ufigkeit geteilt durch den Stichprobenumfang \\(n\\)',
      'Differenz aus Maximum und Minimum',
      'Produkt aus Anteil und 100'
    ],
    correct: 1,
    explain: '\\(h = \\dfrac{\\text{absolute H\u00e4ufigkeit}}{n}\\).'
  },
  {
    q: 'Ein Kreisdiagramm ist besonders sinnvoll, wenn …',
    opts: [
      'man viele feine Kategorien detailliert vergleichen will',
      'Anteile am Ganzen im Mittelpunkt stehen',
      'ein zeitlicher Trend gezeigt werden soll',
      'man exakt zwei metrische Variablen gegen\u00fcberstellt'
    ],
    correct: 1,
    explain:
      'Kreisdiagramm: Anteile eines Ganzen — bei sehr vielen Kategorien wird es oft un\u00fcbersichtlich.'
  },
  {
    q: 'Ein Liniendiagramm ist ungeeignet, wenn …',
    opts: [
      'metrische Messwerte vorliegen',
      'kein sinnvoller zeitlicher oder geordneter Verlauf vorliegt',
      'Ums\u00e4tze \u00fcber 12 Monate dargestellt werden sollen',
      'mindestens drei Messzeitpunkte existieren'
    ],
    correct: 1,
    explain:
      'Liniendiagramme betonen Verlauf/Trend — ohne sinnvolle x-Achse (z.\u00a0B. Zeit) wirkt die Linie oft irref\u00fchrend.'
  },
  {
    q: 'Bei nominalskalierten Daten ist typischerweise …',
    opts: [
      'der Mittelwert die beste Zusammenfassung',
      'nur das Z\u00e4hlen von H\u00e4ufigkeiten sinnvoll; Mittelwerte sind nicht interpretierbar',
      'die Standardabweichung immer zu berichten',
      'ein Boxplot die Pflichtgrafik'
    ],
    correct: 1,
    explain:
      'Nominal: Kategorien — h\u00e4ufigkeiten und Anteile ja, „Mittelwert der Kategorie“ nicht sinnvoll.'
  },
  {
    q: 'Problembezogene Begr\u00fcndung: Zufriedenheitsstufen (sehr gut \u2192 sehr schlecht) will man vergleichen. Sehr passend ist oft …',
    opts: [
      'Liniendiagramm ohne Zeitachse',
      'Balken- oder S\u00e4ulendiagramm mit geordneten Stufen',
      'ein Streudiagramm zweier nominaler Merkmale',
      'ein Histogramm mit Klassenbreite 0'
    ],
    correct: 1,
    explain:
      'Geordnete Stufen (ordinal) lassen sich mit Balken/S\u00e4ulen gut vergleichen; Linien ohne Verlauf sind meist weniger passend.'
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
    msg = 'Ausgezeichnet — du kannst Datentypen, H\u00e4ufigkeiten und Grafikwahl gut einordnen!';
    badges = '<span class="earned-badge gold">Gold \u2014 Deskriptive Grundlagen</span>';
  } else if (pct >= 71) {
    msg = 'Sehr gut! Die markierten Fragen einmal kurz wiederholen.';
    badges = '<span class="earned-badge silver">Silber \u2014 solider Stand</span>';
  } else {
    msg =
      'Wiederhole Skalenniveaus, relative H\u00e4ufigkeit und wann Balken/Kreis/Linie sinnvoll sind.';
    badges = '<span class="earned-badge bronze">Bronze \u2014 weiter \u00fcben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;

  if (score >= 5) markComplete(8);

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
