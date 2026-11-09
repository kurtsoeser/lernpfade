/**
 * Lernpfad 04: Maßeinheiten
 */
var TOTAL_SECTIONS = 9;
var completedSections = new Set();
var currentTab = 0;
var currentFQ = 0;
var fqAnswers = [];
var ladderPicks = {};

/* Einheit → Basis (SI-ähnlich) */
var TO_BASE = {
  /* Länge in m */
  km: 1000,
  m: 1,
  dm: 0.1,
  cm: 0.01,
  mm: 0.001,
  'µm': 1e-6,
  nm: 1e-9,
  /* Fläche in m² */
  'km²': 1e6,
  ha: 1e4,
  a: 100,
  'm²': 1,
  'dm²': 0.01,
  'cm²': 1e-4,
  'mm²': 1e-6,
  /* Volumen in m³ */
  'm³': 1,
  'dm³': 0.001,
  l: 0.001,
  'ℓ': 0.001,
  hl: 0.1,
  'cm³': 1e-6,
  ml: 1e-6,
  'mm³': 1e-9,
  /* Masse in kg */
  t: 1000,
  dz: 100,
  kg: 1,
  dag: 0.01,
  g: 0.001,
  mg: 1e-6,
  /* Zeit in s */
  d: 86400,
  h: 3600,
  min: 60,
  s: 1,
  ms: 0.001
};

function parseNum(str) {
  if (str == null) return NaN;
  var s = String(str).trim().replace(/\s/g, '').replace(',', '.');
  if (!s) return NaN;
  return parseFloat(s);
}

function approxEq(a, b, tol) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  var t = tol != null ? tol : Math.max(1e-9, Math.abs(b) * 1e-6);
  return Math.abs(a - b) <= t;
}

function formatDe(n, maxFrac) {
  return Number(n).toLocaleString('de-AT', {
    maximumFractionDigits: maxFrac != null ? maxFrac : 6,
    useGrouping: false
  });
}

function convertValue(value, fromUnit, toUnit) {
  var f = TO_BASE[fromUnit];
  var t = TO_BASE[toUnit];
  if (f == null || t == null) return NaN;
  return (value * f) / t;
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

/* ---------- Leitern ---------- */
function buildLadder(containerId, units, infoId, key) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  ladderPicks[key] = [];
  units.forEach(function (u, i) {
    if (i > 0) {
      var arrow = document.createElement('span');
      arrow.className = 'ladder-arrow';
      arrow.textContent = '\u2194';
      el.appendChild(arrow);
    }
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'ladder-chip';
    chip.textContent = u;
    chip.dataset.unit = u;
    chip.onclick = function () {
      pickLadder(key, u, infoId, containerId);
    };
    el.appendChild(chip);
  });
}

function pickLadder(key, unit, infoId, containerId) {
  var picks = ladderPicks[key] || [];
  if (picks.indexOf(unit) >= 0) {
    picks = picks.filter(function (u) {
      return u !== unit;
    });
  } else {
    picks.push(unit);
    if (picks.length > 2) picks = picks.slice(-2);
  }
  ladderPicks[key] = picks;

  document.querySelectorAll('#' + containerId + ' .ladder-chip').forEach(function (c) {
    c.classList.toggle('active', picks.indexOf(c.dataset.unit) >= 0);
  });

  var info = document.getElementById(infoId);
  if (!info) return;
  if (picks.length < 2) {
    info.textContent = 'Tippe auf zwei Einheiten, um den Faktor zu sehen.';
    return;
  }
  var a = picks[0];
  var b = picks[1];
  var factor = convertValue(1, a, b);
  var inv = convertValue(1, b, a);
  info.innerHTML =
    '1&nbsp;' +
    a +
    ' = <strong>' +
    formatDe(factor, 8) +
    '</strong>&nbsp;' +
    b +
    ' &nbsp;·&nbsp; 1&nbsp;' +
    b +
    ' = <strong>' +
    formatDe(inv, 8) +
    '</strong>&nbsp;' +
    a;
}

