/**
 * Lernpfad 06: Gleitkommadarstellung
 */
var TOTAL_SECTIONS = 9;
var completedSections = new Set();
var currentTab = 0;

/* ─── Helpers ─────────────────────────────────────────────── */

function parseNum(str) {
  if (str == null) return NaN;
  var s = String(str).trim().replace(/\s/g, '').replace(/'/g, '');
  if (!s) return NaN;
  s = s.replace(/·/g, '*').replace(/×/g, '*').replace(/⋅/g, '*');
  // a · 10^k  /  a*10^k  /  a e k
  var sci = s.match(/^([+-]?\d+(?:[.,]\d+)?)\s*(?:\*|e|E)\s*10\^?\(?([+-]?\d+)\)?$/i);
  if (sci) {
    return parseFloat(sci[1].replace(',', '.')) * Math.pow(10, parseInt(sci[2], 10));
  }
  var sci2 = s.match(/^([+-]?\d+(?:[.,]\d+)?)[eE]([+-]?\d+)$/);
  if (sci2) {
    return parseFloat(sci2[1].replace(',', '.')) * Math.pow(10, parseInt(sci2[2], 10));
  }
  // bare 10^k
  var bare = s.match(/^10\^?\(?([+-]?\d+)\)?$/);
  if (bare) return Math.pow(10, parseInt(bare[1], 10));
  if (s.indexOf('/') >= 0) {
    var parts = s.split('/');
    if (parts.length === 2) {
      var a = parseFloat(parts[0].replace(',', '.'));
      var b = parseFloat(parts[1].replace(',', '.'));
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }
  }
  // German: 1.234.567,89 or 1234567,89
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(',', '.');
  }
  return parseFloat(s);
}

function approxEq(a, b, tol) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  var t = tol != null ? tol : Math.max(1e-9, Math.abs(b) * 1e-4);
  return Math.abs(a - b) <= t;
}

function toSciParts(x) {
  if (!Number.isFinite(x) || x === 0) return { a: 0, k: 0 };
  var k = Math.floor(Math.log10(Math.abs(x)));
  var a = x / Math.pow(10, k);
  // normalize rounding
  if (Math.abs(a) >= 10) {
    a /= 10;
    k += 1;
  }
  if (Math.abs(a) < 1) {
    a *= 10;
    k -= 1;
  }
  return { a: a, k: k };
}

function formatDe(n, maxDec) {
  if (!Number.isFinite(n)) return '—';
  var d = maxDec != null ? maxDec : 6;
  var s = n.toFixed(d).replace(/\.?0+$/, '');
  return s.replace('.', ',');
}

function formatSciDe(x, digs) {
  var p = toSciParts(x);
  var a = Number(p.a.toPrecision(digs || 4));
  return formatDe(a, 6) + ' · 10^{' + p.k + '}';
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
        fb.textContent = '✅ Richtig!';
      }
    } else {
      selected.classList.add('wrong-answer');
      container.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
      if (fb) {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent = '❌ Leider falsch. Die richtige Antwort ist markiert.';
      }
      allCorrect = false;
    }
  });

  if (allCorrect) markComplete(tabIdx + 1);
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise().catch(function () {});
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
    var btn = ladder.querySelector('.btn-hint');
    if (btn) btn.textContent = '💡 Nächster Tipp';
    return;
  }
  next.classList.add('visible');
  var remaining = 0;
  steps.forEach(function (s) {
    if (!s.classList.contains('visible')) remaining++;
  });
  var btn2 = ladder.querySelector('.btn-hint');
  if (btn2) {
    btn2.textContent =
      remaining > 0 ? '💡 Nächster Tipp' : '💡 Tipps zurücksetzen';
  }
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([next]).catch(function () {});
  }
}

function checkMatchList(containerId, fbId, sectionNum) {
  var el = document.getElementById(containerId);
  var fb = document.getElementById(fbId);
  if (!el || !fb) return;
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
    fb.textContent = '✅ Alle Zuordnungen stimmen!';
    if (sectionNum) markComplete(sectionNum);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '❌ Noch nicht alles richtig — prüfe die Zehnerpotenzen.';
  }
}

