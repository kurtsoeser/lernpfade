/**
 * Lernpfad: Deskriptive Grundlagen (Datentypen, Häufigkeiten, Grafiken)
 * Interaktiv: Zuordnung, Umfrage-Simulator, Live-Diagramme, Diagramm-Deutung
 */
var TOTAL_SECTIONS = 8;
var completedSections = new Set();
var currentTab = 0;

var currentFQ = 0;
var fqAnswers = [];

var scaleAssignments = {};
var selectedScaleChip = null;

var surveyCats = [
  { id: 'bus', label: 'Bus', color: '#3B82C4' },
  { id: 'auto', label: 'Auto', color: '#F39C12' },
  { id: 'bahn', label: 'Bahn', color: '#27AE60' },
  { id: 'rad', label: 'Fahrrad', color: '#8E44AD' },
  { id: 'fuss', label: 'zu Fuß', color: '#E74C3C' }
];
var surveyCounts = { bus: 0, auto: 0, bahn: 0, rad: 0, fuss: 0 };
var freqMode = 'absolute';
var barChart = null;
var pieChart = null;
var chartsReady = false;

var SCALE_ITEMS = [
  { id: 'wohnort', text: 'Wohnort / Gemeinde', scale: 'nominal' },
  { id: 'zahlung', text: 'Zahlungsmethode (Bar, Karte, …)', scale: 'nominal' },
  { id: 'marke', text: 'Lieblingsmarke', scale: 'nominal' },
  { id: 'note', text: 'Schulnote 1–5', scale: 'ordinal' },
  { id: 'zufrieden', text: 'Zufriedenheit (sehr gut → schlecht)', scale: 'ordinal' },
  { id: 'prio', text: 'Priorität hoch / mittel / gering', scale: 'ordinal' },
  { id: 'umsatz', text: 'Monatsumsatz in €', scale: 'metric' },
  { id: 'alter', text: 'Alter in Jahren', scale: 'metric' },
  { id: 'fahrzeit', text: 'Fahrzeit in Minuten', scale: 'metric' }
];

var GRAPH_MATCH = [
  {
    q: 'Wie verteilt sich das Monatsbudget auf Ausgabenkategorien?',
    correct: 'kreis',
    hint: 'Anteile eines Ganzen → Kreis (oder Balken mit Anteilen).'
  },
  {
    q: 'Umsatzentwicklung von Jänner bis Dezember',
    correct: 'linie',
    hint: 'Zeitlicher Verlauf → Liniendiagramm.'
  },
  {
    q: 'Welche Anreise ist am häufigsten? (Kategorien vergleichen)',
    correct: 'balken',
    hint: 'Kategorienvergleich → Balken-/Säulendiagramm.'
  },
  {
    q: 'Zufriedenheitsstufen von „sehr gut“ bis „sehr schlecht“ vergleichen',
    correct: 'balken',
    hint: 'Geordnete Stufen → Balken/Säule (Reihenfolge einhalten).'
  }
];

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

  if (idx === 3) ensureCharts();
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

/* ── Skalen-Zuordnung (Klick → Bin) ── */

function initScaleSorter() {
  var pool = document.getElementById('sgScalePool');
  if (!pool) return;
  pool.innerHTML = '';
  scaleAssignments = {};
  selectedScaleChip = null;

  SCALE_ITEMS.forEach(function (item) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sg-chip';
    btn.dataset.id = item.id;
    btn.textContent = item.text;
    btn.onclick = function () {
      selectScaleChip(item.id);
    };
    pool.appendChild(btn);
  });

  ['nominal', 'ordinal', 'metric'].forEach(function (scale) {
    var bin = document.getElementById('sgBinChips_' + scale);
    if (bin) bin.innerHTML = '';
  });

  var fb = document.getElementById('fb_sg_scale');
  if (fb) {
    fb.style.display = 'none';
    fb.textContent = '';
  }
  updateScaleHint();
}

