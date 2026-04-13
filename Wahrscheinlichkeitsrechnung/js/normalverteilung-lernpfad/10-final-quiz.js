// ══════════════════════════════════════════════
// FINAL QUIZ
// ══════════════════════════════════════════════
const finalQuizData = [
  {
    q: 'Welche Art von Verteilung ist die Binomialverteilung?',
    opts: ['Stetig', 'Diskret', 'Symmetrisch', 'Normalverteilt'],
    correct: 1,
    explain: 'Die Binomialverteilung ist diskret \u2014 sie nimmt nur ganzzahlige Werte an.'
  },
  {
    q: 'Wie lautet die Formel f\u00fcr die Standardabweichung bei \\(X \\sim B(n, p)\\)?',
    opts: ['\\(\\sigma = n \\cdot p\\)', '\\(\\sigma = \\sqrt{n \\cdot p}\\)', '\\(\\sigma = \\sqrt{n \\cdot p \\cdot (1-p)}\\)', '\\(\\sigma = n \\cdot p \\cdot (1-p)\\)'],
    correct: 2,
    explain: 'Die Standardabweichung ist \u03c3 = \u221a(n\u00b7p\u00b7(1\u2212p)).'
  },
  {
    q: 'Welche Bedingung muss f\u00fcr die Normalapproximation erf\u00fcllt sein?',
    opts: ['\\(n \\geq 30\\)', '\\(n \\cdot p \\geq 5\\) und \\(n \\cdot (1-p) \\geq 5\\)', '\\(p = 0{,}5\\)', '\\(\\sigma \\geq 10\\)'],
    correct: 1,
    explain: 'Die Faustregel lautet: n\u00b7p \u2265 5 und n\u00b7(1\u2212p) \u2265 5.'
  },
  {
    q: 'Was ist die Stetigkeitskorrektur?',
    opts: ['Eine Rundungsregel f\u00fcr \u03c3', 'Die Erweiterung um \u00b10,5 beim \u00dcbergang diskret \u2192 stetig', 'Eine Formel zur Berechnung von \u03bc', 'Ein Verfahren zur z-Transformation'],
    correct: 1,
    explain: 'Die Stetigkeitskorrektur (\u00b10,5) gleicht den Unterschied zwischen diskreter und stetiger Verteilung aus.'
  },
  {
    q: '\\(P(X \\leq 20)\\) wird mit Stetigkeitskorrektur zu:',
    opts: ['\\(P(X \\leq 19{,}5)\\)', '\\(P(X \\leq 20{,}5)\\)', '\\(P(X \\leq 20)\\)', '\\(P(X \\leq 21)\\)'],
    correct: 1,
    explain: 'Bei \u2264 wird +0,5 addiert: P(X \u2264 20) \u2192 P(X \u2264 20,5).'
  },
  {
    q: 'Bei \\(X \\sim B(200;\\; 0{,}9)\\): Wie gro\u00df ist \\(\\mu\\)?',
    opts: ['\\(\\mu = 20\\)', '\\(\\mu = 90\\)', '\\(\\mu = 180\\)', '\\(\\mu = 200\\)'],
    correct: 2,
    explain: '\u03bc = n\u00b7p = 200 \u00b7 0,9 = 180.'
  }
];


function buildFinalQuiz() {
  const stepper = document.getElementById('finalQuizStepper');
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
  if (idx > 0) html += '<button class="btn btn-prev" onclick="showFinalQuestion(' + (idx-1) + ')">\u2190 Zur\u00fcck</button>';
  if (idx < finalQuizData.length - 1) {
    html += '<button class="btn btn-next" onclick="showFinalQuestion(' + (idx+1) + ')">Weiter \u2192</button>';
  } else {
    html += '<button class="btn btn-check" onclick="evaluateFinalQuiz()">Auswerten \u2713</button>';
  }
  html += '</div></div>';
  container.innerHTML = html;

  document.querySelectorAll('.quiz-step-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });

  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([container]);
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
    if (fqAnswers[i] === q.correct) { score++; dot.classList.add('correct-dot'); }
    else { dot.classList.add('wrong-dot'); }
  });

  let html = '';
  finalQuizData.forEach((q, i) => {
    const isCorrect = fqAnswers[i] === q.correct;
    html += '<div class="info-box ' + (isCorrect ? 'success' : 'danger') + '" style="margin:8px 0;">';
    html += '<div class="icon">' + (isCorrect ? '\u2705' : '\u274c') + '</div><div>';
    html += '<strong>Frage ' + (i+1) + ':</strong> ' + q.explain;
    if (!isCorrect && fqAnswers[i] >= 0) {
      html += '<br><em>Deine Antwort: ' + q.opts[fqAnswers[i]] + '</em>';
    }
    html += '</div></div>';
  });
  document.getElementById('finalQuizContainer').innerHTML = html;

  document.getElementById('finalResult').style.display = 'block';
  document.getElementById('finalScore').textContent = score + ' von ' + finalQuizData.length + ' richtig!';

  const pct = Math.round(score / finalQuizData.length * 100);
  let msg, badges;
  if (pct === 100) {
    msg = 'Perfekt! Du beherrschst die Normalapproximation!';
    badges = '<span class="earned-badge gold">Gold \u2014 Normalverteilungs-Profi</span>';
  } else if (pct >= 67) {
    msg = 'Sehr gut! Nur noch wenige L\u00fccken.';
    badges = '<span class="earned-badge silver">Silber \u2014 Fortgeschritten</span>';
  } else {
    msg = 'Schau dir die Erkl\u00e4rungen oben nochmal an und versuche es erneut!';
    badges = '<span class="earned-badge bronze">Bronze \u2014 Guter Anfang</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;

  if (score >= 4) markComplete(7);

  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise();
}

function resetFinalQuiz() {
  fqAnswers = new Array(finalQuizData.length).fill(-1);
  document.getElementById('finalResult').style.display = 'none';
  document.querySelectorAll('.quiz-step-dot').forEach(d => {
    d.classList.remove('correct-dot', 'wrong-dot');
  });
  showFinalQuestion(0);
}
