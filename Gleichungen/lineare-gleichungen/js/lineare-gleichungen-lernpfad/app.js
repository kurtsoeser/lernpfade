/**
 * Lernpfad: Lineare Gleichungen — Theorie / Grundlagen
 */
var TOTAL_SECTIONS = 7;
var completedSections = new Set();
var currentTab = 0;
function parseNum(str) {
  if (str == null) return NaN;
  var s = String(str).trim().replace(/\s/g, '').replace(',', '.');
  if (!s) return NaN;
  // Brüche a/b
  var m = s.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
  if (m) {
    var den = parseFloat(m[2]);
    if (den === 0) return NaN;
    return parseFloat(m[1]) / den;
  }
  return parseFloat(s);
}

function approxEq(a, b, tol) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= (tol == null ? 0.02 : tol);
}

function normalizeEq(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/·/g, '*')
    .replace(/×/g, '*')
    .replace(/,/g, '.');
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
    container.querySelectorAll('.quiz-option').forEach(function (o) {
      o.classList.remove('selected', 'correct-answer', 'wrong-answer');
    });
    if (idx === correct) {
      selected.classList.add('correct-answer');
      if (fb) {
        fb.className = 'feedback correct';
        fb.style.display = 'block';
        fb.textContent = '\u2705 Richtig!';
      }
    } else {
      selected.classList.add('wrong-answer');
      var right = container.querySelectorAll('.quiz-option')[correct];
      if (right) right.classList.add('correct-answer');
      if (fb) {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent = '\u274c Noch nicht — die richtige Antwort ist markiert.';
      }
      allCorrect = false;
    }
  });

  if (allCorrect) markComplete(tabIdx + 1);
}

function setBalance(btn) {
  document.querySelectorAll('#balChoices .eq-chip').forEach(function (c) {
    c.classList.remove('selected');
  });
  btn.classList.add('selected');
  var left = document.getElementById('balLeft');
  var right = document.getElementById('balRight');
  if (left) left.innerHTML = '\\(' + btn.dataset.left + '\\)';
  if (right) right.innerHTML = '\\(' + btn.dataset.right + '\\)';
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([left, right]).catch(function () {});
  }
}

var linMatchData = [
  {
    left: '\\(4x=15\\)',
    correct: 'linear (Grundform)',
    options: ['linear (Grundform)', 'noch nicht linear', 'keine Gleichung', 'immer falsch']
  },
  {
    left: '\\(7x-(4x-5)=29\\)',
    correct: 'linear nach Umformung',
    options: ['linear nach Umformung', 'quadratisch', 'keine Lösung möglich', 'nur mit Technologie']
  },
  {
    left: '\\((x-5)^2=x^2\\)',
    correct: 'wird linear (x² fällt weg)',
    options: ['bleibt quadratisch mit 2 Lösungen', 'wird linear (x² fällt weg)', 'identisch wahr', 'unlösbar']
  },
  {
    left: '\\(x^2+1=0\\) über ℝ',
    correct: 'nicht linear / andere Art',
    options: ['linear (Grundform)', 'wird linear (x² fällt weg)', 'nicht linear / andere Art', 'L={1}']
  }
];

function buildMatch(containerId, data) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  data.forEach(function (item, i) {
    var row = document.createElement('div');
    row.className = 'match-row';
    row.dataset.correct = item.correct;
    var opts = item.options
      .map(function (o) {
        return '<option value="' + o.replace(/"/g, '&quot;') + '">' + o + '</option>';
      })
      .join('');
    row.innerHTML =
      '<label>' +
      (i + 1) +
      '. ' +
      item.left +
      '</label>' +
      '<select aria-label="Zuordnung ' +
      (i + 1) +
      '"><option value="">— wählen —</option>' +
      opts +
      '</select>';
    el.appendChild(row);
  });
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([el]).catch(function () {});
  }
}