/* ---------- Convert rows ---------- */
function buildConvertList(containerId, items, instantCheckboxId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  items.forEach(function (it, i) {
    var row = document.createElement('div');
    row.className = 'convert-row';
    row.dataset.answer = String(it.answer);
    row.dataset.tol = String(it.tol != null ? it.tol : 0.01);
    row.innerHTML =
      '<span class="src">' +
      (i + 1) +
      '.) ' +
      it.src +
      '</span>' +
      '<input type="text" inputmode="decimal" aria-label="Antwort ' +
      (i + 1) +
      '" placeholder="?">' +
      '<span class="unit">' +
      it.targetUnit +
      '</span>';
    var input = row.querySelector('input');
    input.addEventListener('blur', function () {
      var cb = document.getElementById(instantCheckboxId);
      if (cb && cb.checked) checkOneConvertRow(row);
    });
    el.appendChild(row);
  });
}

function checkOneConvertRow(row) {
  var input = row.querySelector('input');
  var val = parseNum(input.value);
  var ans = parseFloat(row.dataset.answer);
  var tol = parseFloat(row.dataset.tol);
  input.classList.remove('ok', 'bad');
  if (!Number.isFinite(val)) {
    input.classList.add('bad');
    return false;
  }
  var ok = approxEq(val, ans, tol);
  input.classList.add(ok ? 'ok' : 'bad');
  return ok;
}

function checkConvertGroup(containerId, sectionNum) {
  var el = document.getElementById(containerId);
  var fbId =
    containerId === 'lenConvert'
      ? 'fb_len'
      : containerId === 'areaConvert'
        ? 'fb_area'
        : containerId === 'massConvert'
          ? 'fb_mass'
          : 'fb_trainer';
  var fb = document.getElementById(fbId);
  if (!el) return;
  var rows = el.querySelectorAll('.convert-row');
  var okCount = 0;
  rows.forEach(function (row) {
    if (checkOneConvertRow(row)) okCount++;
  });
  if (okCount === rows.length) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Super — alle ' + rows.length + ' Umrechnungen stimmen!';
    markComplete(sectionNum);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c ' +
      okCount +
      ' von ' +
      rows.length +
      ' richtig. Grüne Felder stimmen, rote nochmals prüfen.';
  }
}

/* ---------- Matching ---------- */
var introMatchData = [
  { left: 'Länge eines Zimmers', correct: 'm', options: ['m', 'kg', 's', 'ℓ'] },
  { left: 'Masse eines Notebooks', correct: 'kg', options: ['m', 'kg', 'ha', 'min'] },
  { left: 'Akkulaufzeit', correct: 'h', options: ['cm²', 'h', 't', 'ml'] },
  { left: 'Fläche eines Sees', correct: 'ha', options: ['ha', 'dag', 'nm', 's'] },
  { left: 'Fassungsvermögen einer Flasche', correct: 'ℓ', options: ['km', 'ℓ', 'dz', 'a'] }
];

var volumeMatchData = [
  { left: '1 dm³', correct: '1 ℓ', options: ['1 ℓ', '1 ml', '1 hl', '1 cm³'] },
  { left: '1 cm³', correct: '1 ml', options: ['1 ℓ', '1 ml', '1 m³', '1 hl'] },
  { left: '1 hl', correct: '100 ℓ', options: ['10 ℓ', '100 ℓ', '1000 ℓ', '1 ℓ'] },
  { left: '1 m³', correct: '1000 ℓ', options: ['100 ℓ', '10 ℓ', '1000 ℓ', '1 ml'] }
];