function selectScaleChip(id) {
  selectedScaleChip = id;
  document.querySelectorAll('#sgScalePool .sg-chip').forEach(function (c) {
    c.classList.toggle('selected', c.dataset.id === id && !scaleAssignments[id]);
  });
  updateScaleHint();
}

function placeScaleChip(scale) {
  if (!selectedScaleChip) {
    updateScaleHint('Zuerst ein Merkmal in der Pool-Leiste antippen.');
    return;
  }
  if (scaleAssignments[selectedScaleChip]) return;

  scaleAssignments[selectedScaleChip] = scale;
  var item = SCALE_ITEMS.find(function (x) {
    return x.id === selectedScaleChip;
  });

  document.querySelectorAll('#sgScalePool .sg-chip').forEach(function (c) {
    if (c.dataset.id === selectedScaleChip) c.classList.add('placed');
    c.classList.remove('selected');
  });

  var host = document.getElementById('sgBinChips_' + scale);
  if (host && item) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'sg-chip';
    chip.textContent = item.text;
    chip.title = 'Antippen zum Zurücklegen';
    chip.onclick = function () {
      unplaceScaleChip(item.id);
    };
    host.appendChild(chip);
  }

  selectedScaleChip = null;
  updateScaleHint();
}

function unplaceScaleChip(id) {
  delete scaleAssignments[id];
  var hostScale = null;
  ['nominal', 'ordinal', 'metric'].forEach(function (s) {
    var host = document.getElementById('sgBinChips_' + s);
    if (!host) return;
    Array.prototype.slice.call(host.children).forEach(function (ch) {
      var item = SCALE_ITEMS.find(function (x) {
        return x.id === id;
      });
      if (item && ch.textContent === item.text) {
        hostScale = s;
        ch.remove();
      }
    });
  });
  document.querySelectorAll('#sgScalePool .sg-chip').forEach(function (c) {
    if (c.dataset.id === id) c.classList.remove('placed', 'selected');
  });
  updateScaleHint();
}

function updateScaleHint(msg) {
  var hint = document.getElementById('sgScaleHint');
  if (!hint) return;
  var placed = Object.keys(scaleAssignments).length;
  hint.textContent =
    msg ||
    (selectedScaleChip
      ? 'Ausgewählt — jetzt Nominal / Ordinal / Metrisch antippen.'
      : placed + ' von ' + SCALE_ITEMS.length + ' zugeordnet. Merkmal wählen, dann Kategorie.');
}

function checkScaleSorter() {
  var fb = document.getElementById('fb_sg_scale');
  var missing = SCALE_ITEMS.filter(function (it) {
    return !scaleAssignments[it.id];
  });
  if (missing.length) {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      'Noch nicht alles zugeordnet (' + missing.length + ' offen). Jedes Merkmal in eine Kategorie legen.';
    return;
  }

  var wrong = [];
  SCALE_ITEMS.forEach(function (it) {
    if (scaleAssignments[it.id] !== it.scale) wrong.push(it.text);
  });

  if (wrong.length === 0) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Super! Alle Merkmale korrekt zugeordnet — nominal nur unterscheiden, ordinal ordnen, metrisch messen.';
    markComplete(2);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.innerHTML =
      '\u274c Noch nicht ganz. Prüfe besonders: <em>' +
      wrong.slice(0, 3).join(', ') +
      (wrong.length > 3 ? ' \u2026' : '') +
      '</em>. Tipp: Reihenfolge ohne gleiche Abstände = ordinal.';
  }
}

/* ── Umfrage-Simulator + Live-Charts ── */

function surveyTotal() {
  return surveyCats.reduce(function (s, c) {
    return s + (surveyCounts[c.id] || 0);
  }, 0);
}

function addSurveyVote(id) {
  surveyCounts[id] = (surveyCounts[id] || 0) + 1;
  renderSurveyUI();
  updateCharts();
}

function resetSurvey() {
  surveyCats.forEach(function (c) {
    surveyCounts[c.id] = 0;
  });
  renderSurveyUI();
  updateCharts();
}

