/**
 * Lernpfad: Kosten- und Preistheorie (Semester 6)
 */
var TOTAL_SECTIONS = 9;
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

  completedSections.add(idx + 1);
  updateProgress();

  if (window.MathJax && MathJax.typesetPromise) {
    var panel = document.getElementById('panel' + idx);
    if (panel) MathJax.typesetPromise([panel]).catch(function () {});
  }

  if (idx === 1) {
    window.requestAnimationFrame(function () {
      drawKostenVerlaufApplet();
      drawMiniKvCanvases();
      drawKpLeitGraphCanvas();
    });
  }

  if (idx === 2) {
    window.requestAnimationFrame(function () {
      kpGkSyncSliderLabel();
      drawKpGkTangentApplet();
      drawKpStueckGraphCanvas();
    });
  }

  if (idx === 3) {
    window.requestAnimationFrame(function () {
      kpMarktSyncSliderLabels();
      drawKpMarktPreisApplet();
    });
  }

  if (idx === 4) {
    window.requestAnimationFrame(function () {
      var iframe = document.getElementById('ggbKegIframe');
      var url = iframe && iframe.getAttribute('data-ggb-src');
      if (iframe && url && !iframe.getAttribute('src')) iframe.setAttribute('src', url);
    });
  }

  if (idx === 6) {
    window.requestAnimationFrame(function () {
      var iframe = document.getElementById('ggbKostenIframe');
      var url = iframe && iframe.getAttribute('data-ggb-src');
      if (iframe && url && !iframe.getAttribute('src')) iframe.setAttribute('src', url);
    });
  }
}

function updateProgress() {
  var pct = Math.round((completedSections.size / TOTAL_SECTIONS) * 100);
  if (pct > 100) pct = 100;
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

/** Schritt 3: interaktive Kostenverläufe + Mini-Graphen für Quiz */
var kvAppletType = 3;

function kvTypeToShape(t) {
  var map = ['linear', 'degressiv', 'progressiv', 'erg'];
  return map[t] || 'erg';
}

function KvShapeCost(shape, x) {
  switch (shape) {
    case 'linear':
      return 40 + 14 * x;
    case 'degressiv':
      return 40 + 34 * Math.sqrt(x);
    case 'progressiv':
      return 40 + 3.5 * x + 1.35 * x * x;
    case 'erg':
      return 40 + 0.12 * x * x * x - 1.85 * x * x + 17 * x;
    case 'falling':
      return 195 - 14 * x;
    default:
      return 40 + 14 * x;
  }
}

function setKvAppletType(t) {
  kvAppletType = t;
  document.querySelectorAll('.kv-type-btn').forEach(function (b) {
    var bt = parseInt(b.getAttribute('data-kv-t'), 10);
    b.classList.toggle('active', bt === t);
  });
  drawKostenVerlaufApplet();
}

function sampleKvRange(shape, xmax) {
  var ymin = Infinity;
  var ymax = -Infinity;
  for (var x = 0; x <= xmax; x += 0.15) {
    var y = KvShapeCost(shape, x);
    if (!isFinite(y)) continue;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }
  if (!isFinite(ymin) || !isFinite(ymax)) {
    ymin = 0;
    ymax = 200;
  }
  var pad = (ymax - ymin) * 0.12 + 6;
  ymin -= pad;
  ymax += pad;
  return { ymin: ymin, ymax: ymax };
}

function drawKvCurveInBox(ctx, w, h, padL, padR, padT, padB, xmax, shape, strokeColor, lineWidth) {
  var r = sampleKvRange(shape, xmax);
  var ymin = r.ymin;
  var ymax = r.ymax;
  function xToPx(x) {
    return padL + (x / xmax) * (w - padL - padR);
  }
  function yToPx(y) {
    return padT + ((ymax - y) / (ymax - ymin)) * (h - padT - padB);
  }

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), h - padB);
  ctx.lineTo(xToPx(xmax), h - padB);
  ctx.stroke();

  ctx.strokeStyle = strokeColor || '#2563EB';
  ctx.lineWidth = lineWidth || 2.6;
  ctx.beginPath();
  var started = false;
  for (var xi = 0; xi <= xmax; xi += 0.08) {
    var yy = KvShapeCost(shape, xi);
    if (!isFinite(yy)) continue;
    var px = xToPx(xi);
    var py = yToPx(yy);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '600 11px Nunito, sans-serif';
  ctx.fillText('x', w - padR - 6, h - padB + 2);
  ctx.save();
  ctx.translate(10, padT + 36);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('K', 0, 0);
  ctx.restore();
}

/** Kurzfassungs-Leitbeispiel: K(x)=0,02x³-1,2x²+30x+200, Kostenkehre bei x=20 */
function kpLeitK(x) {
  return 0.02 * x * x * x - 1.2 * x * x + 30 * x + 200;
}

function kpLeitKprime(x) {
  return 0.06 * x * x - 2.4 * x + 30;
}

function kpLeitStueck(x) {
  if (x <= 0) return NaN;
  return kpLeitK(x) / x;
}

