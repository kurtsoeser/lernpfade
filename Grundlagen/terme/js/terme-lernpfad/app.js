/**
 * Lernpfad 07: Terme
 */
var TOTAL_SECTIONS = 11;
var completedSections = new Set();
var currentTab = 0;
var currentFQ = 0;
var fqAnswers = [];
var sortTarget = 'yes';
var sortSelected = null;
var sortState = {};

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

/* —— Station 2 Zahlenspiele: gemischte Beweisschritte sortieren —— */
var zsOrderData = {
  immer5: {
    poolId: 'zsPoolImmer5',
    slotsId: 'zsSlotsImmer5',
    fbId: 'fb_zs_immer5',
    steps: [
      { id: 'i0', html: 'Zahl \\(x\\) denken' },
      { id: 'i1', html: 'Verdoppeln → \\(2x\\)' },
      { id: 'i2', html: '\\(+10\\) → \\(2x+10\\)' },
      { id: 'i3', html: 'Halbieren → \\(x+5\\)' },
      { id: 'i4', html: 'Gedachte Zahl abziehen → \\(5\\)' }
    ]
  },
  nachbarn: {
    poolId: 'zsPoolNachbarn',
    slotsId: 'zsSlotsNachbarn',
    fbId: 'fb_zs_nachbarn',
    steps: [
      { id: 'n0', html: 'Nachbarn: \\(n-1\\) und \\(n+1\\)' },
      { id: 'n1', html: '\\((n-1)(n+1)=n^{2}-1\\) (genau 1 kleiner als \\(n^{2}\\))' },
      { id: 'n2', html: 'Mit der mittleren Zahl: \\(n(n^{2}-1)=n^{3}-n\\)' },
      { id: 'n3', html: '\\(+n\\): \\(n^{3}-n+n=n^{3}\\)' }
    ]
  }
};

var zsOrderState = {};

function zsShuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function zsIsIdentityOrder(shuffled, correct) {
  if (shuffled.length !== correct.length) return false;
  for (var i = 0; i < shuffled.length; i++) {
    if (shuffled[i].id !== correct[i].id) return false;
  }
  return true;
}

function zsShuffleSteps(steps) {
  var shuffled = zsShuffle(steps);
  var guard = 0;
  while (zsIsIdentityOrder(shuffled, steps) && guard < 12) {
    shuffled = zsShuffle(steps);
    guard++;
  }
  return shuffled;
}

function buildZahlenspieleOrders() {
  Object.keys(zsOrderData).forEach(function (key) {
    buildZsOrderExercise(key);
  });
  if (window.MathJax && MathJax.typesetPromise) {
    var panel = document.getElementById('panel1');
    if (panel) MathJax.typesetPromise([panel]).catch(function () {});
  }
}

function buildZsOrderExercise(key) {
  var cfg = zsOrderData[key];
  var pool = document.getElementById(cfg.poolId);
  var slotsEl = document.getElementById(cfg.slotsId);
  if (!pool || !slotsEl) return;

  var shuffled = zsShuffleSteps(cfg.steps);
  zsOrderState[key] = {
    selected: null,
    slots: new Array(cfg.steps.length).fill(null),
    poolOrder: shuffled.map(function (s) {
      return s.id;
    })
  };

  pool.innerHTML = '';
  shuffled.forEach(function (step) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'order-chip';
    btn.dataset.ex = key;
    btn.dataset.stepId = step.id;
    btn.innerHTML = step.html;
    btn.onclick = function () {
      selectZsOrderChip(key, step.id);
    };
    pool.appendChild(btn);
  });

  slotsEl.innerHTML = '';
  for (var i = 0; i < cfg.steps.length; i++) {
    var slot = document.createElement('div');
    slot.className = 'order-slot';
    slot.dataset.ex = key;
    slot.dataset.slot = String(i);
    slot.innerHTML =
      '<span class="ord-num">' +
      (i + 1) +
      '</span><span class="ord-body">Schritt ' +
      (i + 1) +
      ' hier ablegen</span>';
    slot.onclick = (function (slotIdx) {
      return function () {
        placeZsOrderChip(key, slotIdx);
      };
    })(i);
    slotsEl.appendChild(slot);
  }

  var fb = document.getElementById(cfg.fbId);
  if (fb) {
    fb.style.display = 'none';
    fb.textContent = '';
  }
}

