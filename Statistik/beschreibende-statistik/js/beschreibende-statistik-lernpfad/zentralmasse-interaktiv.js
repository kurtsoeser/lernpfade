/**
 * Interaktive Zentralmaße (arithm. Mittel, Median, Modus, geom. Mittel)
 * für Lernpfad Beschreibende Statistik — Tab „Zentralmaße“.
 */
(function () {
  'use strict';

  var MIN_N = 2;
  var MAX_N = 10;

  function parseNumLocal(str) {
    if (str === null || str === undefined) return NaN;
    return parseFloat(String(str).replace(',', '.').trim());
  }

  function fmtDe(x, digits) {
    if (x === null || x === undefined || (typeof x === 'number' && (isNaN(x) || !isFinite(x)))) {
      return '—';
    }
    var d = digits !== undefined ? digits : 4;
    return Number(x).toLocaleString('de-AT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: d
    });
  }

  function medianOf(sortedCopy) {
    var a = sortedCopy;
    var n = a.length;
    if (n === 0) return NaN;
    var mid = Math.floor(n / 2);
    return n % 2 === 1 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  }

  function computeModes(values) {
    var n = values.length;
    if (n === 0) return { kind: 'empty', label: '—', detail: '' };
    var freq = {};
    for (var i = 0; i < n; i++) {
      var x = values[i];
      var key = String(x);
      freq[key] = (freq[key] || 0) + 1;
    }
    var maxf = 0;
    for (var k in freq) {
      if (freq.hasOwnProperty(k) && freq[k] > maxf) maxf = freq[k];
    }
    if (maxf === 1 && n > 1) {
      return {
        kind: 'none',
        label: 'kein ausgezeichneter Modus',
        detail: 'Jede Ausprägung kommt gleich oft vor (je 1×).'
      };
    }
    var modes = [];
    for (var k2 in freq) {
      if (freq.hasOwnProperty(k2) && freq[k2] === maxf) modes.push(parseFloat(k2));
    }
    modes.sort(function (a, b) {
      return a - b;
    });
    return {
      kind: 'list',
      values: modes,
      maxf: maxf,
      label: modes.length === 1 ? fmtDe(modes[0], 4) : modes.map(function (v) {
        return fmtDe(v, 4);
      }).join(' · '),
      detail: modes.length === 1 ? 'Häufigkeit: ' + maxf + '×' : 'Mehrere Modi (je ' + maxf + '×)'
    };
  }

  function geomMean(values) {
    for (var i = 0; i < values.length; i++) {
      if (!(values[i] > 0) || isNaN(values[i])) return null;
    }
    if (values.length === 0) return null;
    var s = 0;
    for (var j = 0; j < values.length; j++) s += Math.log(values[j]);
    return Math.exp(s / values.length);
  }

  function buildState(inputs) {
    var raw = [];
    for (var i = 0; i < inputs.length; i++) {
      raw.push(parseNumLocal(inputs[i].value));
    }
    var valid = raw.every(function (v) {
      return !isNaN(v) && isFinite(v);
    });
    if (!valid || raw.length < MIN_N) {
      return { ok: false, values: raw };
    }
    var sorted = raw.slice().sort(function (a, b) {
      return a - b;
    });
    var n = sorted.length;
    var sum = 0;
    for (var k = 0; k < n; k++) sum += sorted[k];
    var mean = sum / n;
    var med = medianOf(sorted);
    var modeInfo = computeModes(raw);
    var gm = geomMean(sorted);

    return {
      ok: true,
      values: raw,
      sorted: sorted,
      n: n,
      mean: mean,
      median: med,
      modeInfo: modeInfo,
      geom: gm
    };
  }

  function xScale(v, minX, maxX, padL, plotW) {
    if (maxX <= minX) return padL + plotW / 2;
    return padL + ((v - minX) / (maxX - minX)) * plotW;
  }

  function renderChart(svg, st) {
    var W = 520;
    var H = 120;
    var padL = 28;
    var padR = 18;
    var padT = 14;
    var padB = 28;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    var baseY = padT + plotH * 0.62;

    var vals = st.sorted;
    var minV = Math.min.apply(null, vals);
    var maxV = Math.max.apply(null, vals);
    var extras = [st.mean, st.median];
    if (st.geom !== null) extras.push(st.geom);
    if (st.modeInfo.kind === 'list') {
      for (var m = 0; m < st.modeInfo.values.length; m++) extras.push(st.modeInfo.values[m]);
    }
    var minX = Math.min(minV, Math.min.apply(null, extras));
    var maxX = Math.max(maxV, Math.max.apply(null, extras));
    if (minX === maxX) {
      minX -= 1;
      maxX += 1;
    }
    var span = maxX - minX;
    minX -= span * 0.08;
    maxX += span * 0.08;

    var parts = [];
    parts.push(
      '<svg viewBox="0 0 ' +
        W +
        ' ' +
        H +
        '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    );
    parts.push(
      '<line x1="' +
        padL +
        '" y1="' +
        baseY +
        '" x2="' +
        (W - padR) +
        '" y2="' +
        baseY +
        '" stroke="#cfd8e3" stroke-width="2"/>'
    );

    function markLine(xv, color, dash, sw) {
      var x = xScale(xv, minX, maxX, padL, plotW);
      var y1 = padT + 6;
      var y2 = baseY - 4;
      var dashAttr = dash ? ' stroke-dasharray="' + dash + '"' : '';
      parts.push(
        '<line x1="' +
          x +
          '" y1="' +
          y1 +
          '" x2="' +
          x +
          '" y2="' +
          y2 +
          '" stroke="' +
          color +
          '" stroke-width="' +
          (sw || 2.5) +
          '"' +
          dashAttr +
          '/>'
      );
    }

    markLine(st.mean, '#3B82C4', 'none', 2.5);
    markLine(st.median, '#27AE60', '6 4', 2.5);
    if (st.geom !== null) markLine(st.geom, '#8e44ad', '4 3', 2);
    if (st.modeInfo.kind === 'list') {
      for (var i = 0; i < st.modeInfo.values.length; i++) {
        markLine(st.modeInfo.values[i], '#F39C12', '2 2', 2);
      }
    }

    for (var j = 0; j < st.values.length; j++) {
      var vx = st.values[j];
      var px = xScale(vx, minX, maxX, padL, plotW);
      parts.push(
        '<circle cx="' +
          px +
          '" cy="' +
          (baseY + 10) +
          '" r="6" fill="#2563A0" stroke="#fff" stroke-width="2"/>'
      );
    }

    parts.push(
      '<text x="' +
        padL +
        '" y="' +
        (H - 6) +
        '" font-size="11" fill="#5D6D7E" font-family="Nunito,sans-serif">' +
        fmtDe(minX, 3) +
        '</text>'
    );
    parts.push(
      '<text x="' +
        (W - padR) +
        '" y="' +
        (H - 6) +
        '" font-size="11" fill="#5D6D7E" font-family="Nunito,sans-serif" text-anchor="end">' +
        fmtDe(maxX, 3) +
        '</text>'
    );
    parts.push('</svg>');
    svg.innerHTML = parts.join('');
  }

  function update(root) {
    var inputs = root.querySelectorAll('.zm-value-input');
    var arr = [];
    for (var i = 0; i < inputs.length; i++) arr.push(inputs[i]);

    var st = buildState(arr);
    var elMean = root.querySelector('[data-zm-mean]');
    var elMed = root.querySelector('[data-zm-median]');
    var elMode = root.querySelector('[data-zm-mode]');
    var elModeSub = root.querySelector('[data-zm-mode-sub]');
    var elGeom = root.querySelector('[data-zm-geom]');
    var elGeomSub = root.querySelector('[data-zm-geom-sub]');
    var svg = root.querySelector('[data-zm-chart]');

    if (!st.ok) {
      if (elMean) elMean.textContent = '—';
      if (elMed) elMed.textContent = '—';
      if (elMode) elMode.textContent = '—';
      if (elModeSub) elModeSub.textContent = 'Bitte gültige Zahlen eingeben (mind. ' + MIN_N + ' Werte).';
      if (elGeom) elGeom.textContent = '—';
      if (elGeomSub) elGeomSub.textContent = '';
      if (svg) svg.innerHTML = '';
      return;
    }

    if (elMean) elMean.textContent = fmtDe(st.mean, 4);
    if (elMed) elMed.textContent = fmtDe(st.median, 4);
    if (elMode) elMode.textContent = st.modeInfo.label;
    if (elModeSub) elModeSub.textContent = st.modeInfo.detail || '';

    var geomCard = root.querySelector('.zm-stat-geom');
    if (st.geom === null) {
      if (elGeom) elGeom.textContent = '—';
      if (elGeomSub)
        elGeomSub.textContent =
          'Nur definiert, wenn alle Werte > 0 sind (multiplikative Interpretation).';
      if (geomCard) geomCard.classList.add('zm-stat-warn');
    } else {
      if (elGeom) elGeom.textContent = fmtDe(st.geom, 4);
      if (elGeomSub) elGeomSub.textContent = 'n-te Wurzel aus dem Produkt aller Werte';
      if (geomCard) geomCard.classList.remove('zm-stat-warn');
    }

    if (svg) renderChart(svg, st);
  }

  function renderInputs(root, values) {
    var grid = root.querySelector('[data-zm-grid]');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i = 0; i < values.length; i++) {
      var cell = document.createElement('div');
      cell.className = 'zm-data-cell';
      var lab = document.createElement('label');
      lab.setAttribute('for', 'zm_v_' + i);
      lab.textContent = 'x' + (i + 1);
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'decimal';
      inp.className = 'zm-value-input';
      inp.id = 'zm_v_' + i;
      inp.value = String(values[i]).replace('.', ',');
      inp.addEventListener('input', function () {
        update(root);
      });
      cell.appendChild(lab);
      cell.appendChild(inp);
      grid.appendChild(cell);
    }
    update(root);
  }

  function init() {
    var root = document.getElementById('bsZentralmasseApp');
    if (!root) return;

    var defaultVals = [10, 12, 14, 16, 18];
    renderInputs(root, defaultVals);

    root.querySelector('[data-zm-preset-standard]') &&
      root.querySelector('[data-zm-preset-standard]').addEventListener('click', function () {
        renderInputs(root, [10, 12, 14, 16, 18]);
      });
    root.querySelector('[data-zm-preset-outlier]') &&
      root.querySelector('[data-zm-preset-outlier]').addEventListener('click', function () {
        renderInputs(root, [10, 11, 12, 13, 50]);
      });
    root.querySelector('[data-zm-preset-factors]') &&
      root.querySelector('[data-zm-preset-factors]').addEventListener('click', function () {
        renderInputs(root, [1.1, 1.2, 0.9]);
      });

    root.querySelector('[data-zm-add]') &&
      root.querySelector('[data-zm-add]').addEventListener('click', function () {
        var inputs = root.querySelectorAll('.zm-value-input');
        if (inputs.length >= MAX_N) return;
        var vals = [];
        for (var i = 0; i < inputs.length; i++) {
          var v = parseNumLocal(inputs[i].value);
          vals.push(isNaN(v) ? 0 : v);
        }
        var last = vals.length ? vals[vals.length - 1] : 0;
        vals.push(last);
        renderInputs(root, vals);
      });

    root.querySelector('[data-zm-remove]') &&
      root.querySelector('[data-zm-remove]').addEventListener('click', function () {
        var inputs = root.querySelectorAll('.zm-value-input');
        if (inputs.length <= MIN_N) return;
        var vals = [];
        for (var j = 0; j < inputs.length - 1; j++) {
          var v2 = parseNumLocal(inputs[j].value);
          vals.push(isNaN(v2) ? 0 : v2);
        }
        renderInputs(root, vals);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
