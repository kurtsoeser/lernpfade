/**
 * Lernpfad: Dynamische Investitionsrechnung
 */
var TOTAL_SECTIONS = 11;
var completedSections = new Set();
var currentTab = 0;

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

  if (window.MathJax && MathJax.typesetPromise) {
    var panel = document.getElementById('panel' + idx);
    if (panel) MathJax.typesetPromise([panel]).catch(function () {});
  }

  if (idx === 1 && typeof window.kwKurveRedraw === 'function') {
    requestAnimationFrame(function () {
      window.kwKurveRedraw();
    });
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
      'Station ' + completedSections.size + ' von ' + TOTAL_SECTIONS + ' besucht';
  document.querySelectorAll('.tab-btn').forEach(function (btn, i) {
    btn.classList.toggle('completed-tab', completedSections.has(i + 1));
  });
}

function selectQuiz(el) {
  var parent = el.closest('.quiz-options');
  parent.querySelectorAll('.quiz-option').forEach(function (o) {
    o.classList.remove('selected', 'correct-answer', 'wrong-answer');
  });
  el.classList.add('selected');
}

function checkDynQuiz() {
  var quizIds = ['di_q1', 'di_q2', 'di_q3', 'di_q4', 'di_q5'];
  var allCorrect = true;
  quizIds.forEach(function (qid) {
    var container = document.querySelector('[data-quiz="' + qid + '"]');
    if (!container) return;
    var correct = parseInt(container.dataset.correct, 10);
    var selected = container.querySelector('.quiz-option.selected');
    var fb = document.getElementById('fb_' + qid);

    container.querySelectorAll('.quiz-option').forEach(function (o) {
      o.classList.remove('correct-answer', 'wrong-answer');
    });

    if (!selected) {
      if (fb) {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent = 'Bitte eine Antwort auswählen.';
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
          '\u274c Leider falsch. Die zutreffende Antwort ist markiert.';
      }
      allCorrect = false;
    }
  });

  var sum = document.getElementById('fb_di_quiz_summary');
  if (sum) {
    sum.style.display = 'block';
    if (allCorrect) {
      sum.className = 'feedback correct';
      sum.textContent =
        '\u2705 Alle f\u00fcnf Antworten richtig \u2014 Kapitalwert, IKV und MIRR sitzen!';
    } else {
      sum.className = 'feedback hint';
      sum.textContent =
        'Noch nicht alle Antworten richtig. Die gr\u00fcn markierten Optionen sind die korrekten L\u00f6sungen.';
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  switchTab(0);
});