function checkInputGroup(ids, answers, fbId, sectionNum, tol) {
  var ok = 0;
  ids.forEach(function (id, i) {
    var inp = document.getElementById(id);
    if (!inp) return;
    var val = parseNum(inp.value);
    if (approxEq(val, answers[i], tol)) {
      inp.classList.remove('bad');
      inp.classList.add('ok');
      ok++;
    } else {
      inp.classList.remove('ok');
      inp.classList.add('bad');
    }
  });
  var fb = document.getElementById(fbId);
  if (!fb) return;
  if (ok === ids.length) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '✅ Alle Antworten stimmen!';
    if (sectionNum) markComplete(sectionNum);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '❌ ' + ok + ' von ' + ids.length + ' richtig. Tipp: Komma oder Punkt und Schreibweisen wie 3,2·10^7 sind erlaubt.';
  }
}

/* ─── Station 1: Googol intro ─────────────────────────────── */

function checkGoogol() {
  checkQuizGroup(0, ['gk0_1', 'gk0_2']);
}

/* ─── Station 2: Comma shifter ────────────────────────────── */

var commaExamples = [
  { a: 2.9978, k: 8, label: 'Lichtgeschwindigkeit ≈' },
  { a: 3.1, k: 6, label: 'Beispiel positiv' },
  { a: 2.8978, k: -3, label: 'Beispiel negativ' },
  { a: 2.7, k: -5, label: 'Lupe / Atom-Skala' },
  { a: 7.87, k: 6, label: 'Millionen' }
];
var commaIdx = 0;

function setCommaExample(i) {
  commaIdx = (i + commaExamples.length) % commaExamples.length;
  var ex = commaExamples[commaIdx];
  var aEl = document.getElementById('csMant');
  var kEl = document.getElementById('csExp');
  if (aEl) aEl.value = String(ex.a).replace('.', ',');
  if (kEl) kEl.value = ex.k;
  var lab = document.getElementById('csLabel');
  if (lab) lab.textContent = ex.label;
  updateCommaShifter();
}

function updateCommaShifter() {
  var aRaw = document.getElementById('csMant');
  var kRaw = document.getElementById('csExp');
  if (!aRaw || !kRaw) return;
  var a = parseNum(aRaw.value);
  var k = parseInt(kRaw.value, 10);
  if (!Number.isFinite(a)) a = 1;
  if (!Number.isFinite(k)) k = 0;
  document.getElementById('csExpLabel').textContent = k;
  document.getElementById('csDir').textContent =
    k > 0
      ? 'Komma ' + k + ' Stellen nach rechts (blau)'
      : k < 0
        ? 'Komma ' + Math.abs(k) + ' Stellen nach links (rot)'
        : 'Keine Verschiebung (10⁰ = 1)';
  document.getElementById('csDir').className =
    'cs-dir ' + (k > 0 ? 'pos' : k < 0 ? 'neg' : 'zero');

  var value = a * Math.pow(10, k);
  var vis = document.getElementById('csVisual');
  var result = document.getElementById('csResult');

  // Build digit string for visualization
  var digits = buildDigitShift(a, k);
  vis.innerHTML = digits.html;
  vis.className = 'cs-visual ' + (k > 0 ? 'pos' : k < 0 ? 'neg' : 'zero');

  result.innerHTML =
    '\\(' +
    formatDe(a, 6).replace(',', '{,}') +
    '\\cdot 10^{' +
    k +
    '} = ' +
    formatFixedLatex(value) +
    '\\)';
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([result]).catch(function () {});
  }
}