function demoSurvey() {
  surveyCounts = { bus: 10, auto: 6, bahn: 4, rad: 3, fuss: 2 };
  renderSurveyUI();
  updateCharts();
}

function renderSurveyUI() {
  var n = surveyTotal();
  var meta = document.getElementById('sgSurveyMeta');
  if (meta) {
    meta.innerHTML =
      '<span><strong>n = ' +
      n +
      '</strong> Antworten</span>' +
      '<span>Tipp: Antippen = +1 Stimme · Demo füllt das Anreise-Beispiel</span>';
  }

  surveyCats.forEach(function (c) {
    var el = document.getElementById('sgCount_' + c.id);
    if (el) el.textContent = surveyCounts[c.id] || 0;
  });

  var tbody = document.getElementById('sgFreqBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  surveyCats.forEach(function (c) {
    var abs = surveyCounts[c.id] || 0;
    var rel = n ? abs / n : 0;
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' +
      c.label +
      '</td><td><strong>' +
      abs +
      '</strong></td><td>' +
      (n ? rel.toFixed(2).replace('.', ',') : '—') +
      '</td><td>' +
      (n ? Math.round(rel * 1000) / 10 + '\u00a0%' : '—') +
      '</td>';
    tbody.appendChild(tr);
  });
}

function setFreqMode(mode) {
  freqMode = mode;
  document.querySelectorAll('.sg-toggle-btn[data-freq-mode]').forEach(function (b) {
    b.classList.toggle('active', b.dataset.freqMode === mode);
  });
  updateCharts();
}

function ensureCharts() {
  if (chartsReady || typeof Chart === 'undefined') {
    updateCharts();
    return;
  }
  var barCtx = document.getElementById('sgBarChart');
  var pieCtx = document.getElementById('sgPieChart');
  if (!barCtx || !pieCtx) return;

  var labels = surveyCats.map(function (c) {
    return c.label;
  });
  var colors = surveyCats.map(function (c) {
    return c.color;
  });

  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Häufigkeit',
          data: labels.map(function () {
            return 0;
          }),
          backgroundColor: colors,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              var n = surveyTotal();
              var v = ctx.raw;
              if (freqMode === 'relative' && n) {
                return (Math.round(v * 1000) / 10) + ' %';
              }
              return v + (n ? ' (von ' + n + ')' : '');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (v) {
              return freqMode === 'relative' ? Math.round(v * 100) + '%' : v;
            }
          }
        }
      },
      animation: { duration: 450 }
    }
  });

  pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: labels.map(function () {
            return 0;
          }),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              var n = surveyTotal();
              var abs = surveyCounts[surveyCats[ctx.dataIndex].id] || 0;
              var pct = n ? Math.round((abs / n) * 1000) / 10 : 0;
              return ctx.label + ': ' + abs + ' (' + pct + ' %)';
            }
          }
        }
      },
      animation: { duration: 450 }
    }
  });

  chartsReady = true;
  updateCharts();
}