function zsFindStep(key, stepId) {
  var steps = zsOrderData[key].steps;
  for (var i = 0; i < steps.length; i++) {
    if (steps[i].id === stepId) return steps[i];
  }
  return null;
}

function selectZsOrderChip(key, stepId) {
  var state = zsOrderState[key];
  if (!state) return;
  if (state.slots.indexOf(stepId) !== -1) return;
  state.selected = stepId;
  refreshZsOrderUi(key);
}

function placeZsOrderChip(key, slotIdx) {
  var state = zsOrderState[key];
  var cfg = zsOrderData[key];
  if (!state) return;

  if (state.selected === null) {
    if (state.slots[slotIdx] !== null) {
      state.slots[slotIdx] = null;
      refreshZsOrderUi(key);
    }
    return;
  }

  var prev = state.slots.indexOf(state.selected);
  if (prev !== -1) state.slots[prev] = null;
  state.slots[slotIdx] = state.selected;
  state.selected = null;
  refreshZsOrderUi(key);

  var fb = document.getElementById(cfg.fbId);
  if (fb) {
    fb.style.display = 'none';
    fb.textContent = '';
  }
}

function refreshZsOrderUi(key) {
  var cfg = zsOrderData[key];
  var state = zsOrderState[key];
  if (!cfg || !state) return;

  document.querySelectorAll('#' + cfg.poolId + ' .order-chip').forEach(function (chip) {
    var id = chip.dataset.stepId;
    var used = state.slots.indexOf(id) !== -1;
    chip.classList.toggle('used', used);
    chip.classList.toggle('selected', state.selected === id);
  });

  document.querySelectorAll('#' + cfg.slotsId + ' .order-slot').forEach(function (slot) {
    var idx = parseInt(slot.dataset.slot, 10);
    var stepId = state.slots[idx];
    slot.classList.remove('ok', 'bad', 'filled');
    var body = slot.querySelector('.ord-body');
    if (stepId) {
      var step = zsFindStep(key, stepId);
      slot.classList.add('filled');
      if (body) body.innerHTML = step ? step.html : '';
    } else if (body) {
      body.textContent = 'Schritt ' + (idx + 1) + ' hier ablegen';
    }
  });

  if (window.MathJax && MathJax.typesetPromise) {
    var slotsEl = document.getElementById(cfg.slotsId);
    if (slotsEl) MathJax.typesetPromise([slotsEl]).catch(function () {});
  }
}

function checkOneZsOrder(key) {
  var cfg = zsOrderData[key];
  var state = zsOrderState[key];
  var fb = document.getElementById(cfg.fbId);
  if (!state) return false;

  var incomplete = state.slots.some(function (s) {
    return s === null;
  });
  if (incomplete) {
    if (fb) {
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = 'Bitte alle Schritte in die Reihenfolge legen.';
    }
    return false;
  }

  var slotOk = state.slots.map(function (id, i) {
    return id === cfg.steps[i].id;
  });
  var ok = slotOk.every(Boolean);

  document.querySelectorAll('#' + cfg.slotsId + ' .order-slot').forEach(function (slot) {
    var idx = parseInt(slot.dataset.slot, 10);
    slot.classList.remove('ok', 'bad');
    slot.classList.add(slotOk[idx] ? 'ok' : 'bad');
  });

  if (fb) {
    fb.className = 'feedback ' + (ok ? 'correct' : 'incorrect');
    fb.style.display = 'block';
    fb.textContent = ok
      ? '\u2705 Richtige Reihenfolge!'
      : '\u274c Noch nicht richtig — prüfe die Reihenfolge der Schritte.';
  }
  return ok;
}

function checkZahlenspieleOrders() {
  var okImmer = checkOneZsOrder('immer5');
  var okNachbarn = checkOneZsOrder('nachbarn');
  if (okImmer && okNachbarn) markComplete(2);
}