function formatFixedLatex(value) {
  if (!Number.isFinite(value)) return '?';
  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-9)) {
    var p = toSciParts(value);
    return formatDe(Number(p.a.toPrecision(5)), 6).replace(',', '{,}') + '\\cdot 10^{' + p.k + '}';
  }
  // Prefer plain fixed with German comma
  var s;
  if (Math.abs(value) >= 1) {
    s = Math.round(value * 1e8) / 1e8;
    var parts = String(s).split('.');
    var intp = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
    if (parts[1]) return intp + '{,}' + parts[1];
    return intp;
  }
  s = value.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', '{,}');
}

function buildDigitShift(a, k) {
  // Represent mantissa digits and show target comma position
  var mantStr = String(Math.abs(a)).replace(',', '.');
  if (mantStr.indexOf('.') < 0) mantStr += '.0';
  var sign = a < 0 ? '−' : '';
  var [ip, fp] = mantStr.split('.');
  var all = (ip + fp).split('');
  var origComma = ip.length; // index after which comma sits in digit array
  var newComma = origComma + k;
  // pad zeros
  while (newComma < 0) {
    all.unshift('0');
    origComma++;
    newComma++;
  }
  while (newComma > all.length) {
    all.push('0');
  }
  var html = '<span class="cs-sign">' + sign + '</span>';
  var spanClass = k > 0 ? 'cs-arc-pos' : k < 0 ? 'cs-arc-neg' : '';
  for (var i = 0; i < all.length; i++) {
    if (i === newComma) {
      html += '<span class="cs-comma ' + (k >= 0 ? 'pos' : 'neg') + '">,</span>';
    }
    var mark = '';
    if (k !== 0) {
      var lo = Math.min(origComma, newComma);
      var hi = Math.max(origComma, newComma);
      if (i >= lo && i < hi) mark = ' ' + spanClass;
    }
    html += '<span class="cs-digit' + mark + '">' + all[i] + '</span>';
  }
  if (newComma === all.length) {
    html += '<span class="cs-comma ' + (k >= 0 ? 'pos' : 'neg') + '">,</span>';
  }
  var bracket =
    k !== 0
      ? '<div class="cs-bracket ' +
        (k > 0 ? 'pos' : 'neg') +
        '"><span>' +
        Math.abs(k) +
        ' Stellen</span></div>'
      : '';
  return { html: html + bracket };
}

function checkCommaPractice() {
  checkInputGroup(
    ['csP1', 'csP2', 'csP3', 'csP4'],
    [299780000, 0.0028978, 32000000, 0.00082],
    'fb_cs_practice',
    2,
    1e-10
  );
}

/* ─── Station 3: Prefixes ─────────────────────────────────── */

var prefixMatchData = [
  { left: 'Tera (T)', correct: '12', options: ['12', '9', '6', '-12'] },
  { left: 'Giga (G)', correct: '9', options: ['12', '9', '6', '3'] },
  { left: 'Mega (M)', correct: '6', options: ['9', '6', '3', '-6'] },
  { left: 'Kilo (k)', correct: '3', options: ['6', '3', '2', '1'] },
  { left: 'Milli (m)', correct: '-3', options: ['-1', '-2', '-3', '-6'] },
  { left: 'Mikro (μ)', correct: '-6', options: ['-3', '-6', '-9', '-12'] },
  { left: 'Nano (n)', correct: '-9', options: ['-6', '-9', '-12', '-3'] },
  { left: 'Piko (p)', correct: '-12', options: ['-9', '-12', '-6', '12'] }
];

function buildPrefixMatch() {
  var el = document.getElementById('matchPrefix');
  if (!el) return;
  el.innerHTML = '';
  prefixMatchData.forEach(function (item, i) {
    var row = document.createElement('div');
    row.className = 'match-row';
    row.dataset.correct = item.correct;
    var opts = item.options
      .map(function (o) {
        return '<option value="' + o + '">10<sup>' + o + '</sup></option>';
      })
      .join('');
    row.innerHTML =
      '<label>' +
      (i + 1) +
      '. ' +
      item.left +
      '</label>' +
      '<select aria-label="Vorsilbe ' +
      (i + 1) +
      '"><option value="">— wählen —</option>' +
      opts +
      '</select>';
    el.appendChild(row);
  });
}