function updateCharts() {
  if (!chartsReady) return;
  var n = surveyTotal();
  var absData = surveyCats.map(function (c) {
    return surveyCounts[c.id] || 0;
  });
  var relData = absData.map(function (v) {
    return n ? v / n : 0;
  });

  barChart.data.datasets[0].data = freqMode === 'relative' ? relData : absData;
  barChart.data.datasets[0].label =
    freqMode === 'relative' ? 'Relative Häufigkeit' : 'Absolute Häufigkeit';
  barChart.options.scales.y.max = freqMode === 'relative' ? 1 : undefined;
  barChart.update();

  pieChart.data.datasets[0].data = absData.every(function (v) {
    return v === 0;
  })
    ? [1]
    : absData;
  if (absData.every(function (v) {
    return v === 0;
  })) {
    pieChart.data.labels = ['noch keine Daten'];
    pieChart.data.datasets[0].backgroundColor = ['#E8E8E8'];
  } else {
    pieChart.data.labels = surveyCats.map(function (c) {
      return c.label;
    });
    pieChart.data.datasets[0].backgroundColor = surveyCats.map(function (c) {
      return c.color;
    });
  }
  pieChart.update();
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

function checkFreqTableExercise() {
  var fb = document.getElementById('fb_sg_freq_table');
  var a = parseNum(document.getElementById('sgRelTennis').value);
  var b = parseNum(document.getElementById('sgRelFussball').value);
  var c = parseNum(document.getElementById('sgPctSchwimmen').value);

  // Tennis 3/30=0.1; Fußball 4/30≈0.133; Schwimmen 5/30≈16.67%
  var tennisOk = approxEq(a, 0.1, 0.015) || approxEq(a, 10, 0.2);
  var fussOk =
    approxEq(b, 4 / 30, 0.02) ||
    approxEq(b, 0.13, 0.02) ||
    approxEq(b, 0.133, 0.01) ||
    approxEq(b, 13.3, 0.5) ||
    approxEq(b, 13, 0.6);
  var schwOk =
    approxEq(c, (5 / 30) * 100, 0.6) ||
    approxEq(c, 16.67, 0.5) ||
    approxEq(c, 16.7, 0.5) ||
    approxEq(c, 5 / 30, 0.01);

  if (tennisOk && fussOk && schwOk) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Richtig: Tennis 3/30 = 0,1 · Fußball 4/30 \u2248 0,133 · Schwimmen \u2248 16,7 %.';
    markComplete(4);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Noch nicht. Formel: absolute Häufigkeit / n (hier n = 30). Prozent = relativ · 100.';
  }
}

/* ── Diagramm-Interpretation ── */

function selectDiagramCard(el) {
  var group = el.closest('.sg-diagram-grid');
  if (!group) return;
  group.querySelectorAll('.sg-diagram-card').forEach(function (c) {
    c.classList.remove('selected', 'correct-pick', 'wrong-pick');
  });
  el.classList.add('selected');
}

function checkDiagramPick(groupId, correctIdx, tabIdx) {
  var grid = document.getElementById(groupId);
  var fb = document.getElementById('fb_' + groupId);
  if (!grid || !fb) return;
  var selected = grid.querySelector('.sg-diagram-card.selected');
  if (!selected) {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = 'Bitte eine Grafik auswählen.';
    return;
  }
  var idx = parseInt(selected.dataset.idx, 10);
  grid.querySelectorAll('.sg-diagram-card').forEach(function (c) {
    c.classList.remove('correct-pick', 'wrong-pick', 'selected');
  });
  if (idx === correctIdx) {
    selected.classList.add('correct-pick');
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent = '\u2705 Passt — gute Wahl für die Fragestellung.';
    if (typeof tabIdx === 'number') markComplete(tabIdx + 1);
  } else {
    selected.classList.add('wrong-pick');
    var right = grid.querySelector('[data-idx="' + correctIdx + '"]');
    if (right) right.classList.add('correct-pick');
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Die markierte Grafik passt besser. Denk an: Vergleich → Balken, Anteil → Kreis, Verlauf → Linie.';
  }
}

function checkInterpQuiz() {
  checkQuizGroup(4, ['sg4_interp1', 'sg4_interp2']);
}

function checkGraphMatch() {
  var fb = document.getElementById('fb_sg_graph_match');
  var allOk = true;
  GRAPH_MATCH.forEach(function (item, i) {
    var sel = document.getElementById('sgMatch_' + i);
    if (!sel || sel.value !== item.correct) allOk = false;
  });
  if (allOk) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Starke Argumentation: Kreis = Anteile, Linie = Verlauf, Balken = Vergleich.';
    markComplete(6);
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Mindestens eine Zuordnung stimmt noch nicht. Merksatz: Balken = Vergleich · Kreis = Anteile · Linie = Verlauf.';
  }
}