function updatePyramid() {
  var n = parseInt(document.getElementById('pyrN').value, 10);
  document.getElementById('pyrNLabel').textContent = n;
  var el = document.getElementById('pyramidViz');
  el.innerHTML = '';
  var colors = ['', 'y', 'o', '', 'y', 'o'];
  var sum = 0;
  for (var r = 1; r <= n; r++) {
    sum += r * r;
    var row = document.createElement('div');
    row.className = 'pyramid-row';
    for (var c = 0; c < r; c++) {
      var cell = document.createElement('div');
      cell.className = 'pyramid-cell ' + (colors[r - 1] || '');
      row.appendChild(cell);
    }
    /* show only front row count visually as triangle of rows - for square layers show r cells in front */
    el.appendChild(row);
  }
  var parts = [];
  for (var i = 1; i <= n; i++) parts.push(String(i * i));
  document.getElementById('pyrOut').textContent =
    'Summe = ' + parts.join(' + ') + ' = ' + sum;
}

var matchStructData = [
  {
    left: '3x und 5x',
    correct: 'gleichartig',
    options: ['gleichartig', 'ungleichartig', 'Faktoren', 'Binom']
  },
  {
    left: '2a² und 7a',
    correct: 'ungleichartig',
    options: ['gleichartig', 'ungleichartig', 'immer addierbar', 'Binom']
  },
  {
    left: 'In 4(x+2): 4 und (x+2)',
    correct: 'Faktoren',
    options: ['Summanden', 'Faktoren', 'gleichartig', 'Wurzel']
  },
  {
    left: 'In 3x+5: 3x und 5',
    correct: 'Summanden',
    options: ['Faktoren', 'Summanden', 'Potenzen', 'Binome']
  }
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

function checkMatchGeneric(containerId, fbId, sectionNum) {
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
    fb.textContent = '\u274c Noch nicht alles richtig.';
  }
}

function checkMatchStruct() {
  checkMatchGeneric('matchStruct', 'fb_match_struct', 4);
}

var matchBinomData = [
  { left: '(x-2)(x+2)', correct: 'x²-4', options: ['x²-4', 'x²-4x+4', 'x²+4', '4x²-4x+1'] },
  { left: '(x-2)²', correct: 'x²-4x+4', options: ['x²-4', 'x²-4x+4', 'x²+4x+4', 'x²-2'] },
  { left: '(2x-1)²', correct: '4x²-4x+1', options: ['4x²-1', '4x²-4x+1', '2x²-2x+1', '4x²+4x+1'] },
  { left: '(a+b)²', correct: 'a²+2ab+b²', options: ['a²+b²', 'a²+2ab+b²', 'a²-2ab+b²', 'a²-b²'] }
];

function checkMatchBinom() {
  checkMatchGeneric('matchBinom', 'fb_match_binom', 9);
}

var sortItems = [
  { id: 's1', tex: 'x²+6x+9', yes: true },
  { id: 's2', tex: '25x²-10x+1', yes: true },
  { id: 's3', tex: '16x²+16x+4', yes: true },
  { id: 's4', tex: '4x²+12x-9', yes: false },
  { id: 's5', tex: '9x²+6x+4', yes: false },
  { id: 's6', tex: 'x²+2x+2', yes: false }
];

function setSortTarget(t) {
  sortTarget = t;
  document.getElementById('sortTargetLabel').textContent =
    t === 'yes' ? 'Quadrat eines Binoms' : 'Kein Quadrat eines Binoms';
  document.getElementById('binYes').style.borderColor = t === 'yes' ? '#2563EB' : '#CBD5E1';
  document.getElementById('binNo').style.borderColor = t === 'no' ? '#2563EB' : '#CBD5E1';
  if (sortSelected) {
    var it = null;
    for (var i = 0; i < sortItems.length; i++) {
      if (sortItems[i].id === sortSelected) it = sortItems[i];
    }
    if (it) placeSortItem(it);
  }
}