function checkPrefixMatch() {
  checkMatchList('matchPrefix', 'fb_match_prefix', 3);
}

function checkPrefixQuiz() {
  var container = document.querySelector('[data-quiz="gk3_1"]');
  var fb = document.getElementById('fb_gk3_1');
  if (!container) return;
  var correct = parseInt(container.dataset.correct, 10);
  var selected = container.querySelector('.quiz-option.selected');
  if (!selected) {
    if (fb) {
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = 'Bitte wähle eine Antwort aus.';
    }
    return;
  }
  var idx = parseInt(selected.dataset.idx, 10);
  container.querySelectorAll('.quiz-option').forEach(function (o) {
    o.classList.remove('selected', 'correct-answer', 'wrong-answer');
  });
  if (idx === correct) {
    container.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
    if (fb) {
      fb.className = 'feedback correct';
      fb.style.display = 'block';
      fb.textContent = '✅ 500·10⁶ = 5·10⁸ Byte.';
    }
  } else {
    selected.classList.add('wrong-answer');
    container.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
    if (fb) {
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = '❌ Mega = 10⁶ → 500·10⁶ = 5·10⁸.';
    }
  }
}

/* ─── Station 4: Convert ──────────────────────────────────── */

function checkFestConvert() {
  // a) 1.25e3 = 1250; b) 4.55e5; c) 1.25e-2; d) 3.2e7; e) 8.2e-4; f) 902*10^2=90200
  checkInputGroup(
    ['festA', 'festB', 'festC', 'festD', 'festE', 'festF'],
    [1250, 455000, 0.0125, 32000000, 0.00082, 90200],
    'fb_fest',
    null,
    1e-12
  );
  maybeCompleteConvert();
}

function checkGleitConvert() {
  // Accept scientific form; compare numeric value
  var specs = [
    { id: 'gleitA', val: 700000, needSci: true },
    { id: 'gleitB', val: 0.0003, needSci: true },
    { id: 'gleitC', val: 12443628, needSci: true },
    { id: 'gleitD', val: 0.001245, needSci: true },
    { id: 'gleitE', val: 12000, needSci: true },
    { id: 'gleitF', val: 0.0000003, needSci: true }
  ];
  var ok = 0;
  specs.forEach(function (sp) {
    var inp = document.getElementById(sp.id);
    if (!inp) return;
    var raw = String(inp.value).trim();
    var val = parseNum(raw);
    var looksSci = /10\s*\^|[eE]/.test(raw.replace(/\s/g, ''));
    var parts = toSciParts(val);
    var normalized = Number.isFinite(val) && parts.a >= 1 && parts.a < 10;
    if (approxEq(val, sp.val, Math.max(1e-15, Math.abs(sp.val) * 1e-6)) && looksSci && normalized) {
      inp.classList.remove('bad');
      inp.classList.add('ok');
      ok++;
    } else {
      inp.classList.remove('ok');
      inp.classList.add('bad');
    }
  });
  var fb = document.getElementById('fb_gleit');
  if (ok === specs.length) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '✅ Saubere Gleitkommadarstellung (1 ≤ a < 10)!';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '❌ ' +
      ok +
      ' von ' +
      specs.length +
      ' ok. Form a·10^k mit 1 ≤ a < 10, z. B. 7·10^5.';
  }
  maybeCompleteConvert();
}

function maybeCompleteConvert() {
  var festOk = ['festA', 'festB', 'festC', 'festD', 'festE', 'festF'].every(function (id) {
    var el = document.getElementById(id);
    return el && el.classList.contains('ok');
  });
  var gleitOk = ['gleitA', 'gleitB', 'gleitC', 'gleitD', 'gleitE', 'gleitF'].every(function (id) {
    var el = document.getElementById(id);
    return el && el.classList.contains('ok');
  });
  if (festOk && gleitOk) markComplete(4);
}

/* ─── Station 5: Multiply ─────────────────────────────────── */