function checkMisleading() {
  var fb = document.getElementById('fb_sg_misleading');
  var selected = document.querySelector('#sgMisleadingOpts .quiz-option.selected');
  if (!selected) {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent = 'Bitte eine Antwort wählen.';
    return;
  }
  var idx = parseInt(selected.dataset.idx, 10);
  document.querySelectorAll('#sgMisleadingOpts .quiz-option').forEach(function (o) {
    o.classList.remove('correct-answer', 'wrong-answer', 'selected');
  });
  if (idx === 1) {
    selected.classList.add('correct-answer');
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Genau: Die y-Achse beginnt nicht bei 0 — kleine Schwankungen wirken dramatisch bzw. „stabil“.';
    markComplete(7);
  } else {
    selected.classList.add('wrong-answer');
    document.querySelector('#sgMisleadingOpts .quiz-option[data-idx="1"]').classList.add('correct-answer');
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Achte auf die Achsenskalierung: Ohne 0 am Ursprung kann man Trends übertreiben oder „glätten“.';
  }
}

/* ── Abschlussquiz ── */

var finalQuizData = [
  {
    type: 'mc',
    q: 'Die Frage „Mit welchem Verkehrsmittel kommst du zur Schule?“ (Auto, Bus, \u2026) liefert Daten auf welchem Niveau?',
    opts: ['nominalskaliert', 'ordinalskaliert', 'metrisch', 'intervallskaliert ohne Ordnung'],
    correct: 0,
    explain:
      'Kategorien ohne sinnvolle Rangfolge sind nominalskaliert — man zählt und vergleicht Häufigkeiten.'
  },
  {
    type: 'mc',
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
    type: 'match',
    q: 'Ordne jedem Merkmal das passende Skalenniveau zu.',
    left: ['Lieblingsfach', 'Schulnote', 'Körpergröße in cm'],
    right: ['nominalskaliert', 'ordinalskaliert', 'metrisch'],
    correct: [0, 1, 2],
    explain:
      'Lieblingsfach = nominal · Note = ordinal · Körpergröße = metrisch.'
  },
  {
    type: 'mc',
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
    type: 'mc',
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
    type: 'mc',
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
    type: 'mc',
    q: 'Bei nominalskalierten Daten ist typischerweise …',
    opts: [
      'der Mittelwert die beste Zusammenfassung',
      'nur das Z\u00e4hlen von H\u00e4ufigkeiten sinnvoll; Mittelwerte sind nicht interpretierbar',
      'die Standardabweichung immer zu berichten',
      'ein Boxplot die Pflichtgrafik'
    ],
    correct: 1,
    explain:
      'Nominal: Kategorien — Häufigkeiten und Anteile ja, „Mittelwert der Kategorie“ nicht sinnvoll.'
  },
  {
    type: 'mc',
    q: 'Problembezogene Begr\u00fcndung: Zufriedenheitsstufen (sehr gut \u2192 sehr schlecht) will man vergleichen. Sehr passend ist oft …',
    opts: [
      'Liniendiagramm ohne Zeitachse',
      'Balken- oder S\u00e4ulendiagramm mit geordneten Stufen',
      'ein Streudiagramm zweier nominaler Merkmale',
      'ein Histogramm mit Klassenbreite 0'
    ],
    correct: 1,
    explain:
      'Geordnete Stufen (ordinal) lassen sich mit Balken/Säulen gut vergleichen; Linien ohne Verlauf sind meist weniger passend.'
  },
  {
    type: 'mc',
    q: 'Ein Diagramm zeigt Umsätze mit y-Achse von 48\u00a0000 bis 52\u00a0000 €. Was ist kritisch?',
    opts: [
      'Nichts — so sieht man Details besser, immer erlaubt ohne Hinweis',
      'Die Achse beginnt nicht bei 0 — Schwankungen wirken übertrieben',
      'Umsätze dürfen nie als Linie gezeigt werden',
      'Man muss immer ein Kreisdiagramm wählen'
    ],
    correct: 1,
    explain:
      'Abgeschnittene Achsen können Unterschiede optisch dramatisch vergrößern — immer kritisch prüfen und im Text ansprechen.'
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
  fqAnswers = finalQuizData.map(function (q) {
    return q.type === 'match' ? new Array(q.left.length).fill(-1) : -1;
  });
  showFinalQuestion(0);
}

function fqMatchChange(leftIdx, rightIdx) {
  var idx = currentFQ;
  var q = finalQuizData[idx];
  if (!q || q.type !== 'match') return;
  if (!Array.isArray(fqAnswers[idx])) fqAnswers[idx] = new Array(q.left.length).fill(-1);
  fqAnswers[idx][leftIdx] = parseInt(rightIdx, 10);
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

  if (q.type === 'match') {
    html += '<div class="sg-match-list">';
    q.left.forEach(function (left, i) {
      var cur = Array.isArray(fqAnswers[idx]) ? fqAnswers[idx][i] : -1;
      html += '<div class="sg-match-row"><label>' + left + '</label><select onchange="fqMatchChange(' + i + ', this.value)">';
      html += '<option value="-1">— wählen —</option>';
      q.right.forEach(function (r, ri) {
        html +=
          '<option value="' +
          ri +
          '"' +
          (cur === ri ? ' selected' : '') +
          '>' +
          r +
          '</option>';
      });
      html += '</select></div>';
    });
    html += '</div>';
  } else {
    q.opts.forEach(function (opt, i) {
      var sel = fqAnswers[idx] === i ? ' selected' : '';
      html +=
        '<div class="quiz-option' + sel + '" onclick="selectFQ(' + i + ')">' + opt + '</div>';
    });
  }

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

function isFqCorrect(i) {
  var q = finalQuizData[i];
  var ans = fqAnswers[i];
  if (q.type === 'match') {
    if (!Array.isArray(ans)) return false;
    return q.correct.every(function (c, j) {
      return ans[j] === c;
    });
  }
  return ans === q.correct;
}

function evaluateFinalQuiz() {
  var score = 0;
  finalQuizData.forEach(function (q, i) {
    var dot = document.getElementById('fqDot' + i);
    var ok = isFqCorrect(i);
    if (ok) {
      score++;
      dot.classList.add('correct-dot');
    } else {
      dot.classList.add('wrong-dot');
    }
  });

  var html = '';
  finalQuizData.forEach(function (q, i) {
    var isCorrect = isFqCorrect(i);
    html +=
      '<div class="info-box ' +
      (isCorrect ? 'success' : 'danger') +
      '" style="margin:8px 0;">';
    html +=
      '<div class="icon">' + (isCorrect ? '\u2705' : '\u274c') + '</div><div>';
    html += '<strong>Frage ' + (i + 1) + ':</strong> ' + q.explain;
    if (!isCorrect && q.type !== 'match' && fqAnswers[i] >= 0) {
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
    msg = 'Ausgezeichnet — du kannst Datentypen, Häufigkeiten und Grafikwahl gut einordnen!';
    badges = '<span class="earned-badge gold">Gold \u2014 Deskriptive Grundlagen</span>';
  } else if (pct >= 70) {
    msg = 'Sehr gut! Die markierten Fragen einmal kurz wiederholen.';
    badges = '<span class="earned-badge silver">Silber \u2014 solider Stand</span>';
  } else {
    msg =
      'Wiederhole Skalenniveaus, relative Häufigkeit und wann Balken/Kreis/Linie sinnvoll sind.';
    badges = '<span class="earned-badge bronze">Bronze \u2014 weiter üben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;

  if (score >= 6) markComplete(8);

  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise().catch(function () {});
}

function resetFinalQuiz() {
  fqAnswers = finalQuizData.map(function (q) {
    return q.type === 'match' ? new Array(q.left.length).fill(-1) : -1;
  });
  document.getElementById('finalResult').style.display = 'none';
  document.querySelectorAll('.quiz-step-dot').forEach(function (d) {
    d.classList.remove('correct-dot', 'wrong-dot');
  });
  showFinalQuestion(0);
}

document.addEventListener('DOMContentLoaded', function () {
  updateProgress();
  initScaleSorter();
  renderSurveyUI();
  buildFinalQuiz();
});