function buildSortPool() {
  var pool = document.getElementById('sortPool');
  if (!pool) return;
  pool.innerHTML = '';
  sortState = {};
  sortSelected = null;
  document.getElementById('binYes').innerHTML = '<h4>Quadrat eines Binoms</h4>';
  document.getElementById('binNo').innerHTML = '<h4>Kein Quadrat eines Binoms</h4>';
  sortItems.forEach(function (it) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sort-item';
    btn.id = it.id;
    btn.innerHTML = '\\(' + it.tex + '\\)';
    btn.onclick = function (e) {
      e.stopPropagation();
      sortSelected = it.id;
      document.querySelectorAll('.sort-item').forEach(function (b) {
        b.style.outline = '';
      });
      btn.style.outline = '2px solid #2563EB';
    };
    pool.appendChild(btn);
  });
  document.getElementById('sortTargetLabel').textContent = 'Term wählen, dann Box tippen';
  document.getElementById('binYes').style.borderColor = '#CBD5E1';
  document.getElementById('binNo').style.borderColor = '#CBD5E1';
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([pool]).catch(function () {});
}

function placeSortItem(it) {
  if (!sortSelected) return;
  var btn = document.getElementById(it.id);
  if (!btn) return;
  var target = sortTarget === 'yes' ? document.getElementById('binYes') : document.getElementById('binNo');
  target.appendChild(btn);
  btn.style.outline = '';
  sortState[it.id] = sortTarget;
  sortSelected = null;
  document.getElementById('sortTargetLabel').textContent = 'Term wählen, dann Box tippen';
}

function resetSortBinom() {
  buildSortPool();
  var fb = document.getElementById('fb_sort');
  if (fb) {
    fb.style.display = 'none';
    fb.textContent = '';
  }
}

function checkSortBinom() {
  var fb = document.getElementById('fb_sort');
  var ok = true;
  sortItems.forEach(function (it) {
    var placed = sortState[it.id];
    var should = it.yes ? 'yes' : 'no';
    if (placed !== should) ok = false;
  });
  if (Object.keys(sortState).length < sortItems.length) {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = 'Bitte alle Terme einer Box zuordnen.';
    return;
  }
  if (ok) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Perfekt sortiert!';
    markComplete(10);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Prüfe: vollständige Quadrate haben Form a²±2ab+b² (mittlerer Term passend).';
  }
}