function updateMulDemo() {
  var a = parseNum(document.getElementById('mulA').value);
  var ka = parseInt(document.getElementById('mulKa').value, 10);
  var b = parseNum(document.getElementById('mulB').value);
  var kb = parseInt(document.getElementById('mulKb').value, 10);
  if (![a, ka, b, kb].every(Number.isFinite)) return;
  var prod = a * b;
  var k = ka + kb;
  // normalize
  while (prod >= 10) {
    prod /= 10;
    k++;
  }
  while (prod > 0 && prod < 1) {
    prod *= 10;
    k--;
  }
  var out = document.getElementById('mulOut');
  out.innerHTML =
    '\\((' +
    formatDe(a, 4).replace(',', '{,}') +
    '\\cdot 10^{' +
    ka +
    '})\\cdot(' +
    formatDe(b, 4).replace(',', '{,}') +
    '\\cdot 10^{' +
    kb +
    '})=' +
    formatDe(Number(prod.toPrecision(4)), 4).replace(',', '{,}') +
    '\\cdot 10^{' +
    k +
    '}\\)';
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([out]).catch(function () {});
}

function checkMulTable() {
  // Example table cells (representative)
  // (6e4)*(2e-2)=1.2e3; (3e2)*(5e3)=1.5e6; (4e-2)*(3e-4)=1.2e-5; (1.2e-1)*(7e6)=8.4e5
  checkInputGroup(
    ['mulT1', 'mulT2', 'mulT3', 'mulT4'],
    [1.2e3, 1.5e6, 1.2e-5, 8.4e5],
    'fb_mul_table',
    5,
    1e-9
  );
}

/* ─── Station 6: Magnitudes + units ───────────────────────── */

var sortItems = [
  { id: 's1', label: 'Haardurchmesser \(5\\cdot10^{-5}\\,\\mathrm{m}\)', value: 5e-5 },
  { id: 's2', label: 'Erdradius \(6{,}37\\cdot10^{6}\\,\\mathrm{m}\)', value: 6.37e6 },
  { id: 's3', label: 'Licht \(3\\cdot10^{8}\\,\\mathrm{m/s}\)', value: 3e8 },
  { id: 's4', label: 'Elektron \(9\\cdot10^{-31}\\,\\mathrm{kg}\)', value: 9e-31 },
  { id: 's5', label: 'Avogadro \(6{,}023\\cdot10^{23}\)', value: 6.023e23 }
];

function buildSortSelects() {
  var el = document.getElementById('sortMags');
  if (!el) return;
  el.innerHTML = '';
  var labels = [
    '1. kleinste Größe',
    '2.',
    '3.',
    '4.',
    '5. größte Größe'
  ];
  // correct order by value ascending: s4, s1, s2, s3, s5
  var opts = sortItems
    .map(function (it) {
      return '<option value="' + it.id + '">' + it.label.replace(/\\\(|\\\)/g, '') + '</option>';
    })
    .join('');
  // Simpler plain labels for select
  opts = [
    { id: 's4', t: 'Elektronenmasse 9·10⁻³¹ kg' },
    { id: 's1', t: 'Haardurchmesser 5·10⁻⁵ m' },
    { id: 's2', t: 'Erdradius 6,37·10⁶ m' },
    { id: 's3', t: 'Lichtgeschwindigkeit 3·10⁸ m/s' },
    { id: 's5', t: 'Avogadro-Zahl 6,023·10²³' }
  ]
    .map(function (o) {
      return '<option value="' + o.id + '">' + o.t + '</option>';
    })
    .join('');

  labels.forEach(function (lab, i) {
    var row = document.createElement('div');
    row.className = 'match-row';
    row.innerHTML =
      '<label>' +
      lab +
      '</label><select id="sort' +
      i +
      '" aria-label="' +
      lab +
      '"><option value="">— wählen —</option>' +
      opts +
      '</select>';
    el.appendChild(row);
  });
}