function buildMatchList(containerId, data) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  data.forEach(function (item, i) {
    var row = document.createElement('div');
    row.className = 'match-row';
    row.dataset.correct = item.correct;
    var opts = item.options
      .map(function (o) {
        return '<option value="' + o + '">' + o + '</option>';
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

function checkMatchList(containerId, fbId, sectionNum) {
  var el = document.getElementById(containerId);
  var fb = document.getElementById(fbId);
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
    return;
  }
  if (allOk) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Alle Zuordnungen stimmen!';
    markComplete(sectionNum);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Noch nicht alles richtig — prüfe die markierten Zeilen.';
  }
}

function checkIntroMatch() {
  checkMatchList('matchIntro', 'fb_match_intro', 1);
}

function checkVolumeMatch() {
  checkMatchList('matchVolume', 'fb_match_vol', 4);
}

function checkNotebookVolume() {
  var cm3 = parseNum(document.getElementById('vol_cm3').value);
  var lit = parseNum(document.getElementById('vol_l').value);
  var fb = document.getElementById('fb_vol');
  var exact = 37.6 * 24.7 * 3.13;
  var okA = approxEq(cm3, Math.round(exact), 2) || approxEq(cm3, exact, 2);
  var okB = approxEq(lit, exact / 1000, 0.002);
  if (okA && okB) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 37,6 · 24,7 · 3,13 \u2248 ' +
      formatDe(exact, 1) +
      ' cm\u00b3 \u2248 ' +
      formatDe(exact / 1000, 3) +
      ' \u2113.';
    markComplete(4);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Volumen = L·B·H ≈ 2907 cm³. Geteilt durch 1000 → Liter (dm³).';
  }
}

function checkTime() {
  var a = parseNum(document.getElementById('time_a').value);
  var b = parseNum(document.getElementById('time_b').value);
  var c = parseNum(document.getElementById('time_c').value);
  var d = parseNum(document.getElementById('time_d').value);
  var fb = document.getElementById('fb_time');
  var ok =
    approxEq(a, 2 + 22 / 60, 0.015) &&
    approxEq(b, 48, 0.5) &&
    approxEq(c, 4, 0.05) &&
    approxEq(d, 240, 0.5);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u2705 2 h 22 min ≈ 2,37 h; 0,8·60 = 48 min; 240 s = 4 min; 4 h = 240 min.';
    markComplete(6);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Minuten durch 60 in Stunden umrechnen — nicht die Minuten hinter dem Komma „ankleben“.';
  }
}

function checkContextNotebook() {
  var area = parseNum(document.getElementById('ctx_area').value);
  var areaM = parseNum(document.getElementById('ctx_area_m2').value);
  var mass = parseNum(document.getElementById('ctx_mass_g').value);
  var fb = document.getElementById('fb_ctx_nb');
  var aExact = 37.6 * 24.7;
  var ok =
    approxEq(area, aExact, 0.2) &&
    approxEq(areaM, aExact / 10000, 0.0005) &&
    approxEq(mass, 2450, 0.5);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Fläche ≈ 928,7 cm² = 0,09287 m²; Masse 2,45 kg = 2450 g.';
    markComplete(8);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c cm² → m²: ÷ 10 000. kg → g: × 1000.';
  }
}

function checkSpeed() {
  var v = parseNum(document.getElementById('ctx_v_kmh').value);
  var ms = parseNum(document.getElementById('ctx_v_ms').value);
  var fb = document.getElementById('fb_speed');
  var exact = 317 / 2.8;
  var ok = approxEq(v, exact, 0.15) && approxEq(ms, exact / 3.6, 0.15);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 v ≈ 113,2 km/h ≈ 31,4 m/s (÷ 3,6).';
    markComplete(8);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c km/h = Strecke/Zeit; m/s = (km/h) ÷ 3,6.';
  }
}

function updateRain(val) {
  var n = parseInt(val, 10) || 0;
  var water = document.getElementById('rainWater');
  var label = document.getElementById('rainLabel');
  if (water) water.style.height = n * 5 + '%';
  if (label) label.textContent = n + ' mm Niederschlagshöhe \u2259 ' + n + ' ℓ/m²';
}

