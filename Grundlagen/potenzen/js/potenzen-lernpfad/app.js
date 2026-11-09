/**
 * Lernpfad 05: Potenzen
 */
var TOTAL_SECTIONS = 9;
var completedSections = new Set();
var currentTab = 0;
var currentFQ = 0;
var fqAnswers = [];
var srdpSelected = -1;

function parseNum(str) {
  if (str == null) return NaN;
  var s = String(str).trim().replace(/\s/g, '').replace(',', '.');
  if (s.indexOf('/') >= 0) {
    var parts = s.split('/');
    if (parts.length === 2) {
      var a = parseFloat(parts[0]);
      var b = parseFloat(parts[1]);
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
    }
  }
  return parseFloat(s);
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
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise().catch(function () {});
}

function updateDefViz() {
  var a = parseInt(document.getElementById('defBase').value, 10);
  var n = parseInt(document.getElementById('defExp').value, 10);
  document.getElementById('defBaseLabel').textContent = a;
  document.getElementById('defExpLabel').textContent = n;
  var row = document.getElementById('defFactors');
  row.innerHTML = '';
  for (var i = 0; i < n; i++) {
    if (i > 0) {
      var op = document.createElement('span');
      op.className = 'factor-op';
      op.textContent = '\u00b7';
      row.appendChild(op);
    }
    var chip = document.createElement('div');
    chip.className = 'factor-chip';
    chip.textContent = a;
    row.appendChild(chip);
  }
  var val = Math.pow(a, n);
  var out = document.getElementById('defResult');
  out.textContent = a + '^' + n + ' = ' + val;
  if (window.MathJax && MathJax.typesetPromise) {
    out.innerHTML = '\\(' + a + '^{' + n + '}=' + val + '\\)';
    MathJax.typesetPromise([out]).catch(function () {});
  }
}

function updateSquareCube() {
  var a = parseInt(document.getElementById('sqSide').value, 10);
  document.getElementById('sqSideLabel').textContent = 'a = ' + a;
  var sq = a * a;
  var cu = a * a * a;
  var sqOut = document.getElementById('sqOut');
  var cuOut = document.getElementById('cuOut');
  sqOut.innerHTML = '\\(' + a + '^{2}=' + sq + '\\)';
  cuOut.innerHTML = '\\(' + a + '^{3}=' + cu + '\\)';
  var maxH = 130;
  var scale = maxH / Math.max(cu, 1);
  document.getElementById('barSq').style.height = Math.max(8, sq * scale) + 'px';
  document.getElementById('barCu').style.height = Math.max(8, cu * scale) + 'px';
  document.getElementById('sqCuHint').textContent =
    a > 1
      ? 'a = ' + a + ': a\u00b3 = ' + cu + ' w\u00e4chst st\u00e4rker als a\u00b2 = ' + sq + '.'
      : a === 1
        ? 'Bei a = 1 sind a\u00b2 und a\u00b3 gleich 1.'
        : '';
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([sqOut, cuOut]).catch(function () {});
  }
}

function updateRule1() {
  var m = parseInt(document.getElementById('r1m').value, 10);
  var n = parseInt(document.getElementById('r1n').value, 10);
  document.getElementById('r1mLabel').textContent = m;
  document.getElementById('r1nLabel').textContent = n;
  var exp = m + n;
  var val = Math.pow(2, exp);
  var out = document.getElementById('r1Out');
  out.innerHTML =
    '\\(2^{' + m + '}\\cdot 2^{' + n + '}=2^{' + exp + '}=' + val + '\\)';
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([out]).catch(function () {});
}

var matchRules1Data = [
  {
    left: '\\(a^3 \\cdot a^4\\)',
    correct: 'a^7',
    options: ['a^7', 'a^{12}', 'a^{3/4}', '7a']
  },
  {
    left: '\\(\\dfrac{a^5}{a^2}\\)',
    correct: 'a^3',
    options: ['a^3', 'a^{10}', 'a^{2.5}', 'a^{-3}']
  },
  {
    left: '\\((a^2)^5\\)',
    correct: 'a^{10}',
    options: ['a^7', 'a^{10}', 'a^{25}', '2a^5']
  },
  {
    left: '\\(a^m \\cdot a^n\\)',
    correct: 'a^{m+n}',
    options: ['a^{m+n}', 'a^{m·n}', 'a^{m-n}', '(a·a)^{m+n}']
  }
];