var finalQuizData = [
  {
    q: 'Volumen eines Quaders a \u00d7 2a \u00d7 3a ist \u2026',
    opts: ['6a', '6a²', '6a³', '5a³'],
    correct: 2,
    explain: 'a·2a·3a = 6a³.'
  },
  {
    q: '(n-1)(n+1) = \u2026',
    opts: ['n²+1', 'n²-1', 'n²', '2n'],
    correct: 1,
    explain: '3. binomische Formel / Differenz.'
  },
  {
    q: 'Summe der ersten 5 Quadratzahlen =',
    opts: ['25', '55', '15', '30'],
    correct: 1,
    explain: '1+4+9+16+25=55.'
  },
  {
    q: '3x und 5x sind \u2026',
    opts: ['ungleichartig', 'gleichartig', 'Faktoren', 'Binome'],
    correct: 1,
    explain: 'Gleicher Variablenteil x.'
  },
  {
    q: '3(2x-5) =',
    opts: ['6x-5', '6x-15', '5x-15', '6x+15'],
    correct: 1,
    explain: 'Distributivgesetz: 3·2x und 3·(-5).'
  },
  {
    q: '5-(3-x) =',
    opts: ['2-x', '8-x', '2+x', '5-3-x'],
    correct: 2,
    explain: 'Minus vor der Klammer: 5-3+x = 2+x.'
  },
  {
    q: '(a+b)² =',
    opts: ['a²+b²', 'a²+2ab+b²', 'a²-2ab+b²', 'a²-b²'],
    correct: 1,
    explain: '1. binomische Formel.'
  },
  {
    q: '(a+b)(a-b) =',
    opts: ['a²+b²', 'a²+2ab+b²', 'a²-b²', '(a-b)²'],
    correct: 2,
    explain: '3. binomische Formel.'
  },
  {
    q: '(x-2)² =',
    opts: ['x²-4', 'x²-4x+4', 'x²+4', 'x²-2x+4'],
    correct: 1,
    explain: 'a=x, b=2 → x²-4x+4.'
  },
  {
    q: 'Rechteck mit Seiten x-y und x+y hat Fläche \u2026',
    opts: ['x²+y²', 'x+y', 'x²-y²', 'y-x'],
    correct: 2,
    explain: '(x-y)(x+y)=x²-y².'
  },
  {
    q: '(2x-2)² ist NICHT \u2026',
    opts: ['4x²-8x+4', '4(x-1)²', '4x²-4x+4', '(2(x-1))²'],
    correct: 2,
    explain: 'Mitte: 2·2x·(-2)=-8x, nicht -4x.'
  },
  {
    q: 'Warum Termstruktur erkennen?',
    opts: [
      'Nur für Geometrie',
      'Damit Technologie (CAS) gezielt genutzt werden kann',
      'Terme darf man nie umformen',
      'Nur für Prozentrechnung'
    ],
    correct: 1,
    explain: 'Lehrplanziel: Struktur erkennen → Technologie gezielt einsetzen.'
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
    msg = 'Ausgezeichnet — Terme und Binome beherrschst du sicher!';
    badges = '<span class="earned-badge gold">Gold \u2014 Terme</span>';
  } else if (pct >= 70) {
    msg = 'Sehr gut! Schau dir die markierten Fragen noch einmal an.';
    badges = '<span class="earned-badge silver">Silber \u2014 solider Stand</span>';
  } else {
    msg = 'Wiederhole Distributivgesetz, Vorzeichen bei Klammern und die drei Binome.';
    badges = '<span class="earned-badge bronze">Bronze \u2014 weiter \u00fcben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;
  if (score >= 8) markComplete(11);
}

function resetFinalQuiz() {
  fqAnswers = new Array(finalQuizData.length).fill(-1);
  document.getElementById('finalResult').style.display = 'none';
  document.querySelectorAll('.quiz-step-dot').forEach(function (d) {
    d.classList.remove('correct-dot', 'wrong-dot');
  });
  showFinalQuestion(0);
}

/* ---- Binomische Flächen: interaktiver Builder ---- */
var binomMode = 0;
var binomSelectedTile = null;
var binomSlotValues = [];
var binomModes = [
  {
    hint: 'Quadrat mit Seite \\(a+b\\) — lege \\(a^{2}\\), zwei \\(ab\\) und \\(b^{2}\\) ein.',
    tiles: [
      { id: 'a2', label: 'a²', cls: 'bq-a2' },
      { id: 'ab', label: 'ab', cls: 'bq-ab' },
      { id: 'ab', label: 'ab', cls: 'bq-ab' },
      { id: 'b2', label: 'b²', cls: 'bq-b2' }
    ],
    correct: ['a2', 'ab', 'ab', 'b2'],
    boardClass: '',
    slots: 4
  },
  {
    hint: 'Quadrat mit Seite \\(a-b\\): große Fläche \\(a^{2}\\), minus zwei Streifen \\(ab\\), plus \\(b^{2}\\) zurück.',
    tiles: [
      { id: 'a2', label: 'a²', cls: 'bq-a2' },
      { id: 'nab', label: '−ab', cls: 'bq-neg' },
      { id: 'nab', label: '−ab', cls: 'bq-neg' },
      { id: 'b2', label: 'b²', cls: 'bq-b2' }
    ],
    correct: ['a2', 'nab', 'nab', 'b2'],
    boardClass: '',
    slots: 4
  },
  {
    hint: 'Differenz der Quadrate: großes Quadrat \\(a^{2}\\), darin kleines \\(b^{2}\\) abziehen — Restfläche = Rechteck \\((a+b)(a-b)\\).',
    tiles: [
      { id: 'a2', label: 'a²', cls: 'bq-a2' },
      { id: 'nb2', label: '−b²', cls: 'bq-neg' }
    ],
    correct: ['a2', 'nb2'],
    boardClass: 'diff',
    slots: 2
  }
];

function binomDiffSlotLabel(slotIdx) {
  return slotIdx === 0 ? 'großes Quadrat a²' : 'Ausschnitt −b²';
}

function syncBinomDiffChrome(solved) {
  var stage = document.getElementById('binomStage');
  var guide = document.getElementById('binomDiffGuide');
  var ggb = document.getElementById('binomGgbEmbed');
  var isDiff = binomMode === 2;
  if (stage) stage.classList.toggle('diff-mode', isDiff);
  if (guide) {
    guide.hidden = !isDiff;
    guide.classList.toggle('solved', !!solved);
  }
  if (ggb) {
    ggb.hidden = !isDiff;
    if (isDiff) ensureBinomGgbLoaded();
  }
}

function ensureBinomGgbLoaded() {
  var iframe = document.getElementById('binomGgbIframe');
  if (!iframe) return;
  var src = iframe.getAttribute('data-ggb-src');
  var cur = iframe.getAttribute('src');
  if (src && (!cur || cur !== src)) {
    iframe.setAttribute('src', src);
  }
}

function setBinomMode(mode) {
  binomMode = mode;
  binomSelectedTile = null;
  document.querySelectorAll('.binom-tab').forEach(function (t, i) {
    t.classList.toggle('active', i === mode);
  });
  var hint = document.getElementById('binomHint');
  if (hint) hint.innerHTML = binomModes[mode].hint;
  resetBinomBoard();
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([document.getElementById('panel7')]).catch(function () {});
  }
}

