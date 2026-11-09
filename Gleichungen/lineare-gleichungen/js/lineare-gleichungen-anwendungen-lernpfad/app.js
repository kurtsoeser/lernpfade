/**
 * Lernpfad: Lineare Gleichungen — Anwendungen
 */
var TOTAL_SECTIONS = 7;
var completedSections = new Set();
var currentTab = 0;
var mixTrainFlags = { essig: false, alk: false, wasser: false };

function parseNum(str) {
  if (str == null) return NaN;
  var s = String(str).trim().replace(/\s/g, '').replace(',', '.');
  if (!s) return NaN;
  var m = s.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
  if (m) {
    var den = parseFloat(m[2]);
    if (den === 0) return NaN;
    return parseFloat(m[1]) / den;
  }
  return parseFloat(s);
}

function approxEq(a, b, tol) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= (tol == null ? 0.05 : tol);
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
    if (btn0) btn0.textContent = '\ud83d\udca1 N\u00e4chster Hinweis';
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
      remaining > 0 ? '\ud83d\udca1 N\u00e4chster Hinweis' : '\ud83d\udca1 Hinweise zur\u00fccksetzen';
  }
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([next]).catch(function () {});
  }
}

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
  fb.textContent = '\u274c Noch nicht alles richtig.';
  return false;
}

var modelMatchData = [
  {
    left: 'Zwei Züge fahren aufeinander zu',
    correct: 'Bewegung: Strecken addieren',
    options: [
      'Bewegung: Strecken addieren',
      'Mischung: reiner Stoff',
      'Nur Prozentfaktor',
      'Binomische Formel'
    ]
  },
  {
    left: 'Alkohol 80 % mit 56 % zu 70 %',
    correct: 'Mischung: reiner Stoff',
    options: [
      'Bewegung: Strecken addieren',
      'Mischung: reiner Stoff',
      'Nur Prozentfaktor',
      'Leere Menge'
    ]
  },
  {
    left: 'Gehalt, 15 % sparen, Rest bekannt',
    correct: 'Prozentgleichung / Faktor',
    options: [
      'Bewegung: Strecken addieren',
      'Mischung: reiner Stoff',
      'Prozentgleichung / Faktor',
      'Quadratische Gleichung'
    ]
  }
];

function checkModelMatch() {
  checkMatch('modelMatch', 'fb_model_match', 1);
}

function eqOk(raw, variants) {
  var n = normalizeEq(raw);
  return variants.some(function (v) {
    return n === normalizeEq(v);
  });
}

function checkPercent() {
  var eq = document.getElementById('pct_eq').value;
  var g = parseNum(document.getElementById('pct_g').value);
  var n = parseNum(document.getElementById('pct_n').value);
  var fb = document.getElementById('fb_pct');
  var eqFine = eqOk(eq, [
    'G*0.85=3060',
    '0.85*G=3060',
    'G*0,85=3060',
    'G*(1-0.15)=3060',
    '0.85G=3060',
    'G*85/100=3060'
  ]);
  // auch ohne G-Buchstaben
  if (!eqFine) {
    eqFine = eqOk(eq, ['x*0.85=3060', '0.85*x=3060', 'x*0,85=3060']);
  }
  var ok = eqFine && approxEq(g, 3600, 1) && approxEq(n, 2685, 1);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Gehalt 3600 €, Netto 2685 €.';
    markComplete(2);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Gleichung z. B. G*0,85=3060; Netto = 3222/1,2.';
  }
}

function checkKapital() {
  var k = parseNum(document.getElementById('pct_k').value);
  var fb = document.getElementById('fb_kap');
  if (approxEq(k, 3800, 1)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 K · 1,05 = 3990 → K = 3800 €.';
    markComplete(2);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c K · 1,05 = 3990 lösen.';
  }
}