/* ---------- Freier Trainer ---------- */
var trainerPool = [
  { src: '13000 km =', targetUnit: 'm', answer: 13000000, tol: 1 },
  { src: '4 dz =', targetUnit: 't', answer: 0.4, tol: 0.001 },
  { src: '2 min =', targetUnit: 's', answer: 120, tol: 0.1 },
  { src: '300 s =', targetUnit: 'min', answer: 5, tol: 0.05 },
  { src: '4 h =', targetUnit: 'min', answer: 240, tol: 0.1 },
  { src: '60 km² =', targetUnit: 'ha', answer: 6000, tol: 0.5 },
  { src: '3 min =', targetUnit: 's', answer: 180, tol: 0.1 },
  { src: '20000 km =', targetUnit: 'dm', answer: 200000000, tol: 1 },
  { src: '10,7 a =', targetUnit: 'm²', answer: 1070, tol: 0.1 },
  { src: '240 s =', targetUnit: 'min', answer: 4, tol: 0.05 },
  { src: '2,5 m =', targetUnit: 'cm', answer: 250, tol: 0.1 },
  { src: '4500 g =', targetUnit: 'kg', answer: 4.5, tol: 0.01 },
  { src: '0,8 t =', targetUnit: 'kg', answer: 800, tol: 0.1 },
  { src: '5 ha =', targetUnit: 'm²', answer: 50000, tol: 1 },
  { src: '3 ℓ =', targetUnit: 'ml', answer: 3000, tol: 0.5 },
  { src: '90 min =', targetUnit: 'h', answer: 1.5, tol: 0.01 },
  { src: '12 cm =', targetUnit: 'mm', answer: 120, tol: 0.1 },
  { src: '2 m³ =', targetUnit: 'ℓ', answer: 2000, tol: 0.5 }
];

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function regenTrainer() {
  var items = shuffle(trainerPool).slice(0, 10);
  buildConvertList('freeTrainer', items, 'trainerInstant');
  var fb = document.getElementById('fb_trainer');
  if (fb) {
    fb.style.display = 'none';
    fb.textContent = '';
  }
}