function unwrapBinomBoard() {
  var stage = document.getElementById('binomStage');
  var board = document.getElementById('binomBoard');
  if (!stage || !board) return board;
  var wrap = stage.querySelector('.binom-diff-labels');
  if (wrap && wrap.contains(board)) {
    var dims = document.getElementById('binomDims');
    stage.insertBefore(board, dims || wrap);
    wrap.remove();
  }
  return board;
}

function resetBinomBoard() {
  var cfg = binomModes[binomMode];
  binomSlotValues = new Array(cfg.slots).fill(null);
  binomSelectedTile = null;
  var palette = document.getElementById('binomPalette');
  var board = unwrapBinomBoard();
  var fb = document.getElementById('fb_binom_board');
  if (fb) {
    fb.style.display = 'none';
    fb.textContent = '';
  }
  if (!palette || !board) return;

  palette.innerHTML = '';
  cfg.tiles.forEach(function (tile, i) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile-btn';
    btn.dataset.tileIdx = String(i);
    btn.dataset.tileId = tile.id;
    btn.textContent = tile.label;
    btn.onclick = function () {
      selectBinomTile(i);
    };
    palette.appendChild(btn);
  });

  board.className = 'binom-board' + (cfg.boardClass ? ' ' + cfg.boardClass : '');
  board.innerHTML = '';
  board.removeAttribute('style');

  if (cfg.boardClass === 'diff') {
    renderBinomDiffBoard(board);
  } else {
    for (var s = 0; s < cfg.slots; s++) {
      var slot = document.createElement('div');
      slot.className = 'binom-slot';
      slot.dataset.slot = String(s);
      slot.textContent = '?';
      slot.onclick = function () {
        placeBinomTile(parseInt(this.dataset.slot, 10));
      };
      board.appendChild(slot);
    }
  }

  var dims = document.getElementById('binomDims');
  if (dims) {
    if (binomMode === 2) {
      dims.innerHTML = '<span>\\(a^{2}-b^{2}=(a+b)(a-b)\\)</span>';
    } else {
      dims.innerHTML = '<span>a</span><span>b</span>';
    }
  }
  syncBinomDiffChrome(false);
  refreshBinomTileStates();
}

function renderBinomDiffBoard(board) {
  var stage = document.getElementById('binomStage');
  var wrap = document.createElement('div');
  wrap.className = 'binom-diff-labels';

  var ylab = document.createElement('div');
  ylab.className = 'binom-diff-ylab';
  ylab.innerHTML = '<span>a−b</span><span>b</span>';

  var xlab = document.createElement('div');
  xlab.className = 'binom-diff-xlab';
  xlab.innerHTML = '<span>a−b</span><span>b</span>';

  board.className = 'binom-board diff';
  board.innerHTML = '';

  for (var s = 0; s < 2; s++) {
    var slot = document.createElement('div');
    slot.className = 'binom-slot';
    slot.dataset.slot = String(s);
    slot.textContent = binomDiffSlotLabel(s);
    slot.onclick = (function (idx) {
      return function () {
        placeBinomTile(idx);
      };
    })(s);
    board.appendChild(slot);
  }

  wrap.appendChild(ylab);
  wrap.appendChild(board);
  wrap.appendChild(xlab);

  if (stage) {
    var dims = document.getElementById('binomDims');
    stage.insertBefore(wrap, dims || null);
  }
}