function buildMatchRules1() {
  var el = document.getElementById('matchRules1');
  if (!el) return;
  el.innerHTML = '';
  matchRules1Data.forEach(function (item, i) {
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
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(function () {});
}

function checkMatchRules1() {
  var el = document.getElementById('matchRules1');
  var fb = document.getElementById('fb_match_r1');
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
    markComplete(3);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Noch nicht alles richtig.';
  }
}

function checkRules2() {
  var a = parseNum(document.getElementById('r2_a').value);
  var b = parseNum(document.getElementById('r2_b').value);
  var c = parseNum(document.getElementById('r2_c').value);
  var d = parseNum(document.getElementById('r2_d').value);
  var fb = document.getElementById('fb_r2');
  var ok =
    approxEq(a, 7, 0.01) &&
    approxEq(b, 6, 0.01) &&
    approxEq(c, 25, 0.01) &&
    approxEq(d, 1, 0.01);
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 2\u00b3\u00b72\u2074=2\u2077; (3\u00b2)\u00b3=3\u2076; 5\u207b\u00b2=1/25; 7\u2070=1.';
    markComplete(4);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Exponenten addieren / multiplizieren; a^{-n}=1/a^n; a^0=1.';
  }
}

function updateCubeTry() {
  var inp = document.getElementById('cubeTryA');
  var out = document.getElementById('cubeTryOut');
  if (!inp || !out) return;
  var a = parseNum(inp.value);
  if (!Number.isFinite(a) || a <= 0) {
    out.textContent = 'Bitte positive Zahl eingeben.';
    return;
  }
  var cube = a * a * a;
  var cubeStr = Number.isInteger(cube) ? String(cube) : cube.toFixed(2).replace('.', ',');
  var aStr = String(inp.value).replace('.', ',');
  var msg;
  if (approxEq(cube, 216, 0.05)) {
    msg = aStr + '\u00b3 = ' + cubeStr + ' — getroffen! a = 216\u00b9\u2215\u00b3';
  } else if (cube < 216) {
    msg = aStr + '\u00b3 = ' + cubeStr + ' — zu klein, etwas gr\u00f6\u00dfer w\u00e4hlen';
  } else {
    msg = aStr + '\u00b3 = ' + cubeStr + ' — zu gro\u00df, etwas kleiner w\u00e4hlen';
  }
  out.textContent = msg;
}

function checkExponentFind() {
  var ids = ['ex_1', 'ex_2', 'ex_3', 'ex_4', 'ex_5', 'ex_6'];
  var okCount = 0;
  ids.forEach(function (id) {
    var input = document.getElementById(id);
    var val = parseNum(input.value);
    var ans = parseFloat(input.dataset.ans);
    var alt = input.dataset.alt ? parseNum(input.dataset.alt) : NaN;
    var ok =
      Number.isFinite(val) &&
      (approxEq(val, ans, 0.02) || (Number.isFinite(alt) && approxEq(val, alt, 0.02)));
    input.classList.remove('ok', 'bad');
    input.classList.add(ok ? 'ok' : 'bad');
    if (ok) okCount++;
  });
  var fb = document.getElementById('fb_exfind');
  if (okCount === ids.length) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Super — inkl. 4^{3/2}=8 und 216^{1/3}=6. Br\u00fcche (3/2, 1/2) sind auch ok.';
    markComplete(5);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c ' +
      okCount +
      ' von ' +
      ids.length +
      ' richtig. Nutze die Tabelle: liegt der Wert zwischen zwei Zeilen, probiere einen Bruch.';
  }
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
    if (btn) btn.textContent = '\ud83d\udca1 N\u00e4chster Tipp';
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

function toggleMultiQuiz(el) {
  var parent = el.closest('.quiz-options');
  parent.querySelectorAll('.quiz-option').forEach(function (o) {
    o.classList.remove('correct-answer', 'wrong-answer');
  });
  el.classList.toggle('selected');
}