/* ---------- Abschlussquiz ---------- */
var finalQuizData = [
  {
    q: 'Eine physikalische Größe besteht aus \u2026',
    opts: [
      'nur einer Einheit',
      'Zahlenwert und Einheit',
      'nur einem Zahlenwert',
      'immer aus Prozent'
    ],
    correct: 1,
    explain: 'Größe = Zahlenwert · [Einheit].'
  },
  {
    q: 'Von m nach cm rechnest du mit dem Faktor \u2026',
    opts: ['× 10', '× 100', '÷ 100', '× 1000'],
    correct: 1,
    explain: '1 m = 100 cm.'
  },
  {
    q: 'Zwischen benachbarten Flächeneinheiten (z. B. m² ↔ dm²) gilt typisch \u2026',
    opts: ['Faktor 10', 'Faktor 100', 'Faktor 60', 'Faktor 24'],
    correct: 1,
    explain: 'Fläche: Länge² → Faktor 10² = 100.'
  },
  {
    q: '1 dm³ entspricht \u2026',
    opts: ['1 ml', '1 ℓ', '1 hl', '1 m³'],
    correct: 1,
    explain: '1 dm³ = 1 Liter.'
  },
  {
    q: '4 dz in Tonnen sind \u2026',
    opts: ['4 t', '0,4 t', '40 t', '0,04 t'],
    correct: 1,
    explain: '1 dz = 100 kg = 0,1 t → 4 dz = 0,4 t.'
  },
  {
    q: '2 h 22 min als Dezimalstunden ist ungefähr \u2026',
    opts: ['2,22 h', '2,37 h', '2,60 h', '22,2 h'],
    correct: 1,
    explain: '2 + 22/60 ≈ 2,367 h — nicht 2,22!'
  },
  {
    q: '60 km² in Hektar:',
    opts: ['60 ha', '600 ha', '6000 ha', '0,6 ha'],
    correct: 2,
    explain: '1 km² = 100 ha → 60 km² = 6000 ha.'
  },
  {
    q: 'Umrechnung km/h → m/s: dividieren durch \u2026',
    opts: ['60', '100', '3,6', '1000'],
    correct: 2,
    explain: '3,6 km/h = 1 m/s.'
  },
  {
    q: '1 ℓ Regen pro m² entspricht einer Schichthöhe von \u2026',
    opts: ['1 mm', '1 cm', '1 m', '10 cm'],
    correct: 0,
    explain: '1 ℓ = 1 dm³; auf 1 m² ergibt das 1 mm Höhe.'
  },
  {
    q: '10,7 a in m²:',
    opts: ['10,7 m²', '107 m²', '1070 m²', '10 700 m²'],
    correct: 2,
    explain: '1 a = 100 m² → 10,7 a = 1070 m².'
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
    msg = 'Ausgezeichnet — Maßeinheiten und Umrechnungen sitzen!';
    badges = '<span class="earned-badge gold">Gold \u2014 Maßeinheiten</span>';
  } else if (pct >= 70) {
    msg = 'Sehr gut! Schau dir die markierten Fragen noch einmal an.';
    badges = '<span class="earned-badge silver">Silber \u2014 solider Stand</span>';
  } else {
    msg = 'Wiederhole die Leitern (10 / 100 / 1000) und die Zeitfalle.';
    badges = '<span class="earned-badge bronze">Bronze \u2014 weiter \u00fcben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;
  if (score >= 7) markComplete(9);
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
  buildMatchList('matchIntro', introMatchData);
  buildMatchList('matchVolume', volumeMatchData);

  buildLadder(
    'ladderLength',
    ['km', 'm', 'dm', 'cm', 'mm', 'µm', 'nm'],
    'ladderLengthInfo',
    'len'
  );
  buildLadder(
    'ladderArea',
    ['km²', 'ha', 'a', 'm²', 'dm²', 'cm²', 'mm²'],
    'ladderAreaInfo',
    'area'
  );
  buildLadder(
    'ladderVolume',
    ['m³', 'dm³', 'ℓ', 'cm³', 'ml', 'mm³'],
    'ladderVolumeInfo',
    'vol'
  );
  buildLadder('ladderMass', ['t', 'kg', 'dag', 'g', 'mg'], 'ladderMassInfo', 'mass');
  buildLadder('ladderTime', ['d', 'h', 'min', 's', 'ms'], 'ladderTimeInfo', 'time');

  buildConvertList(
    'lenConvert',
    [
      { src: '37,6 cm =', targetUnit: 'mm', answer: 376, tol: 0.1 },
      { src: '37,6 cm =', targetUnit: 'dm', answer: 3.76, tol: 0.01 },
      { src: '37,6 cm =', targetUnit: 'm', answer: 0.376, tol: 0.001 },
      { src: '2,5 km =', targetUnit: 'm', answer: 2500, tol: 0.1 },
      { src: '4500 mm =', targetUnit: 'm', answer: 4.5, tol: 0.01 },
      { src: '0,08 m =', targetUnit: 'cm', answer: 8, tol: 0.05 }
    ],
    'lenInstant'
  );

  buildConvertList(
    'areaConvert',
    [
      { src: '60 km² =', targetUnit: 'ha', answer: 6000, tol: 0.5 },
      { src: '10,7 a =', targetUnit: 'm²', answer: 1070, tol: 0.1 },
      { src: '2,5 m² =', targetUnit: 'cm²', answer: 25000, tol: 1 },
      { src: '3 ha =', targetUnit: 'm²', answer: 30000, tol: 1 },
      { src: '5000 cm² =', targetUnit: 'm²', answer: 0.5, tol: 0.01 }
    ],
    'areaInstant'
  );

  buildConvertList(
    'massConvert',
    [
      { src: '2,45 kg =', targetUnit: 'g', answer: 2450, tol: 0.5 },
      { src: '2,45 kg =', targetUnit: 'dag', answer: 245, tol: 0.1 },
      { src: '2,45 kg =', targetUnit: 't', answer: 0.00245, tol: 0.00001 },
      { src: '4 dz =', targetUnit: 't', answer: 0.4, tol: 0.001 },
      { src: '3,5 t =', targetUnit: 'kg', answer: 3500, tol: 0.5 },
      { src: '800 mg =', targetUnit: 'g', answer: 0.8, tol: 0.01 }
    ],
    'massInstant'
  );

  regenTrainer();
  updateRain(0);
  updateProgress();
  buildFinalQuiz();
});