function selectBinomTile(idx) {
  var btn = document.querySelector('.tile-btn[data-tile-idx="' + idx + '"]');
  if (!btn || btn.classList.contains('used')) return;
  binomSelectedTile = idx;
  document.querySelectorAll('.tile-btn').forEach(function (b) {
    b.classList.toggle('selected', parseInt(b.dataset.tileIdx, 10) === idx);
  });
}

function placeBinomTile(slotIdx) {
  var cfg = binomModes[binomMode];
  var slot = document.querySelector('#binomBoard .binom-slot[data-slot="' + slotIdx + '"]');

  /* ohne Auswahl: belegtes Feld leeren */
  if (binomSelectedTile === null) {
    if (binomSlotValues[slotIdx] !== null) {
      binomSlotValues[slotIdx] = null;
      if (slot) {
        slot.className = 'binom-slot';
        slot.textContent =
          cfg.boardClass === 'diff' ? binomDiffSlotLabel(slotIdx) : '?';
      }
      syncBinomDiffChrome(false);
      refreshBinomTileStates();
    }
    return;
  }

  var tile = cfg.tiles[binomSelectedTile];
  if (!tile) return;

  binomSlotValues[slotIdx] = {
    tileIdx: binomSelectedTile,
    id: tile.id,
    label: tile.label,
    cls: tile.cls
  };

  if (slot) {
    slot.className = 'binom-slot filled ' + tile.cls;
    slot.textContent = tile.label;
  }

  binomSelectedTile = null;
  refreshBinomTileStates();
}

function refreshBinomTileStates() {
  var used = {};
  binomSlotValues.forEach(function (v) {
    if (v) used[v.tileIdx] = true;
  });
  document.querySelectorAll('#binomPalette .tile-btn').forEach(function (b) {
    var idx = parseInt(b.dataset.tileIdx, 10);
    b.classList.toggle('used', !!used[idx]);
    b.classList.toggle('selected', binomSelectedTile === idx);
  });
}

function checkBinomBoard() {
  var cfg = binomModes[binomMode];
  var fb = document.getElementById('fb_binom_board');
  var slots = document.querySelectorAll('#binomBoard .binom-slot');
  var placed = binomSlotValues.map(function (v) {
    return v ? v.id : null;
  });

  if (placed.some(function (p) { return p === null; })) {
    if (fb) {
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = 'Bitte alle Flächenfelder belegen.';
    }
    return;
  }

  var slotOk = placed.map(function (id, i) {
    return id === cfg.correct[i];
  });
  /* bei (a±b)²: die beiden mittleren Streifen sind vertauschbar */
  if (binomMode < 2) {
    var midSwap =
      placed[1] === cfg.correct[2] && placed[2] === cfg.correct[1];
    if (midSwap) {
      slotOk[1] = true;
      slotOk[2] = true;
    }
  }
  var ok = slotOk.every(Boolean);

  slots.forEach(function (slot, i) {
    slot.classList.remove('ok', 'bad');
    slot.classList.add(slotOk[i] ? 'ok' : 'bad');
  });

  if (fb) {
    fb.className = 'feedback ' + (ok ? 'correct' : 'incorrect');
    fb.style.display = 'block';
    if (ok && binomMode === 2) {
      fb.textContent =
        '\u2705 Passt! a\u00b2 \u2212 b\u00b2 ist die L-Fl\u00e4che — umgeordnet das Rechteck (a+b)(a\u2212b).';
    } else {
      fb.textContent = ok
        ? '\u2705 Passt! Die Flächen ergeben die Formel.'
        : '\u274c Noch nicht richtig — prüfe die Positionen der Teilflächen.';
    }
  }
  if (binomMode === 2) syncBinomDiffChrome(ok);
  if (ok) markComplete(8);
}

document.addEventListener('DOMContentLoaded', function () {
  updatePyramid();
  buildZahlenspieleOrders();
  buildMatchList('matchStruct', matchStructData);
  buildMatchList('matchBinom', matchBinomData);
  buildSortPool();
  setBinomMode(0);
  updateProgress();
  buildFinalQuiz();
});