function checkMultiQuiz(qid, sectionNum) {
  var container = document.querySelector('[data-quiz="' + qid + '"]');
  var fb = document.getElementById('fb_' + qid);
  if (!container) return;
  var correctSet = String(container.dataset.correct || '')
    .split(',')
    .map(function (s) {
      return parseInt(s.trim(), 10);
    })
    .filter(function (n) {
      return Number.isFinite(n);
    });
  var selected = [];
  container.querySelectorAll('.quiz-option.selected').forEach(function (o) {
    selected.push(parseInt(o.dataset.idx, 10));
  });
  if (!selected.length) {
    if (fb) {
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = 'Bitte mindestens eine Option ausw\u00e4hlen.';
    }
    return;
  }
  var ok = true;
  container.querySelectorAll('.quiz-option').forEach(function (o) {
    var idx = parseInt(o.dataset.idx, 10);
    var should = correctSet.indexOf(idx) >= 0;
    var isSel = o.classList.contains('selected');
    o.classList.remove('correct-answer', 'wrong-answer', 'selected');
    if (should && isSel) {
      o.classList.add('correct-answer');
    } else if (!should && isSel) {
      o.classList.add('wrong-answer');
      ok = false;
    } else if (should && !isSel) {
      o.classList.add('correct-answer');
      ok = false;
    }
  });
  if (fb) {
    fb.className = ok ? 'feedback correct' : 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = ok
      ? '\u2705 Alle \u00e4quivalenten Schreibweisen erkannt!'
      : '\u274c Nicht ganz — richtige Optionen sind gr\u00fcn markiert.';
  }
  if (ok && sectionNum) markComplete(sectionNum);
}

var matchConvertData = [
  {
    left: '\\(a^{2/5}\\)',
    correct: 'Wurzel[5](a^2)',
    options: ['Wurzel[5](a^2)', 'Wurzel(a^5)', 'Wurzel[5](a)', '1/Wurzel[5](a^2)']
  },
  {
    left: '\\(w^{-3/2}\\)',
    correct: '1/Wurzel(w^3)',
    options: ['Wurzel(w^3)', '1/Wurzel(w^3)', '-Wurzel(w^3)', 'Wurzel[3](w^2)']
  },
  {
    left: '\\(\\sqrt[6]{t^{5}}\\)',
    correct: 't^(5/6)',
    options: ['t^(6/5)', 't^(5/6)', 't^(-5/6)', '5t^6']
  },
  {
    left: '\\(\\dfrac{1}{\\sqrt[3]{p}}\\)',
    correct: 'p^(-1/3)',
    options: ['p^(1/3)', 'p^(-1/3)', 'p^(-3)', '-Wurzel[3](p)']
  }
];

function buildMatchConvert() {
  var el = document.getElementById('matchConvert');
  if (!el) return;
  el.innerHTML = '';
  matchConvertData.forEach(function (item, i) {
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
      '<select aria-label="Zuordnung Umwandeln ' +
      (i + 1) +
      '"><option value="">\u2014 w\u00e4hlen \u2014</option>' +
      opts +
      '</select>';
    el.appendChild(row);
  });
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(function () {});
}

function checkMatchConvert() {
  var el = document.getElementById('matchConvert');
  var fb = document.getElementById('fb_match_convert');
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
    fb.textContent = '\u2705 Alle Zuordnungen stimmen!';
    markComplete(6);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = '\u274c Noch nicht alles richtig — Nenner = Wurzelexponent.';
  }
}

var mcConvertData = [
  {
    expr: '\\(x^{-2/5}=\\)',
    correct: 2,
    opts: [
      '\\(\\sqrt[5]{x^{2}}\\)',
      '\\(\\dfrac{2}{\\sqrt{x^{5}}}\\)',
      '\\(\\dfrac{1}{\\sqrt[5]{x^{2}}}\\)',
      '\\(\\dfrac{1}{\\sqrt[2]{x^{5}}}\\)'
    ]
  },
  {
    expr: '\\(\\sqrt[3]{u^{2}}=\\)',
    correct: 3,
    opts: ['\\(-3u^{2}\\)', '\\(u^{3/2}\\)', '\\(\\dfrac{3}{u^{2}}\\)', '\\(u^{2/3}\\)']
  },
  {
    expr: '\\(\\dfrac{1}{\\sqrt[7]{v^{2}}}=\\)',
    correct: 0,
    opts: ['\\(v^{-2/7}\\)', '\\(-v^{2/7}\\)', '\\(v^{2/7}\\)', '\\(v^{-7/2}\\)']
  },
  {
    expr: '\\(z^{7/12}=\\)',
    correct: 1,
    opts: [
      '\\(\\sqrt[7]{z^{12}}\\)',
      '\\(\\sqrt[12]{z^{7}}\\)',
      '\\(\\dfrac{7}{z^{12}}\\)',
      '\\(\\dfrac{1}{\\sqrt[12]{z^{7}}}\\)'
    ]
  },
  {
    expr: '\\(\\sqrt{\\dfrac{1}{b^{5}}}=\\)',
    correct: 3,
    opts: [
      '\\(b^{-1/5}\\)',
      '\\(-b^{2/5}\\)',
      '\\(b^{-2/5}\\)',
      '\\(b^{-5/2}\\)'
    ]
  }
];