function cellHas(str, patterns) {
  var n = normalizeEq(str);
  return patterns.some(function (p) {
    return n.indexOf(normalizeEq(p)) !== -1 || n === normalizeEq(p);
  });
}

function checkMixDemo() {
  var r1 = document.getElementById('md_r1').value;
  var r2 = document.getElementById('md_r2').value;
  var mt = document.getElementById('md_mt').value;
  var rt = document.getElementById('md_rt').value;
  var x = parseNum(document.getElementById('md_x').value);
  var fb = document.getElementById('fb_mix_demo');

  var okR1 = cellHas(r1, ['0.15*x', '0.15x', '15/100*x', 'x*0.15', '0,15x', '0,15*x']);
  var okR2 = cellHas(r2, ['1600', '0.4*4000', '0.40*4000', '4000*0.4']);
  var okMt = cellHas(mt, ['4000+x', 'x+4000']);
  var okRt = cellHas(rt, [
    '0.3*(4000+x)',
    '0.30*(4000+x)',
    '0,3*(4000+x)',
    '0.3(4000+x)',
    '30/100*(4000+x)'
  ]);
  // x = 400/0.15 = 2666.666...
  var okX = approxEq(x, 2666.67, 2) || approxEq(x, 8000 / 3, 2);

  if (okR1 && okR2 && okMt && okRt && okX) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Tabelle und x ≈ 2667 l stimmen.';
    markComplete(3);
    var barA = document.getElementById('mixBarA');
    var barB = document.getElementById('mixBarB');
    if (barA && barB) {
      var share = (x / (x + 4000)) * 100;
      barA.style.width = share + '%';
      barB.style.width = 100 - share + '%';
    }
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Reiner Stoff: 0,15·x bzw. 1600; Gemischmenge 4000+x; x≈2667 aus der Gleichung.';
  }
}

function maybeCompleteMixTrain() {
  if (mixTrainFlags.essig && mixTrainFlags.alk && mixTrainFlags.wasser) {
    markComplete(4);
  }
}

function checkEssig() {
  var a = parseNum(document.getElementById('mix_e10').value);
  var b = parseNum(document.getElementById('mix_e2').value);
  var fb = document.getElementById('fb_essig');
  var ok = approxEq(a, 0.75, 0.02) && approxEq(b, 1.25, 0.02);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 0,75 l (10 %) und 1,25 l (2 %).';
    mixTrainFlags.essig = true;
    maybeCompleteMixTrain();
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c 0,1x + 0,02(2−x) = 0,05·2';
  }
}

function checkAlkohol() {
  var a = parseNum(document.getElementById('mix_a80').value);
  var b = parseNum(document.getElementById('mix_a56').value);
  var fb = document.getElementById('fb_alk');
  var ok = approxEq(a, 196 / 0.24, 1) && approxEq(b, 1400 - 196 / 0.24, 1);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 ≈ 816,67 l (80 %) und ≈ 583,33 l (56 %).';
    mixTrainFlags.alk = true;
    maybeCompleteMixTrain();
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Nutze die gestaffelten Hinweise.';
  }
}