/** Minimum von K\u0305(x)=K(x)/x auf [0.5, 48] (Betriebsoptimum des Leitbeispiels) */
function kpLeitBetriebsoptimumX() {
  var bestX = 20;
  var bestY = Infinity;
  for (var x = 0.5; x <= 48; x += 0.02) {
    var y = kpLeitStueck(x);
    if (y < bestY) {
      bestY = y;
      bestX = x;
    }
  }
  return bestX;
}

function kpFmtDe2(n) {
  if (!isFinite(n)) return '—';
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

function kpGkSyncSliderLabel() {
  var sl = document.getElementById('kpGkXSlider');
  var lab = document.getElementById('kpGkXVal');
  if (!sl || !lab) return;
  lab.textContent = kpFmtDe2(parseFloat(sl.value));
}

function kpGkSliderInput() {
  kpGkSyncSliderLabel();
  drawKpGkTangentApplet();
}

/** Schritt 3: Grenzkosten als Tangentensteigung an K (Leitbeispiel) */
function drawKpGkTangentApplet() {
  var canvas = document.getElementById('kpGkTangentCanvas');
  if (!canvas || !canvas.getContext) return;
  var slider = document.getElementById('kpGkXSlider');
  var x0 = slider ? parseFloat(slider.value) : 15;
  if (!isFinite(x0)) x0 = 15;

  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var padL = 52;
  var padR = 24;
  var padT = 22;
  var padB = 44;
  var xmax = 48;

  var ymin = Infinity;
  var ymax = -Infinity;
  for (var xs = 0; xs <= xmax; xs += 0.2) {
    var yv = kpLeitK(xs);
    if (yv < ymin) ymin = yv;
    if (yv > ymax) ymax = yv;
  }
  var pad = (ymax - ymin) * 0.08 + 10;
  ymin -= pad;
  ymax += pad;

  function xToPx(x) {
    return padL + (x / xmax) * (w - padL - padR);
  }
  function yToPx(y) {
    return padT + ((ymax - y) / (ymax - ymin)) * (h - padT - padB);
  }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#FBFCFE';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), h - padB);
  ctx.lineTo(xToPx(xmax), h - padB);
  ctx.stroke();

  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  var started = false;
  for (var xi = 0; xi <= xmax; xi += 0.1) {
    var yy = kpLeitK(xi);
    if (!isFinite(yy)) continue;
    var px = xToPx(xi);
    var py = yToPx(yy);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  var K0 = kpLeitK(x0);
  var m = kpLeitKprime(x0);
  var xSpan = 14;
  var xa = Math.max(0, x0 - xSpan);
  var xb = Math.min(xmax, x0 + xSpan);
  var ya = K0 + m * (xa - x0);
  var yb = K0 + m * (xb - x0);

  ctx.strokeStyle = '#EA580C';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(xToPx(xa), yToPx(ya));
  ctx.lineTo(xToPx(xb), yToPx(yb));
  ctx.stroke();
  ctx.setLineDash([]);

  var px0 = xToPx(x0);
  var py0 = yToPx(K0);
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(px0, py0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '600 11px Nunito, sans-serif';
  ctx.fillText('x (ME)', w - padR - 8, h - padB + 4);
  ctx.save();
  ctx.translate(14, padT + 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('K (GE)', 0, 0);
  ctx.restore();

  ctx.fillStyle = '#C2410C';
  ctx.font = '700 11px Nunito, system-ui, sans-serif';
  ctx.fillText('Tangente (Steigung = K′)', padL + 4, padT + 14);

  var hint = document.getElementById('kpGkTangentHint');
  if (hint) {
    hint.textContent =
      'Bei x = ' +
      kpFmtDe2(x0) +
      ' ME: Grenzkosten K′(x) ≈ ' +
      kpFmtDe2(m) +
      ' GE/ME — das ist die Steigung der orangen Tangente. K(x) ≈ ' +
      kpFmtDe2(K0) +
      ' GE.';
  }
}

/** Schritt 3: Graph der Stückkosten K\u0305(x)=K(x)/x (Leitbeispiel) */
function drawKpStueckGraphCanvas() {
  var canvas = document.getElementById('kpStueckGraphCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var padL = 52;
  var padR = 24;
  var padT = 22;
  var padB = 44;
  var xmax = 48;
  var xStart = 0.8;

  var ymin = Infinity;
  var ymax = -Infinity;
  for (var xs = xStart; xs <= xmax; xs += 0.08) {
    var yv = kpLeitStueck(xs);
    if (!isFinite(yv)) continue;
    if (yv < ymin) ymin = yv;
    if (yv > ymax) ymax = yv;
  }
  if (!isFinite(ymin) || !isFinite(ymax)) return;
  var vpad = (ymax - ymin) * 0.1 + 4;
  ymin -= vpad;
  ymax += vpad;

  var xOpt = kpLeitBetriebsoptimumX();

  function xToPx(x) {
    return padL + (x / xmax) * (w - padL - padR);
  }
  function yToPx(y) {
    return padT + ((ymax - y) / (ymax - ymin)) * (h - padT - padB);
  }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#FBFCFE';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), h - padB);
  ctx.lineTo(xToPx(xmax), h - padB);
  ctx.stroke();

  ctx.strokeStyle = '#CBD5E1';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xToPx(xOpt), padT);
  ctx.lineTo(xToPx(xOpt), h - padB);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#7C3AED';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  var st = false;
  for (var xi = xStart; xi <= xmax; xi += 0.06) {
    var yy = kpLeitStueck(xi);
    if (!isFinite(yy)) continue;
    var px = xToPx(xi);
    var py = yToPx(yy);
    if (!st) {
      ctx.moveTo(px, py);
      st = true;
    } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  var pyOpt = yToPx(kpLeitStueck(xOpt));
  var pxOpt = xToPx(xOpt);
  ctx.fillStyle = '#7C3AED';
  ctx.beginPath();
  ctx.arc(pxOpt, pyOpt, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#5B21B6';
  ctx.font = '700 11px Nunito, system-ui, sans-serif';
  var lx = pxOpt + 10;
  if (lx + 150 > w - padR) lx = pxOpt - 150;
  ctx.fillText('Betriebsoptimum (min. K\u0305)', lx, pyOpt - 8);
  ctx.font = '600 10px Nunito, system-ui, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('x ≈ ' + kpFmtDe2(xOpt) + ' ME', lx, pyOpt + 8);

  ctx.fillStyle = '#475569';
  ctx.font = '600 11px Nunito, sans-serif';
  ctx.fillText('x (ME)', w - padR - 8, h - padB + 4);
  ctx.save();
  ctx.translate(14, padT + 44);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('K\u0305 (GE/ME)', 0, 0);
  ctx.restore();

  var hint = document.getElementById('kpStueckGraphHint');
  if (hint) {
    var kbar = kpLeitStueck(xOpt);
    hint.textContent =
      'Violett: Stückkosten K\u0305(x)=K(x)/x zum Leitbeispiel K(x)=0,02x³−1,2x²+30x+200. Minimum bei x ≈ ' +
      kpFmtDe2(xOpt) +
      ' ME (langfristige PUG ≈ ' +
      kpFmtDe2(kbar) +
      ' GE/ME); dort gilt K′(x)=K\u0305(x).';
  }
}

function kpMarktPN(a, b, x) {
  return a - b * x;
}

function kpMarktPA(c, d, x) {
  return c + d * x;
}

function kpMarktGetParams() {
  function gv(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback;
    var v = parseFloat(el.value);
    return isFinite(v) ? v : fallback;
  }
  return {
    a: gv('kpMarktA', 100),
    b: Math.max(0.01, gv('kpMarktB', 2)),
    c: gv('kpMarktC', 10),
    d: Math.max(0.01, gv('kpMarktD', 1))
  };
}

function kpMarktEquilibrium(pr) {
  var denom = pr.b + pr.d;
  if (denom <= 0) return null;
  var xStar = (pr.a - pr.c) / denom;
  var pStar = pr.a - pr.b * xStar;
  return { x: xStar, p: pStar };
}

function kpMarktSyncSliderLabels() {
  var pr = kpMarktGetParams();
  var map = [
    ['kpMarktAVal', pr.a],
    ['kpMarktBVal', pr.b],
    ['kpMarktCVal', pr.c],
    ['kpMarktDVal', pr.d]
  ];
  map.forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (el) el.textContent = kpFmtDe2(pair[1]);
  });
}

function kpMarktSliderInput() {
  kpMarktSyncSliderLabels();
  drawKpMarktPreisApplet();
}

/** Schritt 4 (Preis & Markt): Nachfrage- und Angebots-Preisfunktion im p-x-Diagramm */
function drawKpMarktPreisApplet() {
  var canvas = document.getElementById('kpMarktPreisCanvas');
  if (!canvas || !canvas.getContext) return;
  var pr = kpMarktGetParams();
  var eq = kpMarktEquilibrium(pr);
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var padL = 54;
  var padR = 22;
  var padT = 28;
  var padB = 46;

  var xSat = pr.b > 0 ? pr.a / pr.b : 80;
  var xGuess = eq && isFinite(eq.x) ? eq.x : 30;
  var xmax = Math.min(95, Math.max(28, xSat * 1.08, Math.abs(xGuess) * 1.5 + 8));
  if (eq && eq.x > 0) xmax = Math.max(xmax, eq.x * 1.35);

  var ymax = Math.max(pr.a, pr.c, 18);
  for (var xt = 0; xt <= xmax; xt += xmax / 40) {
    var pa = kpMarktPA(pr.c, pr.d, xt);
    var pn = kpMarktPN(pr.a, pr.b, xt);
    if (pa > ymax) ymax = pa;
    if (pn > ymax) ymax = pn;
  }
  ymax += (ymax - 0) * 0.12 + 6;
  var ymin = 0;

  function xToPx(x) {
    return padL + (x / xmax) * (w - padL - padR);
  }
  function yToPx(y) {
    return padT + ((ymax - y) / (ymax - ymin)) * (h - padT - padB);
  }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#FBFCFE';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xToPx(0), h - padB);
  ctx.lineTo(xToPx(xmax), h - padB);
  ctx.moveTo(xToPx(0), padT);
  ctx.lineTo(xToPx(0), h - padB);
  ctx.stroke();

  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  var stN = false;
  for (var xi = 0; xi <= xmax; xi += 0.25) {
    var yn = kpMarktPN(pr.a, pr.b, xi);
    if (yn < ymin) continue;
    var px = xToPx(xi);
    var py = yToPx(yn);
    if (!stN) {
      ctx.moveTo(px, py);
      stN = true;
    } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.strokeStyle = '#C2410C';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  var stA = false;
  for (var xj = 0; xj <= xmax; xj += 0.25) {
    var ya = kpMarktPA(pr.c, pr.d, xj);
    var pxx = xToPx(xj);
    var pyy = yToPx(ya);
    if (!stA) {
      ctx.moveTo(pxx, pyy);
      stA = true;
    } else ctx.lineTo(pxx, pyy);
  }
  ctx.stroke();

  var okEq =
    eq &&
    isFinite(eq.x) &&
    isFinite(eq.p) &&
    eq.x >= 0 &&
    eq.x <= xmax &&
    eq.p >= ymin;

  if (okEq) {
    var pxE = xToPx(eq.x);
    var pyE = yToPx(eq.p);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pxE, pyE);
    ctx.lineTo(pxE, h - padB);
    ctx.moveTo(pxE, pyE);
    ctx.lineTo(padL, pyE);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#B91C1C';
    ctx.beginPath();
    ctx.arc(pxE, pyE, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#991B1B';
    ctx.font = '700 11px Nunito, system-ui, sans-serif';
    var tx = pxE + 10;
    if (tx + 140 > w - padR) tx = pxE - 150;
    ctx.fillText('Gleichgewicht', tx, pyE - 10);
    ctx.font = '600 10px Nunito, system-ui, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('x* ≈ ' + kpFmtDe2(eq.x) + ', p* ≈ ' + kpFmtDe2(eq.p), tx, pyE + 6);
  }

  ctx.fillStyle = '#475569';
  ctx.font = '600 11px Nunito, sans-serif';
  ctx.fillText('x (ME)', w - padR - 8, h - padB + 4);
  ctx.save();
  ctx.translate(16, padT + 48);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('p (GE/ME)', 0, 0);
  ctx.restore();

  ctx.font = '600 10px Nunito, system-ui, sans-serif';
  ctx.fillStyle = '#1D4ED8';
  ctx.fillText('p_N', w - padR - 88, padT + 14);
  ctx.fillStyle = '#C2410C';
  ctx.fillText('p_A', w - padR - 48, padT + 14);

  var hint = document.getElementById('kpMarktPreisHint');
  if (hint) {
    if (!eq || !isFinite(eq.x)) {
      hint.textContent = 'Parameter prüfen (b und d müssen positiv sein).';
    } else if (eq.x < 0) {
      hint.textContent =
        'Für diese Zahlen liegt der Schnittpunkt bei negativer Menge (ökonomisch kein Gleichgewicht im ersten Quadranten). Erhöhe a oder senke c / d.';
    } else if (eq.p < 0) {
      hint.textContent =
        'Gleichgewichtspreis wäre negativ — Modellgrenze. Wähle größeres a oder kleineres b.';
    } else {
      var xs = pr.b > 0 ? pr.a / pr.b : 0;
      hint.textContent =
        'Nachfrage: p_N(x)=' +
        kpFmtDe2(pr.a) +
        '−' +
        kpFmtDe2(pr.b) +
        '·x. Angebot: p_A(x)=' +
        kpFmtDe2(pr.c) +
        '+' +
        kpFmtDe2(pr.d) +
        '·x. Höchstpreis p_N(0)=' +
        kpFmtDe2(pr.a) +
        ' GE/ME; Sättigungsmenge (p_N=0): x=' +
        kpFmtDe2(xs) +
        ' ME. Gleichgewicht: x*=' +
        kpFmtDe2(eq.x) +
        ', p*=' +
        kpFmtDe2(eq.p) +
        ' GE/ME.';
    }
  }
}

function drawKpLeitGraphCanvas() {
  var canvas = document.getElementById('kpLeitGraphCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var padL = 52;
  var padR = 24;
  var padT = 22;
  var padB = 44;
  var xmax = 48;
  var xw = 20;
  var ymin = Infinity;
  var ymax = -Infinity;
  for (var xs = 0; xs <= xmax; xs += 0.2) {
    var yv = kpLeitK(xs);
    if (yv < ymin) ymin = yv;
    if (yv > ymax) ymax = yv;
  }
  var pad = (ymax - ymin) * 0.08 + 10;
  ymin -= pad;
  ymax += pad;

  function xToPx(x) {
    return padL + (x / xmax) * (w - padL - padR);
  }
  function yToPx(y) {
    return padT + ((ymax - y) / (ymax - ymin)) * (h - padT - padB);
  }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#FBFCFE';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xToPx(xw), h - padB);
  ctx.lineTo(xToPx(xw), padT);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#94A3B8';
  ctx.beginPath();
  ctx.moveTo(xToPx(0), h - padB);
  ctx.lineTo(xToPx(xmax), h - padB);
  ctx.stroke();

  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  var started = false;
  for (var xi = 0; xi <= xmax; xi += 0.12) {
    var yy = kpLeitK(xi);
    if (!isFinite(yy)) continue;
    var px = xToPx(xi);
    var py = yToPx(yy);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  var pxW = xToPx(xw);
  var pyW = yToPx(kpLeitK(xw));
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(pxW, pyW, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#991B1B';
  ctx.font = '700 12px Nunito, system-ui, sans-serif';
  var lx = pxW + 12;
  if (lx + 120 > w - padR) lx = pxW - 130;
  ctx.fillText('Kostenkehre', lx, pyW - 10);
  ctx.font = '600 11px Nunito, system-ui, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('(x = 20)', lx, pyW + 6);

  ctx.fillStyle = '#475569';
  ctx.font = '600 11px Nunito, sans-serif';
  ctx.fillText('x (ME)', w - padR - 8, h - padB + 4);
  ctx.save();
  ctx.translate(14, padT + 40);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('K (GE)', 0, 0);
  ctx.restore();

  var hint = document.getElementById('kpLeitGraphHint');
  if (hint) {
    hint.textContent =
      'Markiert: Wendepunkt bei x = 20 ME, K(20) \u2248 480 GE. Dort ist K\u2032\u2032(20) = 0; die Grenzkosten betragen K\u2032(20) = 6 GE/ME (N\u00e4herung f\u00fcr die n\u00e4chste Einheit).';
  }
}

function drawKostenVerlaufApplet() {
  var canvas = document.getElementById('kostenVerlaufCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var padL = 48;
  var padR = 20;
  var padT = 16;
  var padB = 40;
  var xmax = 16;
  var shape = kvTypeToShape(kvAppletType);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#FBFCFE';
  ctx.fillRect(0, 0, w, h);

  drawKvCurveInBox(ctx, w, h, padL, padR, padT, padB, xmax, shape, '#1D4ED8', 2.8);

  var hint = document.getElementById('kvAppletHint');
  if (hint) {
    var texts = [
      'Linear: Grenzkosten K′ sind konstant (gerade Linie), K″ = 0.',
      'Degressiv: K′ werden kleiner (flachere Tangente), typisch K″ < 0.',
      'Progressiv: K′ wachsen (steilere Tangente), typisch K″ > 0.',
      'Ertragsgesetzlich: zuerst K″ < 0, an der Kostenkehre Wechsel zu K″ > 0 (S-Form, Wendepunkt).'
    ];
    hint.textContent = texts[kvAppletType] || texts[3];
  }
}

function drawMiniKvCanvases() {
  document.querySelectorAll('#panel1 canvas[data-kv-shape]').forEach(function (cv) {
    var sh = cv.getAttribute('data-kv-shape');
    if (!sh || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var w = cv.width;
    var h = cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, w, h);
    drawKvCurveInBox(ctx, w, h, 10, 8, 6, 14, 10, sh, '#2563EB', 2.2);
  });
}

function checkKvExercise() {
  var v = parseNum(document.getElementById('kp_kv_input').value);
  var fb = document.getElementById('fb_kp_kv');
  if (approxEq(v, 200, 1)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Richtig: \\(K(10)=500\\), \\(K_v(10)=K(10)-K(0)=500-300\\).';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Tipp: \\(K_v(x)=K(x)-K(0)\\). Setze \\(x=10\\) ein und rechne \\(K(10)\\) und \\(K(0)\\).';
  }
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
}

function checkBoExercise() {
  var v = parseNum(document.getElementById('kp_bo_input').value);
  var fb = document.getElementById('fb_kp_bo');
  if (approxEq(v, 10, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Richtig: \\(K\'\'(x)=0.6x-6=0 \\Rightarrow x=10\\).';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Wendepunkt: \\(K\'\'(x)=0\\) lösen (hier \\(K(x)=0.1x^3-3x^2+40x+300\\)).';
  }
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
}

function checkErlösExercise() {
  var a = parseNum(document.getElementById('kp_a').value);
  var b = parseNum(document.getElementById('kp_b').value);
  var c = parseNum(document.getElementById('kp_c').value);
  var fb = document.getElementById('fb_kp_erl');
  if (approxEq(a, 2, 0.02) && approxEq(b, -100, 0.5) && approxEq(c, 1900, 2)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Richtig: \\(E(x)=G(x)+K(x)\\) und Terme zusammenfassen.';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Addiere \\(G\\) und \\(K\\) und fasse gleiche Potenzen zusammen.';
  }
}

function checkGewinnStückExercise() {
  var v = parseNum(document.getElementById('kp_gewst').value);
  var fb = document.getElementById('fb_kp_gewst');
  if (approxEq(v, 2, 0.05)) {
    fb.className = 'feedback correct';
    fb.style.display = 'block';
    fb.textContent =
      '\u2705 Richtig: Max. bei \\(x=15\\), \\(G(15)=3000\\) GE; Stückzahl \\(=15\\cdot10\\,000\\); Euro \\(=3000\\cdot100\\).';
  } else {
    fb.className = 'feedback incorrect';
    fb.style.display = 'block';
    fb.textContent =
      '\u274c Schritte: \\(G\'(x)=0\\), dann Gesamtgewinn in Euro, durch Stückzahl teilen.';
  }
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([fb]).catch(function () {});
}

function fqArraysEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function fqInitAnswersArray() {
  return finalQuizData.map(function (q) {
    if (q.type === 'match') return new Array(q.left.length).fill(-1);
    return -1;
  });
}

function drawFqGraphPickCanvases() {
  document.querySelectorAll('#finalQuizContainer canvas[data-fq-shape]').forEach(function (cv) {
    var sh = cv.getAttribute('data-fq-shape');
    if (!sh || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var w = cv.width;
    var h = cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, w, h);
    drawKvCurveInBox(ctx, w, h, 10, 8, 6, 14, 10, sh, '#2563EB', 2.2);
  });
}

/** Zuordnung: Auswahl pro Zeile (links Begriff → rechts passende Bedingung) */
function fqMatchChange(leftIdx, rightIdx) {
  var idx = currentFQ;
  var q = finalQuizData[idx];
  if (q.type !== 'match') return;
  if (!Array.isArray(fqAnswers[idx])) fqAnswers[idx] = new Array(q.left.length).fill(-1);
  fqAnswers[idx][leftIdx] = parseInt(rightIdx, 10);
}
window.fqMatchChange = fqMatchChange;

var finalQuizData = [
  {
    type: 'mc',
    q: 'Die Grenzkosten \\(K\'(x)\\) beschreiben näherungsweise …',
    opts: [
      'die Kosten pro produzierter Mengeneinheit',
      'die Änderung der Gesamtkosten bei einer kleinen Erhöhung von \\(x\\)',
      'den Wendepunkt der Kostenfunktion',
      'die Fixkosten geteilt durch \\(x\\)'
    ],
    correct: 1,
    explain:
      'Grenzkosten = erste Ableitung \\(K\'\\): „Steigung“ der Gesamtkosten — Kostenzuwachs pro kleiner Mengeneinheit.'
  },
  {
    type: 'mc',
    q: 'Das Betriebsoptimum \\(x_{\\mathrm{opt}}\\) ist die Menge, an der …',
    opts: [
      'die Grenzkosten null sind',
      'die Stückkosten \\(\\overline{K}(x)\\) minimal sind (Minimum der Durchschnittskosten)',
      'die Kostenkehre liegt',
      'der Gewinn maximal ist'
    ],
    correct: 1,
    explain:
      'Betriebsoptimum: Minimum der Stückkosten; notwendig gilt dort \\(K\'(x)=\\overline{K}(x)\\) (Grenzkosten = Stückkosten).'
  },
  {
    type: 'match',
    q: 'Ordne jedem <strong>Begriff</strong> die zutreffende <strong>Beschreibung</strong> zu (jede Spalte rechts genau einmal verwenden).',
    left: ['Kostenkehre', 'Betriebsoptimum', 'Break-even (untere Gewinngrenze)'],
    right: [
      'Wendepunkt von K: Krümmungswechsel (typisch Koppel = 0)',
      'Minimum der gesamten Stückkosten \\(\\overline{K}(x)=K(x)/x\\)',
      'Erlös gleich Gesamtkosten (Gewinn null): E(x) = K(x)'
    ],
    correct: [0, 1, 2],
    explain:
      'Kostenkehre = Wendepunkt von \\(K\\); Betriebsoptimum = günstigste gesamte Stückkosten; Break-even = Erlös gleich Gesamtkosten.'
  },
  {
    type: 'graphPick',
    q: 'Grafik: Welches Diagramm zeigt einen <strong>ertragsgesetzlichen</strong> Gesamtkostenverlauf \\(K(x)\\) (S-Kurve mit Wendepunkt)?',
    shapes: ['linear', 'degressiv', 'erg', 'progressiv'],
    labels: ['A', 'B', 'C', 'D'],
    correct: 2,
    explain:
      'Ertragsgesetzlich: zuerst flacher werdendes Wachstum, dann steiler — erkennbar als S-Form mit Wendepunkt (hier Diagramm C).'
  },
  {
    type: 'mc',
    q: 'Die Gewinnzone \\([x_u,x_o]\\) kann man bestimmen durch …',
    opts: [
      '\\(K\'\'(x)=0\\)',
      '\\(G(x)=0\\) bzw. \\(E(x)=K(x)\\)',
      '\\(K(0)=0\\)',
      '\\(p\'(x)=0\\)'
    ],
    correct: 1,
    explain:
      'Gewinngrenzen: Nullstellen der Gewinnfunktion — äquivalent Schnittpunkte von Erlös und Kosten.'
  },
  {
    type: 'mc',
    q: 'Das <strong>Marktgleichgewicht</strong> (Menge \\(x^\\ast\\)) bei Preisfunktionen \\(p_N(x)\\) und \\(p_A(x)\\) bestimmt man durch …',
    opts: [
      '\\(K\'(x)=0\\)',
      '\\(p_N(x)=p_A(x)\\)',
      '\\(E\'\'(x)=0\\)',
      '\\(K(x)=x\\)'
    ],
    correct: 1,
    explain:
      'Gleichgewicht: Schnitt der Preisfunktionen, also \\(p_N(x^\\ast)=p_A(x^\\ast)\\).'
  },
  {
    type: 'match',
    q: 'Ordne den <strong>ökonomischen Begriff</strong> die passende <strong>mathematische Charakterisierung</strong> zu (Dropdowns).',
    left: [
      'inneres Gewinnmaximum',
      'Erlösmaximum von \\(E(x)=x\\cdot p(x)\\)',
      'Cournotscher Punkt (lineare Nachfrage)',
      'langfristige Preisuntergrenze'
    ],
    right: [
      'Inneres Extremum des Erlöses: erste Ableitung von E gleich 0',
      'Günstigste gesamte Stückkosten: Minimum von \\(\\overline{K}(x)\\)',
      'Grenzerlös gleich Grenzkosten: E-Ableitung gleich K-Ableitung',
      'Maximum des Erlöses auf der Nachfragekurve (Cournot, linear)'
    ],
    correct: [2, 0, 3, 1],
    explain:
      'Gewinnmaximum: \\(E\'=K\'\\); Erlösmaximum: \\(E\'=0\\); Cournot: Erlös max. auf \\(p(x)\\); langfristige PUG: Minimum der Stückkosten.'
  },
  {
    type: 'graphPick',
    q: 'Grafik: Welcher Verlauf widerspricht dem üblichen Modell für <strong>Gesamtkosten</strong> \\(K(x)\\) bei wachsender Produktion <strong>am ehesten</strong>?',
    shapes: ['linear', 'falling', 'erg', 'degressiv'],
    labels: ['A', 'B', 'C', 'D'],
    correct: 1,
    explain:
      'Gesamtkosten sollen mit \\(x\\) nicht fallen — ein fallender Verlauf (hier B) passt nicht zur Standardannahme.'
  },
  {
    type: 'mc',
    q: 'Die <strong>Bogenelastizität</strong> wird verwendet, wenn …',
    opts: [
      'nur die Kostenkehre gesucht wird',
      'ein Intervall zwischen zwei konkreten Preis-Mengen-Punkten betrachtet wird',
      'die Gewinnzone \\(G(x)\\ge 0\\) bestimmt wird',
      'das Betriebsoptimum exakt \\(x=0\\) ist'
    ],
    correct: 1,
    explain:
      'Bogenelastizität: relative Änderungen zwischen zwei Punkten — sinnvoll bei konkreter Preisänderung über ein Intervall.'
  },
  {
    type: 'mc',
    q: 'Die Deckungsbeitragsfunktion ist \\(D(x)=\\) …',
    opts: [
      '\\(K(x)-E(x)\\)',
      '\\(E(x)-K_v(x)\\) (Erlös minus variable Kosten)',
      '\\(K_v(x)-E(x)\\)',
      '\\(K\'(x)-E\'(x)\\)'
    ],
    correct: 1,
    explain:
      'Deckungsbeitrag = Erlös abzüglich variabler Kosten (was „zur Deckung“ der Fixkosten beiträgt).'
  },
  {
    type: 'mc',
    q: 'Bei einem <strong>linearen</strong> Gesamtkostenverlauf \\(K(x)=K_f+v\\,x\\) mit \\(v&gt;0\\) sind die Grenzkosten \\(K\'(x)\\) …',
    opts: [
      'gleich \\(v\\) (konstant)',
      'proportional zu \\(x\\)',
      'gleich \\(K_f\\)',
      'gleich dem Minimum von \\(\\overline{K}(x)\\)'
    ],
    correct: 0,
    explain:
      'Linear: \\(K\'(x)=v\\) — Grenzkosten = variable Stückkosten, konstant.'
  },
  {
    type: 'mc',
    q: 'Ein <strong>inneres Gewinnmaximum</strong> (glatte Funktionen, Standardannahmen) erfüllt typisch …',
    opts: [
      '\\(K\'\'(x)=0\\)',
      '\\(G\'(x)=0\\) bzw. \\(E\'(x)=K\'(x)\\)',
      '\\(E(x)=0\\)',
      '\\(K(x)=x\\)'
    ],
    correct: 1,
    explain:
      'Gewinnmaximum: \\(G\'=E\'-K\'=0\\) \\(\\Rightarrow\\) Grenzerlös = Grenzkosten.'
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
  fqAnswers = fqInitAnswersArray();
  showFinalQuestion(0);
}

function showFinalQuestion(idx) {
  currentFQ = idx;
  var q = finalQuizData[idx];
  var typ = q.type || 'mc';
  var container = document.getElementById('finalQuizContainer');
  var html = '<div class="exercise" style="animation:fadeIn 0.3s ease;">';
  html +=
    '<p style="font-weight:700; margin-bottom:12px;">Aufgabe ' +
    (idx + 1) +
    ' von ' +
    finalQuizData.length +
    '</p>';
  html += '<p>' + q.q + '</p>';

  if (typ === 'graphPick') {
    html += '<div class="quiz-options fq-graph-pick kv-graph-quiz" style="margin-top:12px;">';
    for (var gi = 0; gi < q.shapes.length; gi++) {
      var sel = fqAnswers[idx] === gi ? ' selected' : '';
      var lab = q.labels && q.labels[gi] ? q.labels[gi] : String.fromCharCode(65 + gi);
      html +=
        '<div class="quiz-option fq-graph-opt kv-graph-opt' +
        sel +
        '" data-idx="' +
        gi +
        '" onclick="selectFQ(' +
        gi +
        ')"><canvas width="132" height="84" data-fq-shape="' +
        q.shapes[gi] +
        '" aria-hidden="true"></canvas><span class="kv-graph-cap">' +
        lab +
        '</span></div>';
    }
    html += '</div>';
    html +=
      '<p class="kp-canvas-note" style="margin-top:10px;">Tipp: Wähle <strong>ein</strong> Diagramm — Achsen schematisch (\\(x\\) nach rechts, \\(K\\) nach oben).</p>';
  } else if (typ === 'match') {
    if (!Array.isArray(fqAnswers[idx])) fqAnswers[idx] = new Array(q.left.length).fill(-1);
    html += '<table class="fq-match-table" style="width:100%; max-width:640px; margin:14px auto; border-collapse:collapse;">';
    html += '<thead><tr><th style="text-align:left;padding:8px;">Begriff</th><th style="text-align:left;padding:8px;">Passt zu …</th></tr></thead><tbody>';
    for (var li = 0; li < q.left.length; li++) {
      html += '<tr style="border-top:1px solid #E8E8E8;"><td style="padding:10px 8px; vertical-align:middle;">' + q.left[li] + '</td><td style="padding:10px 8px;">';
      html +=
        '<select class="fq-match-sel" style="max-width:100%; width:100%; padding:8px 10px; border-radius:10px; border:2px solid #E8E8E8; font-size:0.9rem;" onchange="fqMatchChange(' +
        li +
        ', this.value)">';
      html += '<option value="-1"' + (fqAnswers[idx][li] < 0 ? ' selected' : '') + '>— bitte wählen —</option>';
      for (var rj = 0; rj < q.right.length; rj++) {
        html +=
          '<option value="' +
          rj +
          '"' +
          (fqAnswers[idx][li] === rj ? ' selected' : '') +
          '>(' +
          (rj + 1) +
          ') ' +
          q.right[rj] +
          '</option>';
      }
      html += '</select></td></tr>';
    }
    html += '</tbody></table>';
    html +=
      '<p class="kp-canvas-note" style="margin-top:8px;">Jede Beschreibung rechts gehört zu <strong>genau einem</strong> Begriff.</p>';
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

  if (typ === 'graphPick') {
    window.requestAnimationFrame(function () {
      drawFqGraphPickCanvases();
    });
  }

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
  function isQuestionCorrect(q, i) {
    if (q.type === 'match') {
      if (!Array.isArray(fqAnswers[i])) return false;
      if (fqAnswers[i].indexOf(-1) >= 0) return false;
      return fqArraysEqual(fqAnswers[i], q.correct);
    }
    return fqAnswers[i] === q.correct;
  }

  var score = 0;
  finalQuizData.forEach(function (q, i) {
    var dot = document.getElementById('fqDot' + i);
    if (isQuestionCorrect(q, i)) {
      score++;
      dot.classList.add('correct-dot');
    } else {
      dot.classList.add('wrong-dot');
    }
  });

  var html = '';
  finalQuizData.forEach(function (q, i) {
    var isCorrect = isQuestionCorrect(q, i);
    html +=
      '<div class="info-box ' +
      (isCorrect ? 'success' : 'danger') +
      '" style="margin:8px 0;">';
    html +=
      '<div class="icon">' + (isCorrect ? '\u2705' : '\u274c') + '</div><div>';
    html += '<strong>Aufgabe ' + (i + 1) + ':</strong> ' + q.explain;
    if (!isCorrect) {
      if (q.type === 'match' && Array.isArray(fqAnswers[i])) {
        html +=
          '<br><em>Deine Zuordnung (Indizes der gewählten Beschreibungen): ' +
          fqAnswers[i].join(', ') +
          ' — erwartet: ' +
          q.correct.join(', ') +
          '</em>';
      } else if ((q.type || 'mc') !== 'match' && fqAnswers[i] >= 0 && q.opts) {
        html += '<br><em>Deine Antwort: ' + q.opts[fqAnswers[i]] + '</em>';
      } else if ((q.type || 'mc') === 'graphPick' && fqAnswers[i] >= 0 && q.labels) {
        html +=
          '<br><em>Deine Wahl: ' +
          (q.labels[fqAnswers[i]] || String.fromCharCode(65 + fqAnswers[i])) +
          '</em>';
      }
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
    msg = 'Ausgezeichnet — Begriffe, Zusammenhänge und typische Prüfungsmuster sitzen.';
    badges = '<span class="earned-badge gold">Gold — Kosten &amp; Preis</span>';
  } else if (pct >= 71) {
    msg = 'Sehr gut! Die markierten Aufgaben kurz wiederholen.';
    badges = '<span class="earned-badge silver">Silber — solider Stand</span>';
  } else {
    msg = 'Wiederhole Stück- vs. Grenzkosten, Betriebsoptimum, Gewinnzone und Cournot.';
    badges = '<span class="earned-badge bronze">Bronze — weiter üben</span>';
  }
  document.getElementById('finalMessage').textContent = msg;
  document.getElementById('badgeContainer').innerHTML = badges;

  if (score >= 7) markComplete(9);

  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise().catch(function () {});
}

function resetFinalQuiz() {
  fqAnswers = fqInitAnswersArray();
  document.getElementById('finalResult').style.display = 'none';
  document.querySelectorAll('.quiz-step-dot').forEach(function (d) {
    d.classList.remove('correct-dot', 'wrong-dot');
  });
  showFinalQuestion(0);
}

document.addEventListener('DOMContentLoaded', function () {
  switchTab(0);
  buildFinalQuiz();

  window.requestAnimationFrame(function () {
    drawKostenVerlaufApplet();
    drawMiniKvCanvases();
    drawKpLeitGraphCanvas();
  });
});