function checkMatch(containerId, fbId, sectionOnSuccess) {
  var el = document.getElementById(containerId);
  var fb = document.getElementById(fbId);
  if (!el || !fb) return false;
  var rows = el.querySelectorAll('.match-row');
  var allOk = true;
  var answered = true;
  rows.forEach(function (row) {
    var sel = row.querySelector('select');
    if (!sel.value) {
      answered = false;
      allOk = false;
      sel.style.borderColor = '#E11D48';
      return;
    }
    if (sel.value === row.dataset.correct) {
      sel.style.borderColor = '#16A34A';
      sel.style.background = '#ECFDF3';
    } else {
      sel.style.borderColor = '#E11D48';
      sel.style.background = '#FEF2F2';
      allOk = false;
    }
  });
  if (!answered) {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = 'Bitte alle Zeilen zuordnen.';
    return false;
  }
  if (allOk) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Alle Zuordnungen stimmen!';
    if (sectionOnSuccess) markComplete(sectionOnSuccess);
    return true;
  }
  fb.className = 'feedback incorrect';
  fb.style.display = 'block';
  fb.textContent = '\u274c Noch nicht alles richtig — prüfe die markierten Zeilen.';
  return false;
}

function checkLinMatch() {
  checkMatch('linMatch', 'fb_lin_match', 2);
}

var textMatchData = [
  {
    left: 'Addiert man zu einer Zahl x die 7 …',
    correct: 'x + 7',
    options: ['x + 7', '7x', 'x - 7', '7 - x']
  },
  {
    left: '… erhält man 19.',
    correct: '= 19',
    options: ['= 19', '· 19', '+ 19', 'x = 19x']
  },
  {
    left: 'Das Doppelte der Zahl',
    correct: '2x',
    options: ['2x', 'x/2', 'x + 2', 'x²']
  },
  {
    left: 'um 5 vermindert',
    correct: '… − 5',
    options: ['… − 5', '… + 5', '5 − …', '… · 5']
  }
];

function checkTextMatch() {
  checkMatch('textMatch', 'fb_text_match', null);
}

function revealNextHint(id) {
  var ladder = document.querySelector('.hint-ladder[data-hints="' + id + '"]');
  if (!ladder) return;
  var steps = ladder.querySelectorAll('.hint-step');
  var next = null;
  for (var i = 0; i < steps.length; i++) {
    if (!steps[i].classList.contains('visible')) {
      next = steps[i];
      break;
    }
  }
  if (!next) {
    steps.forEach(function (s) {
      s.classList.remove('visible');
    });
    var btn0 = ladder.querySelector('.btn-hint');
    if (btn0) btn0.textContent = '\ud83d\udca1 N\u00e4chster Tipp';
    return;
  }
  next.classList.add('visible');
  var remaining = 0;
  steps.forEach(function (s) {
    if (!s.classList.contains('visible')) remaining++;
  });
  var btn = ladder.querySelector('.btn-hint');
  if (btn) {
    btn.textContent =
      remaining > 0 ? '\ud83d\udca1 N\u00e4chster Tipp' : '\ud83d\udca1 Tipps zur\u00fccksetzen';
  }
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([next]).catch(function () {});
  }
}

function checkUmform() {
  var a = parseNum(document.getElementById('um_a').value);
  var b = parseNum(document.getElementById('um_b').value);
  var fb = document.getElementById('fb_um');
  var ok = approxEq(a, 8) && approxEq(b, 8);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Beide Lösungen: L={8}.';
    markComplete(3);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Noch nicht. Nutze die Tipps oder die Beispiele darüber.';
  }
}