function buildMcConvert() {
  var el = document.getElementById('mcConvertBlock');
  if (!el) return;
  el.innerHTML = '';
  mcConvertData.forEach(function (item, i) {
    var box = document.createElement('div');
    box.className = 'convert-item';
    box.style.marginBottom = '12px';
    box.innerHTML = '<div style="font-weight:800; margin-bottom:8px;">' + String.fromCharCode(97 + i) + ') ' + item.expr + '</div>';
    var opts = document.createElement('div');
    opts.className = 'quiz-options';
    opts.dataset.quiz = 'mc' + i;
    opts.dataset.correct = String(item.correct);
    item.opts.forEach(function (opt, j) {
      var o = document.createElement('div');
      o.className = 'quiz-option';
      o.dataset.idx = String(j);
      o.innerHTML = String.fromCharCode(65 + j) + ') ' + opt;
      o.onclick = function () {
        selectQuiz(o);
      };
      opts.appendChild(o);
    });
    box.appendChild(opts);
    var fb = document.createElement('div');
    fb.className = 'feedback';
    fb.id = 'fb_mc' + i;
    box.appendChild(fb);
    el.appendChild(box);
  });
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(function () {});
}

function checkMcConvert() {
  var ids = mcConvertData.map(function (_, i) {
    return 'mc' + i;
  });
  checkQuizGroup(5, ids);
  var fb = document.getElementById('fb_mc_convert');
  var allOk = true;
  ids.forEach(function (qid) {
    var container = document.querySelector('[data-quiz="' + qid + '"]');
    if (!container) return;
    var correct = parseInt(container.dataset.correct, 10);
    var selected = container.querySelector('.quiz-option.correct-answer');
    if (!selected || parseInt(selected.dataset.idx, 10) !== correct) allOk = false;
  });
  if (fb) {
    fb.className = allOk ? 'feedback correct' : 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = allOk
      ? '\u2705 Alle Umwandlungen stimmen!'
      : '\u274c Nicht alles richtig — schau die markierten Zeilen an.';
  }
}

var srdpOptions = [
  '\\(\\dfrac{T}{t}=\\left(\\dfrac{D}{d}\\right)^{\\frac{3}{2}}\\)',
  '\\(\\dfrac{T}{t}=\\left(\\dfrac{d}{D}\\right)^{-1{,}5}\\)',
  '\\(\\dfrac{T}{t}=\\sqrt{\\left(\\dfrac{D}{d}\\right)^{3}}\\)',
  '\\(\\dfrac{t}{T}=\\left(\\dfrac{d}{D}\\right)^{-\\frac{3}{2}}\\)',
  '\\(\\dfrac{t}{T}=\\left(\\dfrac{d}{D}\\right)^{1{,}5}\\)'
];

function buildSrdpChoices() {
  var el = document.getElementById('srdpChoices');
  if (!el) return;
  el.innerHTML = '';
  srdpOptions.forEach(function (tex, i) {
    var row = document.createElement('div');
    row.className = 'choice-row';
    row.dataset.idx = String(i);
    row.innerHTML =
      '<input type="radio" name="srdp" aria-label="Option ' +
      (i + 1) +
      '">' +
      '<div>' +
      tex +
      '</div>';
    row.onclick = function () {
      srdpSelected = i;
      el.querySelectorAll('.choice-row').forEach(function (r) {
        r.classList.remove('selected', 'correct-answer', 'wrong-answer');
      });
      row.classList.add('selected');
      row.querySelector('input').checked = true;
    };
    el.appendChild(row);
  });
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(function () {});
}

function checkSrdp() {
  var fb = document.getElementById('fb_srdp');
  var el = document.getElementById('srdpChoices');
  var correct = parseInt(el.dataset.correct, 10);
  if (srdpSelected < 0) {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = 'Bitte eine Option wählen.';
    return;
  }
  var rows = el.querySelectorAll('.choice-row');
  rows.forEach(function (r) {
    r.classList.remove('correct-answer', 'wrong-answer', 'selected');
  });
  if (srdpSelected === correct) {
    rows[correct].classList.add('correct-answer');
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Richtig! Option 4 w\u00e4re \u00e4quivalent zu t/T = (D/d)^{3/2} \u2014 das widerspricht T/t = (D/d)^{3/2}.';
    markComplete(8);
  } else {
    rows[srdpSelected].classList.add('wrong-answer');
    rows[correct].classList.add('correct-answer');
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Die markierte Option ist die, die nicht passt. Pr\u00fcfe Vorzeichen der Exponenten beim Kehrwert.';
  }
}