function checkWasser() {
  var w = parseNum(document.getElementById('mix_w').value);
  var fb = document.getElementById('fb_wasser');
  if (approxEq(w, 40 / 3, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML = '\u2705 \(w=\\frac{40}{3}\\approx 13{,}33\) l Wasser.';
    mixTrainFlags.wasser = true;
    maybeCompleteMixTrain();
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c 0,8·8 = 0,3·(8+w) → w = 40/3.';
  }
}

function setHelpMode(btn) {
  document.querySelectorAll('.help-toggle button').forEach(function (b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');
  var mode = btn.dataset.help;
  var t = document.getElementById('helpTable');
  var e = document.getElementById('helpEq');
  if (t) t.classList.toggle('show', mode === 'table');
  if (e) e.classList.toggle('show', mode === 'eq');
  if (mode === 'table' && window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([t]).catch(function () {});
  }
}

function checkBike() {
  var t = parseNum(document.getElementById('mov_t').value);
  var s = parseNum(document.getElementById('mov_sb').value);
  var fb = document.getElementById('fb_bike');
  // 10x+15x=20 → x=0.8 h = 48 min; Britta 8 km
  if (approxEq(t, 48, 0.5) && approxEq(s, 8, 0.1)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Nach 48 min; Britta 8 km (Judith 12 km).';
    markComplete(5);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c (10+15)·t_h = 20 → t_h = 0,8 h = 48 min.';
  }
}

function checkPreise() {
  var a = parseNum(document.getElementById('pr1').value);
  var b = parseNum(document.getElementById('pr2').value);
  var c = parseNum(document.getElementById('pr3').value);
  var fb = document.getElementById('fb_preise');
  if (approxEq(a, 30000, 1) && approxEq(b, 20000, 1) && approxEq(c, 10000, 1)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 30 000 €, 20 000 €, 10 000 €.';
    markComplete(5);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c x + (2/3)x + (1/3)x = 60 000.';
  }
}

function checkNachzuegler() {
  var m = parseNum(document.getElementById('nz_min').value);
  var km = parseNum(document.getElementById('nz_km').value);
  var fb = document.getElementById('fb_nz');
  if (approxEq(m, 30, 0.5) && approxEq(km, 2, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Nach 30 min bei 2 km.';
    markComplete(6);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Gleichung 4x = 6(x − 1/6). Hinweise nutzen.';
  }
}

function checkSwim() {
  var m = parseNum(document.getElementById('sw_min').value);
  var fb = document.getElementById('fb_swim');
  if (approxEq(m, 2.5, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Jens holt nach 2,5 min auf (90x = 70x + 50).';
    markComplete(6);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Vorsprung 50 m: schnellere Strecke = langsamere + 50.';
  }
}

function checkZugErr() {
  var container = document.querySelector('[data-quiz="zug_err"]');
  if (!container) return;
  var selected = container.querySelector('.quiz-option.selected, .quiz-option.correct-answer');
  // already handled visually via checkQuizGroup path if included; standalone:
  var correct = parseInt(container.dataset.correct, 10);
  var sel = container.querySelector('.quiz-option.selected');
  var fb = document.getElementById('fb_zug_err');
  if (!sel) return;
  var idx = parseInt(sel.dataset.idx, 10);
  container.querySelectorAll('.quiz-option').forEach(function (o) {
    o.classList.remove('correct-answer', 'wrong-answer');
  });
  if (idx === correct) {
    sel.classList.add('correct-answer');
    if (fb) {
      fb.className = 'feedback correct';
      fb.style.display = 'block';
      fb.textContent = '\u2705 Gegenverkehr: Strecken addieren sich zur Distanz.';
    }
  } else {
    sel.classList.add('wrong-answer');
    container.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
    if (fb) {
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = '\u274c 80x = 160(x−1) setzt die Strecken gleich — falsch bei Gegenverkehr.';
    }
  }
}

function checkSrdp() {
  var sim = parseNum(document.getElementById('srdp_sim').value);
  var g = parseNum(document.getElementById('srdp_g').value);
  var cam = parseNum(document.getElementById('srdp_cam').value);
  var fb = document.getElementById('fb_srdp');
  var ok =
    approxEq(sim, 28, 0.1) && approxEq(g, 2500 / 0.91, 1) && approxEq(cam, 0.4, 0.02);
  // also check zug if selected
  checkZugErr();
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Simon 28 km; G ≈ 2747,25 €; Campari 0,4 l. Fehleranalyse Zug siehe Markierung.';
    markComplete(7);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Simon: s+1,5s=70. Rabatt: 0,91G=2500. Campari: 1,6 l Gesamt, Anteil 1/4.';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  buildMatch('modelMatch', modelMatchData);
  updateProgress();
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise().catch(function () {});
  }
});