function checkSortMags() {
  var correct = ['s4', 's1', 's2', 's3', 's5'];
  var ok = true;
  var used = {};
  for (var i = 0; i < 5; i++) {
    var sel = document.getElementById('sort' + i);
    if (!sel || !sel.value) {
      ok = false;
      if (sel) sel.style.borderColor = '#E11D48';
      continue;
    }
    if (used[sel.value]) ok = false;
    used[sel.value] = true;
    if (sel.value === correct[i]) {
      sel.style.borderColor = '#16A34A';
      sel.style.background = '#ECFDF3';
    } else {
      sel.style.borderColor = '#E11D48';
      sel.style.background = '#FEF2F2';
      ok = false;
    }
  }
  var fb = document.getElementById('fb_sort');
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '✅ Reihenfolge stimmt — vom Winzigen zum Gigantischen!';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '❌ Noch nicht. Vergleiche die Exponenten (negativ = winzig).';
  }
  maybeCompleteMags();
}

function checkUnitTable() {
  // 40 GByte → 4e10 Byte; 12 mg → 1.2e-2 g; 450 µm → 4.5e-4 m; 82 ns → 8.2e-8 s; 3.5 MHz → 3.5e6 Hz
  var specs = [
    { id: 'unitA', v: 4e10 },
    { id: 'unitB', v: 1.2e-2 },
    { id: 'unitC', v: 4.5e-4 },
    { id: 'unitD', v: 8.2e-8 },
    { id: 'unitE', v: 3.5e6 }
  ];
  var ok = 0;
  specs.forEach(function (sp) {
    var inp = document.getElementById(sp.id);
    if (!inp) return;
    var val = parseNum(inp.value);
    if (approxEq(val, sp.v, Math.abs(sp.v) * 1e-4 + 1e-15)) {
      inp.classList.remove('bad');
      inp.classList.add('ok');
      ok++;
    } else {
      inp.classList.remove('ok');
      inp.classList.add('bad');
    }
  });
  var fb = document.getElementById('fb_units');
  if (ok === specs.length) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '✅ Einheiten korrekt in Gleitkomma umgerechnet!';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '❌ ' + ok + ' von ' + specs.length + ' richtig. G → 10⁹, μ → 10⁻⁶, n → 10⁻⁹, M → 10⁶.';
  }
  maybeCompleteMags();
}

var bloodMcOk = false;

function checkBloodMC() {
  var container = document.querySelector('[data-quiz="gk6_blood"]');
  var fb = document.getElementById('fb_gk6_blood');
  if (!container) return;
  var correct = parseInt(container.dataset.correct, 10);
  var selected = container.querySelector('.quiz-option.selected');
  bloodMcOk = false;
  if (!selected) {
    if (fb) {
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = 'Bitte wähle eine Antwort aus.';
    }
    return;
  }
  var idx = parseInt(selected.dataset.idx, 10);
  container.querySelectorAll('.quiz-option').forEach(function (o) {
    o.classList.remove('selected', 'correct-answer', 'wrong-answer');
  });
  if (idx === correct) {
    container.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
    bloodMcOk = true;
    if (fb) {
      fb.className = 'feedback correct';
      fb.style.display = 'block';
      fb.textContent = '✅ Richtig!';
    }
  } else {
    selected.classList.add('wrong-answer');
    container.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
    if (fb) {
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = '❌ Falsch — Summe der Zellen × 5·10⁶ µl.';
    }
  }
  maybeCompleteMags();
}

function maybeCompleteMags() {
  var sortOk = true;
  var correct = ['s4', 's1', 's2', 's3', 's5'];
  for (var i = 0; i < 5; i++) {
    var sel = document.getElementById('sort' + i);
    if (!sel || sel.value !== correct[i]) sortOk = false;
  }
  var unitsOk = ['unitA', 'unitB', 'unitC', 'unitD', 'unitE'].every(function (id) {
    var el = document.getElementById(id);
    return el && el.classList.contains('ok');
  });
  if (sortOk && unitsOk && bloodMcOk) markComplete(6);
}