var finalQuizData = [
  {
    q: 'Potenzen sind eine Kurzschreibweise f\u00fcr \u2026',
    opts: [
      'mehrmaliges Addieren',
      'mehrmaliges Multiplizieren',
      'Dividieren durch den Exponenten',
      'immer Wurzeln'
    ],
    correct: 1,
    explain: 'a^n = a\u00b7a\u00b7\u2026\u00b7a (n Faktoren).'
  },
  {
    q: 'a^m \u00b7 a^n = \u2026',
    opts: ['a^{m\u00b7n}', 'a^{m+n}', 'a^{m-n}', '(a\u00b7a)^{m+n}'],
    correct: 1,
    explain: 'Gleiche Basis: Exponenten addieren.'
  },
  {
    q: '(a^m)^n = \u2026',
    opts: ['a^{m+n}', 'a^{m\u00b7n}', 'a^{m/n}', 'm\u00b7n\u00b7a'],
    correct: 1,
    explain: 'Potenz einer Potenz: Exponenten multiplizieren.'
  },
  {
    q: 'a^0 (a \u2260 0) ergibt \u2026',
    opts: ['0', 'a', '1', 'unendlich'],
    correct: 2,
    explain: 'a^0 = 1.'
  },
  {
    q: 'a^{-n} = \u2026',
    opts: ['-a^n', '1/a^n', 'a^{1/n}', 'n/a'],
    correct: 1,
    explain: 'Negativer Exponent: Kehrwert der Potenz.'
  },
  {
    q: 'z^{m/n} entspricht \u2026',
    opts: [
      '\\sqrt[m]{z^n}',
      '\\sqrt[n]{z^m}',
      'm/n \u00b7 z',
      'z^{n/m}'
    ],
    correct: 1,
    explain: 'z^{m/n} = n-te Wurzel aus z^m.'
  },
  {
    q: 'Ein W\u00fcrfelvolumen 216 cm\u00b3 hat die Kante \u2026',
    opts: ['216 cm', '72 cm', '6 cm', '36 cm'],
    correct: 2,
    explain: '216^{1/3} = 6.'
  },
  {
    q: '\\sqrt[3]{u^2} = \u2026',
    opts: ['u^{3/2}', 'u^{2/3}', '3u^2', 'u^{-2/3}'],
    correct: 1,
    explain: 'Wurzelexponent in den Nenner des Bruchexponenten.'
  },
  {
    q: '3\\sqrt{2} + 4\\sqrt{2} = \u2026',
    opts: ['7\\sqrt{4}', '7\\sqrt{2}', '12\\sqrt{2}', '\\sqrt{14}'],
    correct: 1,
    explain: 'Gleiche Radikanden: Koeffizienten addieren.'
  },
  {
    q: 'Aus T/t = (D/d)^{3/2} folgt auch \u2026',
    opts: [
      't/T = (d/D)^{-3/2}',
      'T/t = \\sqrt{(D/d)^3}',
      'T/t = (d/D)^{3/2}',
      'T = t + 1,5'
    ],
    correct: 1,
    explain: '(D/d)^{3/2} = Wurzel aus (D/d)^3.'
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
    msg = 'Ausgezeichnet — Potenz- und Wurzelschreibweise sitzen!';
    badges = '<span class="earned-badge gold">Gold \u2014 Potenzen</span>';
  } else if (pct >= 70) {
    msg = 'Sehr gut! Schau dir die markierten Fragen noch einmal an.';
    badges = '<span class="earned-badge silver">Silber \u2014 solider Stand</span>';
  } else {
    msg = 'Wiederhole a^{m/n}=Wurzel und die drei Kernregeln (+, \u2212, \u00b7 bei Exponenten).';
    badges = '<span class="earned-badge bronze">Bronze \u2014 weiter \u00fcben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;
  if (score >= 7) markComplete(9);
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
  updateDefViz();
  updateSquareCube();
  updateRule1();
  updateCubeTry();
  buildMatchRules1();
  buildMatchConvert();
  buildMcConvert();
  buildSrdpChoices();
  updateProgress();
  buildFinalQuiz();
});