function checkTrainA() {
  var a1 = parseNum(document.getElementById('tr_a1').value);
  var a2 = parseNum(document.getElementById('tr_a2').value);
  var a3 = parseNum(document.getElementById('tr_a3').value);
  var fb = document.getElementById('fb_tr_a');
  var ok = approxEq(a1, 4) && approxEq(a2, 0) && approxEq(a3, -25 / 3, 0.03);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Richtig: \(x=4\), \(x=0\), \(x=-\\frac{25}{3}\).';
    markComplete(4);
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Prüfe Zusammenfassen und Vorzeichen. Aufgabe 3: links 6x−18, rechts 7+9x.';
  }
}

function checkTrainB() {
  var b1 = parseNum(document.getElementById('tr_b1').value);
  var b2 = parseNum(document.getElementById('tr_b2').value);
  var b3 = parseNum(document.getElementById('tr_b3').value);
  var fb = document.getElementById('fb_tr_b');
  var ok = approxEq(b1, -16) && approxEq(b2, -1.5) && approxEq(b3, 50 / 11, 0.03);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 Richtig: \(x=-16\), \(x=-1{,}5\), \(x=\\frac{50}{11}\).';
    markComplete(4);
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Klammern zuerst. Bei Bedarf Tipps nutzen.';
  }
}

function checkSchwerA() {
  var a = parseNum(document.getElementById('sw_a').value);
  var b = parseNum(document.getElementById('sw_b').value);
  var fb = document.getElementById('fb_sw_a');
  var ok = approxEq(a, 31) && approxEq(b, 13);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Nach dem Wegfall von x²: L={31} bzw. L={13}.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Binom/Produkt ausmultiplizieren, dann x²-Terme streichen.';
  }
}

function checkZ43() {
  var a = parseNum(document.getElementById('z43_a').value);
  var b = parseNum(document.getElementById('z43_b').value);
  var c = parseNum(document.getElementById('z43_c').value);
  var fb = document.getElementById('fb_z43');
  var ok = approxEq(a, 2) && approxEq(b, 0.1, 0.005) && approxEq(c, -1.5);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 a) \(x=2\) · b) \(a=\\frac{1}{10}\) · c) \(x=-1{,}5\)';
    markComplete(5);
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Noch nicht. Bei b) mit 18 multiplizieren; bei c) Klammern auflösen.';
  }
}

function eqAcceptable(raw, variants) {
  var n = normalizeEq(raw);
  return variants.some(function (v) {
    return n === normalizeEq(v);
  });
}

function checkTextTasks() {
  var eq = document.getElementById('tx_eq').value;
  var x = parseNum(document.getElementById('tx_x').value);
  var age = parseNum(document.getElementById('tx_age').value);
  var fb = document.getElementById('fb_tx');
  var eqOk = eqAcceptable(eq, [
    'x+32=5(x-8)',
    'x+32=5*(x-8)',
    '32+x=5(x-8)',
    '5(x-8)=x+32'
  ]);
  var ok = eqOk && approxEq(x, 18) && approxEq(age, 50 / 3, 0.05);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 A: \(x=18\). B: Tochter \(\\frac{50}{3}\\approx 16{,}67\) Jahre.';
    markComplete(6);
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Gleichung A prüfen (Form x+32=5(x-8)). Alter: (t+10)+(2t+10)=70.';
  }
}

function checkGeo() {
  var a = parseNum(document.getElementById('geo_a').value);
  var b = parseNum(document.getElementById('geo_b').value);
  var c = parseNum(document.getElementById('geo_c').value);
  var fb = document.getElementById('fb_geo');
  var vals = [a, b, c].filter(Number.isFinite).sort(function (u, v) {
    return u - v;
  });
  var ok =
    vals.length === 3 && approxEq(vals[0], 4) && approxEq(vals[1], 8) && approxEq(vals[2], 10);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Seiten 4 cm, 8 cm und 10 cm (Umfang 22 cm).';
    markComplete(6);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Mit zweiter Seite x: x/2 + x + (x+2) = 22.';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  buildMatch('linMatch', linMatchData);
  buildMatch('textMatch', textMatchData);
  updateProgress();
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise().catch(function () {});
  }
});