/* ─── Station 7: SRDP ─────────────────────────────────────── */

function checkSrdp() {
  // Erythrozyten: 5e9 / cm³ * 6 L = 5e9 * 6000 = 3e13
  // Chain: 3e13 * 7.5e-6 m = 2.25e8 m
  // Waste kg: 5.3543e10
  // Per capita t: 53543000/8375000 ≈ 6.393
  // Baikalsee Vg: 18400/0.75 = 24533.33… → 20% of earth → Vg = 24533.33/0.2 = 122666.67 → 1.2267e5 km³
  // Actually: current V = 18400 = 75% of 1996 volume. 1996 volume V96 = 18400/0.75.
  // V96 was 20% of earth total Vg → Vg = V96 / 0.2 = 18400/(0.75*0.2) = 18400/0.15 = 122666.666… ≈ 1.23·10^5
  // Baikal claim false — need MC or checkbox
  // Density Al: 2.70 g/cm³ = 2700 kg/m³
  // Si radius: 1.5e-10 m = 0.15 nm; minus 0.04 nm → 0.11 nm
  // New Horizons: 9*365*24*3600*16.2 km

  var ery = 5e9 * 6e3; // 3e13
  var chain = ery * 7.5e-6; // 2.25e8
  var wasteKg = 53543000 * 1000; // 5.3543e10
  var perCap = 53543000 / 8375000; // ≈ 6.393134
  var vg = 18400 / 0.15; // 122666.666…
  var dens = 2700;
  var siNm = 0.15 - 0.04; // 0.11
  var nh =
    9 * 365 * 24 * 60 * 60 * 16.2; // 4.5977328e9 km

  var specs = [
    { id: 'srdpEry', v: ery, rel: 1e-3 },
    { id: 'srdpChain', v: chain, rel: 1e-3 },
    { id: 'srdpWaste', v: wasteKg, rel: 1e-4 },
    { id: 'srdpCap', v: perCap, rel: 0.02 },
    { id: 'srdpVg', v: vg, rel: 0.01 },
    { id: 'srdpRho', v: dens, rel: 1e-6 },
    { id: 'srdpSi', v: siNm, rel: 1e-4 },
    { id: 'srdpNh', v: nh, rel: 0.01 }
  ];
  var ok = 0;
  specs.forEach(function (sp) {
    var inp = document.getElementById(sp.id);
    if (!inp) return;
    var val = parseNum(inp.value);
    var tol = Math.abs(sp.v) * sp.rel + 1e-12;
    if (approxEq(val, sp.v, tol)) {
      inp.classList.remove('bad');
      inp.classList.add('ok');
      ok++;
    } else {
      inp.classList.remove('ok');
      inp.classList.add('bad');
    }
  });

  // Baikal claim: must select "false / widerlegt"
  var claim = document.querySelector('[data-quiz="srdpClaim"] .quiz-option.selected');
  var claimOk = false;
  var claimBox = document.querySelector('[data-quiz="srdpClaim"]');
  var fbClaim = document.getElementById('fb_srdpClaim');
  if (!claim) {
    if (fbClaim) {
      fbClaim.className = 'feedback incorrect';
      fbClaim.style.display = 'block';
      fbClaim.textContent = 'Bitte zur Baikalsee-Behauptung eine Option wählen.';
    }
  } else {
    var idx = parseInt(claim.dataset.idx, 10);
    var correct = parseInt(claimBox.dataset.correct, 10);
    claimBox.querySelectorAll('.quiz-option').forEach(function (o) {
      o.classList.remove('correct-answer', 'wrong-answer', 'selected');
    });
    if (idx === correct) {
      claimBox.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
      claimOk = true;
      if (fbClaim) {
        fbClaim.className = 'feedback correct';
        fbClaim.style.display = 'block';
        fbClaim.textContent = '✅ Richtig — der Bedarf übersteigt das Seewasser deutlich.';
      }
    } else {
      claim.classList.add('wrong-answer');
      claimBox.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
      if (fbClaim) {
        fbClaim.className = 'feedback incorrect';
        fbClaim.style.display = 'block';
        fbClaim.textContent = '❌ Rechne: 7·10⁹ · 150 · 365 · 50 und vergleiche mit 1,84·10⁴ · 10¹² L.';
      }
    }
  }

  var fb = document.getElementById('fb_srdp');
  if (ok === specs.length && claimOk) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '✅ Alle SRDP-Teilaufgaben gelöst!';
    markComplete(7);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '❌ ' + ok + ' von ' + specs.length + ' Zahlenwerten richtig' + (claimOk ? '' : ' · Behauptung noch offen') + '. Nutze die Tipps.';
  }
}

/* ─── Station 8: Work assignments ─────────────────────────── */

function checkWork() {
  // 1) Earth-Sun light time: 149.6e6 km / 3e5 km/s ≈ 498.67 s ≈ 8.31 min
  var earthSunS = 1.496e8 / 3e5; // 498.666… s
  // Sirius: 8.6 ly → time = 8.6 years (light), or distance; ask Laufzeit = 8.6 a
  // 2) Earth volume 1.083e12 km³ → r = cbrt(3V/4π)
  var V = 1.083e12;
  var r = Math.cbrt((3 * V) / (4 * Math.PI)); // ≈ 6367.4 km
  var u = 2 * Math.PI * r; // ≈ 40000 km
  // 3) CD groove: 1.6 µm * 5.7 km worth — simplified: length of spiral
  // User: Audio-CD Rillen — typical: track pitch 1.6e-6 m, radius etc.
  // Use: Rillenabstand 1,6 µm = 1,6·10^{-6} m
  // 4) Moon mass = Earth/81; Earth 5.97e24 → moon 7.37e22
  var moon = 5.97e24 / 81;
  // 5) 8.9e9 people * 65 kg
  var massPeople = 8.9e9 * 65;
  // 6) Geostationary 36000 km = 3.6e7 m; light delay one way 36000/3e5 = 0.12 s
  var delay = 36000 / 3e5;
  // 7) Water molecule mass ≈ 3e-26 kg; molecules in 18g = 6.02e23
  var molMass = 0.018 / 6.02e23; // ≈ 2.99e-26
  var nMol = 6.02e23;

  var specs = [
    { id: 'wa1', v: earthSunS, rel: 0.02 },
    { id: 'wa2', v: r, rel: 0.02 },
    { id: 'wa3', v: u, rel: 0.02 },
    { id: 'wa4', v: 1.6e-6, rel: 1e-6 },
    { id: 'wa5', v: moon, rel: 0.02 },
    { id: 'wa6', v: massPeople, rel: 0.01 },
    { id: 'wa7', v: delay, rel: 0.02 },
    { id: 'wa8', v: molMass, rel: 0.05 }
  ];
  var ok = 0;
  specs.forEach(function (sp) {
    var inp = document.getElementById(sp.id);
    if (!inp) return;
    var val = parseNum(inp.value);
    if (approxEq(val, sp.v, Math.abs(sp.v) * sp.rel + 1e-15)) {
      inp.classList.remove('bad');
      inp.classList.add('ok');
      ok++;
    } else {
      inp.classList.remove('ok');
      inp.classList.add('bad');
    }
  });
  var fb = document.getElementById('fb_work');
  if (ok === specs.length) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '✅ Arbeitsaufträge geschafft!';
    markComplete(8);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '❌ ' + ok + ' von ' + specs.length + ' richtig. Schreibweisen wie 7,4·10^22 sind ok.';
  }
}

/* ─── Station 9: Final quiz ───────────────────────────────── */

function checkFinalQuiz() {
  checkQuizGroup(8, ['gk9_1', 'gk9_2', 'gk9_3', 'gk9_4', 'gk9_5']);
}

/* ─── Init ────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  buildPrefixMatch();
  buildSortSelects();
  setCommaExample(0);
  updateMulDemo();
  switchTab(0);
  updateProgress();
});
