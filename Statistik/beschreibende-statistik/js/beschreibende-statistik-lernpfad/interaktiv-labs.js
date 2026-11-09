/**
 * Interaktive Labs — Beschreibende Statistik
 * Häufigkeiten, Streuung, Boxplot, Pearson, Lorenz/Gini, Maßwahl
 */
(function () {
  'use strict';

  function parseNum(str) {
    return parseFloat(String(str).replace(',', '.').trim());
  }

  function fmtDe(x, digits) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    return Number(x).toLocaleString('de-AT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits !== undefined ? digits : 2
    });
  }

  function mean(arr) {
    if (!arr.length) return NaN;
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
  }

  function varianceN(arr, m) {
    if (!arr.length) return NaN;
    if (m === undefined) m = mean(arr);
    var s = 0;
    for (var i = 0; i < arr.length; i++) {
      var d = arr[i] - m;
      s += d * d;
    }
    return s / arr.length;
  }

  function sdN(arr, m) {
    return Math.sqrt(varianceN(arr, m));
  }

  function rangeOf(arr) {
    if (!arr.length) return NaN;
    return Math.max.apply(null, arr) - Math.min.apply(null, arr);
  }

  function sortedCopy(arr) {
    return arr.slice().sort(function (a, b) {
      return a - b;
    });
  }

  function median(arr) {
    var a = sortedCopy(arr);
    var n = a.length;
    if (!n) return NaN;
    var mid = Math.floor(n / 2);
    return n % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  }

  /** Quartile: Methode „Hälften“ wie in vielen Schulkonventionen */
  function quartiles(arr) {
    var a = sortedCopy(arr);
    var n = a.length;
    if (!n) return { q1: NaN, q2: NaN, q3: NaN, min: NaN, max: NaN };
    var q2 = median(a);
    var lower;
    var upper;
    if (n % 2) {
      lower = a.slice(0, Math.floor(n / 2));
      upper = a.slice(Math.floor(n / 2) + 1);
    } else {
      lower = a.slice(0, n / 2);
      upper = a.slice(n / 2);
    }
    return {
      min: a[0],
      max: a[n - 1],
      q1: median(lower),
      q2: q2,
      q3: median(upper)
    };
  }

  function pearsonR(xs, ys) {
    var n = Math.min(xs.length, ys.length);
    if (n < 2) return NaN;
    var mx = mean(xs.slice(0, n));
    var my = mean(ys.slice(0, n));
    var num = 0;
    var dx = 0;
    var dy = 0;
    for (var i = 0; i < n; i++) {
      var a = xs[i] - mx;
      var b = ys[i] - my;
      num += a * b;
      dx += a * a;
      dy += b * b;
    }
    if (dx === 0 || dy === 0) return NaN;
    return num / Math.sqrt(dx * dy);
  }

  function expandFreq(values, freqs) {
    var out = [];
    for (var i = 0; i < values.length; i++) {
      var f = Math.max(0, Math.round(freqs[i]));
      for (var j = 0; j < f; j++) out.push(values[i]);
    }
    return out;
  }

  function weightedMean(values, freqs) {
    var n = 0;
    var s = 0;
    for (var i = 0; i < values.length; i++) {
      var f = freqs[i];
      if (!(f >= 0) || isNaN(values[i])) continue;
      s += values[i] * f;
      n += f;
    }
    return n ? s / n : NaN;
  }

  function markExplore(tabIdx) {
    if (typeof markComplete === 'function') markComplete(tabIdx + 1);
  }

  function showDone(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('show');
  }

  /* ========== 1) Häufigkeiten / gewichtetes Mittel ========== */
  function initFreqLab() {
    var root = document.getElementById('bsFreqLab');
    if (!root) return;

    var rows = [
      { x: 6, h: 3 },
      { x: 7, h: 16 },
      { x: 8, h: 20 },
      { x: 9, h: 10 },
      { x: 10, h: 1 }
    ];

    function renderTable() {
      var tbody = root.querySelector('[data-freq-body]');
      tbody.innerHTML = '';
      rows.forEach(function (r, i) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><input data-i="' +
          i +
          '" data-k="x" value="' +
          String(r.x).replace('.', ',') +
          '"></td>' +
          '<td><input data-i="' +
          i +
          '" data-k="h" value="' +
          r.h +
          '"></td>' +
          '<td data-prod="' +
          i +
          '">—</td>';
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('input').forEach(function (inp) {
        inp.addEventListener('input', update);
      });
    }

    function readRows() {
      root.querySelectorAll('[data-freq-body] input').forEach(function (inp) {
        var i = parseInt(inp.getAttribute('data-i'), 10);
        var k = inp.getAttribute('data-k');
        var v = parseNum(inp.value);
        if (k === 'x') rows[i].x = v;
        else rows[i].h = isNaN(v) ? 0 : v;
      });
    }

    function drawBars(values, freqs) {
      var host = root.querySelector('[data-freq-chart]');
      var maxH = Math.max.apply(null, freqs.concat([1]));
      var W = 420;
      var H = 160;
      var pad = 28;
      var plotW = W - pad * 2;
      var plotH = H - pad * 2;
      var bw = plotW / values.length;
      var parts = ['<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">'];
      for (var i = 0; i < values.length; i++) {
        var h = (freqs[i] / maxH) * plotH;
        var x = pad + i * bw + bw * 0.15;
        var y = pad + plotH - h;
        parts.push(
          '<rect x="' +
            x +
            '" y="' +
            y +
            '" width="' +
            bw * 0.7 +
            '" height="' +
            h +
            '" rx="4" fill="#3B82C4"/>'
        );
        parts.push(
          '<text x="' +
            (x + bw * 0.35) +
            '" y="' +
            (H - 8) +
            '" text-anchor="middle" font-size="11" fill="#5D6D7E">' +
            fmtDe(values[i], 1) +
            '</text>'
        );
      }
      parts.push('</svg>');
      host.innerHTML = parts.join('');
    }

    function update() {
      readRows();
      var values = rows.map(function (r) {
        return r.x;
      });
      var freqs = rows.map(function (r) {
        return r.h;
      });
      var n = 0;
      for (var i = 0; i < freqs.length; i++) n += freqs[i];
      var m = weightedMean(values, freqs);
      rows.forEach(function (r, i) {
        var cell = root.querySelector('[data-prod="' + i + '"]');
        if (cell) cell.textContent = isFinite(r.x * r.h) ? fmtDe(r.x * r.h, 1) : '—';
      });
      root.querySelector('[data-freq-n]').textContent = fmtDe(n, 0);
      root.querySelector('[data-freq-mean]').textContent = fmtDe(m, 3);
      drawBars(values, freqs);

      var note = root.querySelector('[data-freq-note]');
      if (Math.abs(m - 7.8) < 0.05 && Math.abs(n - 50) < 0.5) {
        note.className = 'bs-live-note ok';
        note.textContent =
          'Schlaf-Beispiel: \\(\\bar{x} = 390/50 = 7{,}8\\) Stunden. So rechnet man mit Häufigkeiten.';
        showDone('bsFreqDone');
        markExplore(2);
      } else {
        note.className = 'bs-live-note';
        note.textContent =
          'Ändere Werte oder Häufigkeiten — Mittel und Balkendiagramm reagieren sofort. Preset „Schlaf“ setzt die Übung aus den Unterlagen.';
      }
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([note]).catch(function () {});
    }

    root.querySelector('[data-freq-preset-sleep]').addEventListener('click', function () {
      rows = [
        { x: 6, h: 3 },
        { x: 7, h: 16 },
        { x: 8, h: 20 },
        { x: 9, h: 10 },
        { x: 10, h: 1 }
      ];
      renderTable();
      update();
    });

    root.querySelector('[data-freq-preset-flat]').addEventListener('click', function () {
      rows = [
        { x: 1, h: 10 },
        { x: 2, h: 10 },
        { x: 3, h: 10 },
        { x: 4, h: 10 }
      ];
      renderTable();
      update();
    });

    root.querySelector('[data-freq-check]').addEventListener('click', function () {
      readRows();
      var m = weightedMean(
        rows.map(function (r) {
          return r.x;
        }),
        rows.map(function (r) {
          return r.h;
        })
      );
      var fb = root.querySelector('[data-freq-challenge-fb]');
      if (Math.abs(m - 7.8) < 0.08) {
        fb.className = 'feedback correct';
        fb.style.display = 'block';
        fb.textContent = '✅ Richtig: gewichtetes Mittel ≈ 7,8 Stunden.';
        showDone('bsFreqDone');
        markExplore(2);
      } else {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent = '❌ Summe (Wert × Häufigkeit) durch n. Preset „Schlaf“ laden und nachrechnen.';
      }
    });

    renderTable();
    update();
  }

  /* ========== 2) Maßwahl ========== */
  function initChoiceLab() {
    var root = document.getElementById('bsChoiceLab');
    if (!root) return;
    var items = root.querySelectorAll('[data-choice-item]');
    var solved = 0;

    items.forEach(function (item) {
      var correct = item.getAttribute('data-correct');
      item.querySelectorAll('.bs-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          if (item.getAttribute('data-done') === '1') return;
          item.querySelectorAll('.bs-chip').forEach(function (c) {
            c.classList.remove('selected', 'correct', 'wrong');
          });
          chip.classList.add('selected');
          var val = chip.getAttribute('data-val');
          var fb = item.querySelector('.bs-choice-fb');
          if (val === correct) {
            chip.classList.add('correct');
            item.setAttribute('data-done', '1');
            fb.textContent = item.getAttribute('data-explain') || '✅ Passt.';
            fb.style.color = 'var(--green)';
            solved++;
            if (solved >= items.length) {
              showDone('bsChoiceDone');
              markExplore(2);
            }
          } else {
            chip.classList.add('wrong');
            fb.textContent = 'Noch nicht — überlege Skalenniveau und Robustheit.';
            fb.style.color = '#c0392b';
          }
        });
      });
    });
  }

  /* ========== 3) Streuungs-Lab ========== */
  function initDispersionLab() {
    var root = document.getElementById('bsDispLab');
    if (!root) return;

    var groupA = [90, 95, 100, 105, 110];
    var groupB = [85, 90, 95, 105, 125];

    function renderInputs(host, arr, key) {
      host.innerHTML = '';
      arr.forEach(function (v, i) {
        var inp = document.createElement('input');
        inp.value = String(v).replace('.', ',');
        inp.setAttribute('data-g', key);
        inp.setAttribute('data-i', String(i));
        inp.addEventListener('input', update);
        host.appendChild(inp);
      });
    }

    function readGroup(key) {
      var out = [];
      root.querySelectorAll('input[data-g="' + key + '"]').forEach(function (inp) {
        var v = parseNum(inp.value);
        if (!isNaN(v)) out.push(v);
      });
      return out;
    }

    function fillStats(prefix, arr) {
      var m = mean(arr);
      var v = varianceN(arr, m);
      var s = Math.sqrt(v);
      var r = rangeOf(arr);
      root.querySelector('[data-' + prefix + '-mean]').textContent = fmtDe(m, 1);
      root.querySelector('[data-' + prefix + '-range]').textContent = fmtDe(r, 1);
      root.querySelector('[data-' + prefix + '-var]').textContent = fmtDe(v, 2);
      root.querySelector('[data-' + prefix + '-sd]').textContent = fmtDe(s, 1);
      return { m: m, s: s, r: r };
    }

    function drawCompare(a, b) {
      var host = root.querySelector('[data-disp-chart]');
      var all = a.concat(b);
      var minX = Math.min.apply(null, all);
      var maxX = Math.max.apply(null, all);
      if (minX === maxX) {
        minX -= 1;
        maxX += 1;
      }
      var W = 480;
      var H = 110;
      var pad = 24;
      function x(v) {
        return pad + ((v - minX) / (maxX - minX)) * (W - 2 * pad);
      }
      var parts = ['<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">'];
      parts.push(
        '<line x1="' +
          pad +
          '" y1="40" x2="' +
          (W - pad) +
          '" y2="40" stroke="#cfd8e3" stroke-width="2"/>'
      );
      parts.push(
        '<line x1="' +
          pad +
          '" y1="78" x2="' +
          (W - pad) +
          '" y2="78" stroke="#cfd8e3" stroke-width="2"/>'
      );
      a.forEach(function (v) {
        parts.push(
          '<circle cx="' + x(v) + '" cy="40" r="7" fill="#3B82C4" stroke="#fff" stroke-width="2"/>'
        );
      });
      b.forEach(function (v) {
        parts.push(
          '<circle cx="' + x(v) + '" cy="78" r="7" fill="#27AE60" stroke="#fff" stroke-width="2"/>'
        );
      });
      parts.push(
        '<text x="' +
          pad +
          '" y="18" font-size="12" fill="#3B82C4" font-weight="700">Gruppe A</text>'
      );
      parts.push(
        '<text x="' +
          pad +
          '" y="100" font-size="12" fill="#27AE60" font-weight="700">Gruppe B</text>'
      );
      parts.push('</svg>');
      host.innerHTML = parts.join('');
    }

    function update() {
      var a = readGroup('a');
      var b = readGroup('b');
      var sa = fillStats('a', a);
      var sb = fillStats('b', b);
      drawCompare(a, b);
      var note = root.querySelector('[data-disp-note]');
      if (a.length && b.length) {
        if (Math.abs(sa.m - sb.m) < 0.2 && sb.s > sa.s + 0.5) {
          note.className = 'bs-live-note ok';
          note.textContent =
            'Gleiches Mittel, aber Gruppe B streut stärker (größere Standardabweichung / Spannweite). Genau das zeigt das IQ-Beispiel.';
        } else {
          note.className = 'bs-live-note';
          note.textContent =
            'Beobachte: Lage (Mittel) und Streuung können unabhängig wirken. Ziehe einen Wert stark nach außen und sieh, was mit s und R passiert.';
        }
      }
    }

    function setPreset(a, b) {
      groupA = a;
      groupB = b;
      renderInputs(root.querySelector('[data-disp-a]'), groupA, 'a');
      renderInputs(root.querySelector('[data-disp-b]'), groupB, 'b');
      update();
    }

    root.querySelector('[data-disp-iq]').addEventListener('click', function () {
      setPreset([90, 95, 100, 105, 110], [85, 90, 95, 105, 125]);
      showDone('bsDispDone');
      markExplore(3);
    });
    root.querySelector('[data-disp-jump]').addEventListener('click', function () {
      setPreset(
        [4.4, 4.15, 3.73, 3.72, 3.63, 3.52, 3.29, 3.0, 2.28, 2.5, 4.3, 4.8],
        [3.5, 3.6, 3.55, 3.7, 3.65, 3.58, 3.62, 3.68, 3.6, 3.55, 3.7, 3.66]
      );
      showDone('bsDispDone');
      markExplore(3);
    });
    root.querySelector('[data-disp-same]').addEventListener('click', function () {
      setPreset([10, 10, 10, 10, 10], [2, 6, 10, 14, 18]);
    });

    root.querySelector('[data-disp-done]').addEventListener('click', function () {
      showDone('bsDispDone');
      markExplore(3);
    });

    renderInputs(root.querySelector('[data-disp-a]'), groupA, 'a');
    renderInputs(root.querySelector('[data-disp-b]'), groupB, 'b');
    update();
  }

  /* ========== 4) Boxplot-Lab ========== */
  function drawBoxplotSvg(host, arr, opts) {
    opts = opts || {};
    var q = quartiles(arr);
    var W = 520;
    var H = opts.height || 140;
    var padL = 30;
    var padR = 20;
    var y = opts.y || 70;
    var minX = opts.minX !== undefined ? opts.minX : q.min;
    var maxX = opts.maxX !== undefined ? opts.maxX : q.max;
    if (minX === maxX) {
      minX -= 1;
      maxX += 1;
    }
    var span = maxX - minX;
    minX -= span * 0.05;
    maxX += span * 0.05;
    function x(v) {
      return padL + ((v - minX) / (maxX - minX)) * (W - padL - padR);
    }
    var parts = [
      '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" class="bs-boxplot-svg">'
    ];
    parts.push(
      '<line x1="' +
        padL +
        '" y1="' +
        (H - 22) +
        '" x2="' +
        (W - padR) +
        '" y2="' +
        (H - 22) +
        '" stroke="#cfd8e3" stroke-width="2"/>'
    );
    parts.push(
      '<line x1="' +
        x(q.min) +
        '" y1="' +
        y +
        '" x2="' +
        x(q.q1) +
        '" y2="' +
        y +
        '" stroke="#5D6D7E" stroke-width="2"/>'
    );
    parts.push(
      '<line x1="' +
        x(q.q3) +
        '" y1="' +
        y +
        '" x2="' +
        x(q.max) +
        '" y2="' +
        y +
        '" stroke="#5D6D7E" stroke-width="2"/>'
    );
    parts.push(
      '<rect x="' +
        x(q.q1) +
        '" y="' +
        (y - 22) +
        '" width="' +
        Math.max(2, x(q.q3) - x(q.q1)) +
        '" height="44" fill="#d6eaf8" stroke="#3B82C4" stroke-width="2" rx="4"/>'
    );
    if (!opts.hideMedian) {
      parts.push(
        '<line x1="' +
          x(q.q2) +
          '" y1="' +
          (y - 22) +
          '" x2="' +
          x(q.q2) +
          '" y2="' +
          (y + 22) +
          '" stroke="#27AE60" stroke-width="3"/>'
      );
    }
    parts.push(
      '<line x1="' +
        x(q.min) +
        '" y1="' +
        (y - 10) +
        '" x2="' +
        x(q.min) +
        '" y2="' +
        (y + 10) +
        '" stroke="#5D6D7E" stroke-width="2"/>'
    );
    parts.push(
      '<line x1="' +
        x(q.max) +
        '" y1="' +
        (y - 10) +
        '" x2="' +
        x(q.max) +
        '" y2="' +
        (y + 10) +
        '" stroke="#5D6D7E" stroke-width="2"/>'
    );
    if (opts.showLabels) {
      [
        [q.min, 'Min'],
        [q.q1, 'q₁'],
        [q.q2, 'Med'],
        [q.q3, 'q₃'],
        [q.max, 'Max']
      ].forEach(function (p) {
        if (opts.hideMedian && p[1] === 'Med') return;
        parts.push(
          '<text x="' +
            x(p[0]) +
            '" y="18" text-anchor="middle" font-size="11" fill="#5D6D7E">' +
            p[1] +
            '</text>'
        );
        parts.push(
          '<text x="' +
            x(p[0]) +
            '" y="' +
            (H - 6) +
            '" text-anchor="middle" font-size="11" fill="#5D6D7E">' +
            fmtDe(p[0], 1) +
            '</text>'
        );
      });
    }
    parts.push('</svg>');
    host.innerHTML = parts.join('');
    return { q: q, minX: minX, maxX: maxX, x: x, W: W, padL: padL, padR: padR };
  }

  function initBoxplotLab() {
    var root = document.getElementById('bsBoxLab');
    if (!root) return;
    var data = [25, 26, 27, 27, 28, 28, 28, 28, 30, 30, 31, 31, 31, 32, 32, 32, 33, 33, 33, 33, 34, 34, 34, 34, 34, 35, 36, 36, 39];

    function renderInputs() {
      var host = root.querySelector('[data-box-inputs]');
      host.innerHTML = '';
      // compact: textarea
      var ta = document.createElement('textarea');
      ta.rows = 2;
      ta.className = 'bs-input';
      ta.value = data.join('; ');
      ta.addEventListener('input', function () {
        data = ta.value
          .split(/[;\s,]+/)
          .map(parseNum)
          .filter(function (v) {
            return !isNaN(v);
          });
        update();
      });
      host.appendChild(ta);
    }

    function update() {
      if (data.length < 3) return;
      var q = quartiles(data);
      root.querySelector('[data-box-min]').textContent = fmtDe(q.min, 1);
      root.querySelector('[data-box-q1]').textContent = fmtDe(q.q1, 1);
      root.querySelector('[data-box-med]').textContent = fmtDe(q.q2, 1);
      root.querySelector('[data-box-q3]').textContent = fmtDe(q.q3, 1);
      root.querySelector('[data-box-max]').textContent = fmtDe(q.max, 1);
      root.querySelector('[data-box-iqr]').textContent = fmtDe(q.q3 - q.q1, 1);
      drawBoxplotSvg(root.querySelector('[data-box-chart]'), data, { showLabels: true });
    }

    root.querySelector('[data-box-trout]').addEventListener('click', function () {
      var cmp = root.querySelector('[data-box-compare-chart]');
      if (cmp) cmp.style.display = 'none';
      data = [25, 26, 27, 27, 28, 28, 28, 28, 30, 30, 31, 31, 31, 32, 32, 32, 33, 33, 33, 33, 34, 34, 34, 34, 34, 35, 36, 36, 39];
      renderInputs();
      update();
      showDone('bsBoxDone');
      markExplore(4);
    });

    root.querySelector('[data-box-skew]').addEventListener('click', function () {
      var cmp = root.querySelector('[data-box-compare-chart]');
      if (cmp) cmp.style.display = 'none';
      data = [3, 5, 6, 7, 8, 10, 12, 13, 28];
      renderInputs();
      update();
    });

    root.querySelector('[data-box-compare]').addEventListener('click', function () {
      var a = [145, 148, 150, 152, 155, 158, 160, 162, 165, 168, 170];
      var b = [140, 145, 150, 155, 160, 162, 165, 168, 172, 175, 178];
      data = a.slice();
      renderInputs();
      update();
      var host = root.querySelector('[data-box-compare-chart]');
      host.style.display = 'block';
      var qa = quartiles(a);
      var qb = quartiles(b);
      var minX = Math.min(qa.min, qb.min) - 2;
      var maxX = Math.max(qa.max, qb.max) + 2;
      var W = 520;
      var H = 160;
      var padL = 70;
      var padR = 20;
      function x(v) {
        return padL + ((v - minX) / (maxX - minX)) * (W - padL - padR);
      }
      function oneBox(q, y, label) {
        var p = [];
        p.push(
          '<text x="8" y="' +
            (y + 4) +
            '" font-size="12" fill="#5D6D7E" font-weight="700">' +
            label +
            '</text>'
        );
        p.push(
          '<line x1="' +
            x(q.min) +
            '" y1="' +
            y +
            '" x2="' +
            x(q.q1) +
            '" y2="' +
            y +
            '" stroke="#5D6D7E" stroke-width="2"/>'
        );
        p.push(
          '<line x1="' +
            x(q.q3) +
            '" y1="' +
            y +
            '" x2="' +
            x(q.max) +
            '" y2="' +
            y +
            '" stroke="#5D6D7E" stroke-width="2"/>'
        );
        p.push(
          '<rect x="' +
            x(q.q1) +
            '" y="' +
            (y - 16) +
            '" width="' +
            Math.max(2, x(q.q3) - x(q.q1)) +
            '" height="32" fill="#d6eaf8" stroke="#3B82C4" stroke-width="2" rx="4"/>'
        );
        p.push(
          '<line x1="' +
            x(q.q2) +
            '" y1="' +
            (y - 16) +
            '" x2="' +
            x(q.q2) +
            '" y2="' +
            (y + 16) +
            '" stroke="#27AE60" stroke-width="3"/>'
        );
        return p.join('');
      }
      host.innerHTML =
        '<svg viewBox="0 0 ' +
        W +
        ' ' +
        H +
        '" xmlns="http://www.w3.org/2000/svg">' +
        oneBox(qa, 45, 'Klasse A') +
        oneBox(qb, 110, 'Klasse B') +
        '</svg><p class="bs-lab-hint" style="margin-top:6px;">Vergleiche Median und IQR: Welche Klasse liegt typischerweise höher? Welche streut in der Mitte stärker?</p>';
      showDone('bsBoxDone');
      markExplore(4);
    });

    // Median-einzeichnen Challenge
    var challengeHost = root.querySelector('[data-box-challenge]');
    var challengeData = data.slice();
    var geom = drawBoxplotSvg(challengeHost, challengeData, {
      hideMedian: true,
      showLabels: false,
      minX: 24,
      maxX: 43
    });

    var overlay = document.createElement('div');
    overlay.className = 'hit-layer';
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.top = '0';
    overlay.style.bottom = '0';
    var wrap = root.querySelector('[data-box-challenge-wrap]');
    wrap.style.position = 'relative';
    wrap.appendChild(overlay);

    overlay.addEventListener('click', function (ev) {
      var svg = challengeHost.querySelector('svg');
      if (!svg) return;
      var rect = svg.getBoundingClientRect();
      var px = ((ev.clientX - rect.left) / rect.width) * geom.W;
      var val =
        geom.minX +
        ((px - geom.padL) / (geom.W - geom.padL - geom.padR)) * (geom.maxX - geom.minX);
      var trueMed = median(challengeData);
      var fb = root.querySelector('[data-box-challenge-fb]');
      drawBoxplotSvg(challengeHost, challengeData, {
        hideMedian: false,
        showLabels: true,
        minX: 24,
        maxX: 43
      });
      if (Math.abs(val - trueMed) <= 1.2) {
        fb.className = 'feedback correct';
        fb.style.display = 'block';
        fb.textContent =
          '✅ Median ≈ ' + fmtDe(trueMed, 0) + ' cm (15. Wert bei n=29). Gut getroffen!';
        showDone('bsBoxDone');
        markExplore(4);
      } else {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent =
          'Deine Stelle ≈ ' +
          fmtDe(val, 1) +
          '. Der Median liegt bei ' +
          fmtDe(trueMed, 0) +
          ' — nochmal mit Preset „Forellen“ und Häufigkeiten denken.';
      }
    });

    // Aussagen zuordnen
    root.querySelectorAll('[data-box-match]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ok = btn.getAttribute('data-ok') === '1';
        var fb = root.querySelector('[data-box-match-fb]');
        if (ok) {
          fb.className = 'feedback correct';
          fb.style.display = 'block';
          fb.textContent = btn.getAttribute('data-msg');
          showDone('bsBoxDone');
          markExplore(4);
        } else {
          fb.className = 'feedback incorrect';
          fb.style.display = 'block';
          fb.textContent = btn.getAttribute('data-msg');
        }
      });
    });

    renderInputs();
    update();
  }

  var pearsonRedraw = null;

  /* ========== 5) Pearson Lab ========== */
  function initPearsonLab() {
    var root = document.getElementById('bsPearsonLab');
    if (!root) return;
    var canvas = root.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var points = [];
    var showLine = true;

    function setSize() {
      var cw = root.querySelector('.bs-scatter-wrap');
      var basis = (cw && cw.clientWidth) || root.clientWidth || 520;
      var w = Math.min(520, Math.max(280, basis - 8));
      canvas.width = w;
      canvas.height = Math.round(w * 0.72);
    }

    function toPixel(x, y) {
      var pad = 28;
      var px = pad + (x / 10) * (canvas.width - 2 * pad);
      var py = canvas.height - pad - (y / 10) * (canvas.height - 2 * pad);
      return { px: px, py: py };
    }

    function fromPixel(px, py) {
      var pad = 28;
      var x = ((px - pad) / (canvas.width - 2 * pad)) * 10;
      var y = ((canvas.height - pad - py) / (canvas.height - 2 * pad)) * 10;
      return {
        x: Math.max(0, Math.min(10, x)),
        y: Math.max(0, Math.min(10, y))
      };
    }

    function regression(xs, ys) {
      var n = xs.length;
      if (n < 2) return null;
      var mx = mean(xs);
      var my = mean(ys);
      var num = 0;
      var den = 0;
      for (var i = 0; i < n; i++) {
        num += (xs[i] - mx) * (ys[i] - my);
        den += (xs[i] - mx) * (xs[i] - mx);
      }
      if (den === 0) return null;
      var a = num / den;
      var b = my - a * mx;
      return { a: a, b: b };
    }

    function draw() {
      setSize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#e8eef4';
      ctx.lineWidth = 1;
      for (var g = 0; g <= 10; g++) {
        var p0 = toPixel(g, 0);
        var p1 = toPixel(g, 10);
        ctx.beginPath();
        ctx.moveTo(p0.px, p0.py);
        ctx.lineTo(p1.px, p1.py);
        ctx.stroke();
        var q0 = toPixel(0, g);
        var q1 = toPixel(10, g);
        ctx.beginPath();
        ctx.moveTo(q0.px, q0.py);
        ctx.lineTo(q1.px, q1.py);
        ctx.stroke();
      }
      var xs = points.map(function (p) {
        return p.x;
      });
      var ys = points.map(function (p) {
        return p.y;
      });
      var r = pearsonR(xs, ys);
      if (showLine && points.length >= 2) {
        var reg = regression(xs, ys);
        if (reg) {
          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = 2.5;
          var a = toPixel(0, reg.b);
          var b = toPixel(10, reg.a * 10 + reg.b);
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.stroke();
        }
      }
      points.forEach(function (pt) {
        var p = toPixel(pt.x, pt.y);
        ctx.beginPath();
        ctx.fillStyle = '#3B82C4';
        ctx.arc(p.px, p.py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      root.querySelector('[data-r-val]').textContent = isFinite(r) ? fmtDe(r, 3) : '—';
      root.querySelector('[data-r-n]').textContent = String(points.length);
      var note = root.querySelector('[data-r-note]');
      if (!isFinite(r)) {
        note.textContent = 'Mind. 2 Punkte setzen (Klick in die Fläche).';
      } else if (r > 0.7) {
        note.textContent = 'Starker positiver linearer Zusammenhang.';
      } else if (r < -0.7) {
        note.textContent = 'Starker negativer linearer Zusammenhang.';
      } else if (Math.abs(r) < 0.25) {
        note.textContent =
          'Kaum linearer Zusammenhang — es könnte trotzdem ein nicht-linearer Trend existieren.';
      } else {
        note.textContent = 'Mittlerer linearer Zusammenhang (|r| mäßig).';
      }
    }

    function addPoint(ev) {
      var rect = canvas.getBoundingClientRect();
      var px = ((ev.clientX - rect.left) / rect.width) * canvas.width;
      var py = ((ev.clientY - rect.top) / rect.height) * canvas.height;
      points.push(fromPixel(px, py));
      draw();
      if (points.length >= 5) {
        showDone('bsPearsonDone');
        markExplore(5);
      }
    }

    canvas.addEventListener('click', addPoint);

    var lastPreset = null;

    function preset(kind) {
      lastPreset = kind;
      points = [];
      var i;
      if (kind === 'pos') {
        for (i = 0; i < 12; i++) {
          var x = 1 + i * 0.7;
          points.push({ x: x, y: 1.2 + 0.75 * x + (Math.random() - 0.5) * 1.2 });
        }
      } else if (kind === 'neg') {
        for (i = 0; i < 12; i++) {
          var x2 = 1 + i * 0.7;
          points.push({ x: x2, y: 9 - 0.7 * x2 + (Math.random() - 0.5) * 1.1 });
        }
      } else if (kind === 'none') {
        for (i = 0; i < 14; i++) {
          points.push({ x: 1 + Math.random() * 8, y: 1 + Math.random() * 8 });
        }
      } else if (kind === 'curve') {
        for (i = 0; i < 14; i++) {
          var x3 = 0.5 + i * 0.65;
          points.push({ x: x3, y: 0.35 * (x3 - 5) * (x3 - 5) + 1.5 + (Math.random() - 0.5) * 0.6 });
        }
      } else if (kind === 'sleep') {
        var sx = [6, 7, 7, 8, 8, 9, 9, 10, 10];
        var sy = [4, 4, 2, 3, 3, 2, 2, 1, 2];
        for (i = 0; i < sx.length; i++) {
          points.push({ x: (sx[i] - 5) * 1.5, y: sy[i] * 1.8 });
        }
      }
      draw();
      showDone('bsPearsonDone');
      markExplore(5);
    }

    root.querySelector('[data-r-pos]').addEventListener('click', function () {
      preset('pos');
    });
    root.querySelector('[data-r-neg]').addEventListener('click', function () {
      preset('neg');
    });
    root.querySelector('[data-r-none]').addEventListener('click', function () {
      preset('none');
    });
    root.querySelector('[data-r-curve]').addEventListener('click', function () {
      preset('curve');
    });
    root.querySelector('[data-r-sleep]').addEventListener('click', function () {
      preset('sleep');
    });
    root.querySelector('[data-r-clear]').addEventListener('click', function () {
      points = [];
      draw();
    });
    root.querySelector('[data-r-line]').addEventListener('click', function () {
      showLine = !showLine;
      this.classList.toggle('active', showLine);
      draw();
    });

    root.querySelectorAll('[data-r-guess]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var guess = btn.getAttribute('data-r-guess');
        var fb = root.querySelector('[data-r-guess-fb]');
        var xs = points.map(function (p) {
          return p.x;
        });
        var ys = points.map(function (p) {
          return p.y;
        });
        var r = pearsonR(xs, ys);
        var ok = false;
        var msg = '';
        if (guess === 'strong-pos') {
          ok = isFinite(r) && r > 0.7;
          msg = ok
            ? '✅ Passt — stark positiv linear.'
            : '❌ Aktuell r ≈ ' + fmtDe(r, 2) + '. Preset „positiv“ laden.';
        } else if (guess === 'strong-neg') {
          ok = isFinite(r) && r < -0.7;
          msg = ok
            ? '✅ Passt — stark negativ linear.'
            : '❌ Aktuell r ≈ ' + fmtDe(r, 2) + '. Preset „negativ“ laden.';
        } else if (guess === 'weak') {
          ok = isFinite(r) && Math.abs(r) < 0.35;
          msg = ok
            ? '✅ Kaum linearer Zusammenhang.'
            : '❌ |r| ist hier nicht klein. Preset „kein linearer“ oder „U-Form“.';
        } else if (guess === 'curve') {
          ok = lastPreset === 'curve' || (isFinite(r) && Math.abs(r) < 0.45);
          msg = ok
            ? '✅ Bei U-Form kann |r| klein sein, obwohl klarer Zusammenhang besteht.'
            : '❌ Lade Preset „U-Form / krumm“ und vergleiche Bild mit r.';
        }
        fb.className = 'feedback ' + (ok ? 'correct' : 'incorrect');
        fb.style.display = 'block';
        fb.textContent = msg;
        if (ok) {
          showDone('bsPearsonDone');
          markExplore(5);
        }
      });
    });

    window.addEventListener('resize', draw);
    pearsonRedraw = draw;
    draw();
  }

  /* ========== 6) Lorenz / Gini ========== */
  function giniFromValues(vals) {
    var a = sortedCopy(vals.filter(function (v) {
      return v >= 0 && isFinite(v);
    }));
    var n = a.length;
    if (!n) return NaN;
    var sum = 0;
    var weighted = 0;
    for (var i = 0; i < n; i++) {
      sum += a[i];
      weighted += (i + 1) * a[i];
    }
    if (sum === 0) return 0;
    return (2 * weighted) / (n * sum) - (n + 1) / n;
  }

  function giniFromCum(xs, ys) {
    var area = 0;
    for (var j = 1; j < xs.length; j++) {
      area += ((ys[j] + ys[j - 1]) / 2) * (xs[j] - xs[j - 1]);
    }
    return 1 - 2 * area;
  }

  /* ========== Spielzeugteile ========== */
  function initToyLab() {
    var root = document.getElementById('bsToyLab');
    if (!root) return;

    var yellow = [
      { x: 5.5, h: 25 },
      { x: 10.0, h: 7 },
      { x: 14.5, h: 13 }
    ];
    var red = [
      { x: 4.5, h: 20 },
      { x: 5.6, h: 10 },
      { x: 6.0, h: 20 },
      { x: 6.5, h: 15 },
      { x: 25.3, h: 5 }
    ];
    var blue = [{ x: 7.0, h: 70 }];
    var showRB = 'red';
    var solvedMed = false;
    var solvedMean = false;

    function drawFreqBars(host, rows, color) {
      var values = rows.map(function (r) {
        return r.x;
      });
      var freqs = rows.map(function (r) {
        return r.h;
      });
      var maxH = Math.max.apply(null, freqs.concat([1]));
      var W = 360;
      var H = 140;
      var pad = 24;
      var plotW = W - pad * 2;
      var plotH = H - pad * 2;
      var bw = plotW / Math.max(values.length, 1);
      var parts = ['<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">'];
      for (var i = 0; i < values.length; i++) {
        var h = (freqs[i] / maxH) * plotH;
        var x = pad + i * bw + bw * 0.12;
        parts.push(
          '<rect x="' +
            x +
            '" y="' +
            (pad + plotH - h) +
            '" width="' +
            bw * 0.76 +
            '" height="' +
            h +
            '" rx="4" fill="' +
            color +
            '"/>'
        );
        parts.push(
          '<text x="' +
            (x + bw * 0.38) +
            '" y="' +
            (H - 6) +
            '" text-anchor="middle" font-size="11" fill="#5D6D7E">' +
            fmtDe(values[i], 1) +
            '</text>'
        );
      }
      parts.push('</svg>');
      host.innerHTML = parts.join('');
    }

    function renderYellow() {
      var tbody = root.querySelector('[data-toy-yellow-body]');
      tbody.innerHTML = '';
      var cum = 0;
      var n = 0;
      yellow.forEach(function (r) {
        n += r.h;
      });
      yellow.forEach(function (r) {
        cum += r.h;
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' +
          fmtDe(r.x, 1) +
          '</td><td>' +
          r.h +
          '</td><td>' +
          cum +
          ' / ' +
          n +
          '</td>';
        tbody.appendChild(tr);
      });
      var expanded = expandFreq(
        yellow.map(function (r) {
          return r.x;
        }),
        yellow.map(function (r) {
          return r.h;
        })
      );
      root.querySelector('[data-toy-y-n]').textContent = String(expanded.length);
      root.querySelector('[data-toy-y-med]').textContent = fmtDe(median(expanded), 1);
      drawFreqBars(root.querySelector('[data-toy-yellow-chart]'), yellow, '#F1C40F');
    }

    function renderRB() {
      var rows = showRB === 'red' ? red : blue;
      var tbody = root.querySelector('[data-toy-rb-body]');
      tbody.innerHTML = '';
      rows.forEach(function (r) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' +
          fmtDe(r.x, 1) +
          '</td><td>' +
          r.h +
          '</td><td>' +
          fmtDe(r.x * r.h, 1) +
          '</td>';
        tbody.appendChild(tr);
      });
      var rm = weightedMean(
        red.map(function (r) {
          return r.x;
        }),
        red.map(function (r) {
          return r.h;
        })
      );
      var bm = weightedMean(
        blue.map(function (r) {
          return r.x;
        }),
        blue.map(function (r) {
          return r.h;
        })
      );
      root.querySelector('[data-toy-red-mean]').textContent = fmtDe(rm, 2);
      root.querySelector('[data-toy-blue-mean]').textContent = fmtDe(bm, 2);
      drawFreqBars(
        root.querySelector('[data-toy-rb-chart]'),
        rows,
        showRB === 'red' ? '#E74C3C' : '#3498DB'
      );
      var note = root.querySelector('[data-toy-rb-note]');
      if (Math.abs(rm - bm) < 0.05) {
        note.className = 'bs-live-note ok';
        note.textContent =
          'Beide Mittel = 7 cm. Der Ausreißer bei Rot „zieht“ das Mittel auf denselben Wert wie die konstante blaue Serie — Median/Verteilung sehen trotzdem anders aus.';
      } else {
        note.className = 'bs-live-note';
        note.textContent = 'Vergleiche die Tabellen und die Mittelwerte.';
      }
    }

    function maybeDone() {
      if (solvedMed && solvedMean) {
        showDone('bsToyDone');
        markExplore(2);
      }
    }

    root.querySelectorAll('[data-toy-show]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showRB = btn.getAttribute('data-toy-show');
        root.querySelectorAll('[data-toy-show]').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        renderRB();
      });
    });

    root.querySelector('[data-toy-med-check]').addEventListener('click', function () {
      var v = parseNum(root.querySelector('[data-toy-med-input]').value);
      var fb = root.querySelector('[data-toy-med-fb]');
      // n=45, Position 23 liegt in den 25 Werten mit 5,5
      if (Math.abs(v - 5.5) < 0.05) {
        fb.className = 'feedback correct';
        fb.style.display = 'block';
        fb.textContent =
          '✅ Median = 5,5 cm. Bei n=45 ist der 23. Wert noch in der ersten Klasse (25× 5,5).';
        solvedMed = true;
        maybeDone();
      } else {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent = '❌ Kumulierte Häufigkeiten: wo liegt der mittlere (23.) Wert?';
      }
    });

    root.querySelector('[data-toy-mean-check]').addEventListener('click', function () {
      var rm = weightedMean(
        red.map(function (r) {
          return r.x;
        }),
        red.map(function (r) {
          return r.h;
        })
      );
      var bm = weightedMean(
        blue.map(function (r) {
          return r.x;
        }),
        blue.map(function (r) {
          return r.h;
        })
      );
      var fb = root.querySelector('[data-toy-mean-fb]');
      if (Math.abs(rm - bm) < 0.05 && Math.abs(rm - 7) < 0.05) {
        fb.className = 'feedback correct';
        fb.style.display = 'block';
        fb.textContent = '✅ Beide Mittel = 7 — gleiche Lagekennzahl, völlig andere Verteilung.';
        solvedMean = true;
        maybeDone();
      } else {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent = '❌ Summe x·H durch n für Rot und Blau nachrechnen.';
      }
    });

    renderYellow();
    renderRB();
  }

  function initLorenzLab() {
    var root = document.getElementById('bsLorenzLab');
    if (!root) return;

    var xs = [0, 0.2, 0.4, 0.6, 0.8, 1];
    var ys = [0, 0.05, 0.15, 0.3, 0.5, 1];
    var dragIdx = -1;
    var geom = null;
    var host = root.querySelector('[data-lorenz-chart]');

    function setPreset(newXs, newYs) {
      xs = newXs.slice();
      ys = newYs.slice();
      update();
    }

    function renderTable() {
      var tbody = root.querySelector('[data-lorenz-table]');
      if (!tbody) return;
      tbody.innerHTML = '';
      for (var i = 0; i < xs.length; i++) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' +
          fmtDe(xs[i] * 100, 1) +
          ' %</td><td>' +
          fmtDe(ys[i] * 100, 1) +
          ' %</td>';
        tbody.appendChild(tr);
      }
    }

    function draw() {
      var W = 420;
      var H = 420;
      var pad = 36;
      function X(u) {
        return pad + u * (W - 2 * pad);
      }
      function Y(v) {
        return H - pad - v * (H - 2 * pad);
      }
      geom = { W: W, H: H, pad: pad, X: X, Y: Y };

      var parts = [
        '<svg viewBox="0 0 ' +
          W +
          ' ' +
          H +
          '" xmlns="http://www.w3.org/2000/svg" style="touch-action:none">'
      ];
      parts.push(
        '<line x1="' +
          pad +
          '" y1="' +
          (H - pad) +
          '" x2="' +
          (W - pad) +
          '" y2="' +
          (H - pad) +
          '" stroke="#cfd8e3" stroke-width="2"/>'
      );
      parts.push(
        '<line x1="' +
          pad +
          '" y1="' +
          (H - pad) +
          '" x2="' +
          pad +
          '" y2="' +
          pad +
          '" stroke="#cfd8e3" stroke-width="2"/>'
      );
      parts.push(
        '<line x1="' +
          X(0) +
          '" y1="' +
          Y(0) +
          '" x2="' +
          X(1) +
          '" y2="' +
          Y(1) +
          '" stroke="#27AE60" stroke-width="2" stroke-dasharray="6 4"/>'
      );

      var areaPath = 'M ' + X(0) + ' ' + Y(0);
      for (var j = 0; j < xs.length; j++) areaPath += ' L ' + X(xs[j]) + ' ' + Y(ys[j]);
      for (var k = xs.length - 1; k >= 0; k--) {
        areaPath += ' L ' + X(xs[k]) + ' ' + Y(xs[k]);
      }
      areaPath += ' Z';
      parts.push('<path d="' + areaPath + '" fill="rgba(231,76,60,0.18)" stroke="none"/>');

      var line = 'M ' + X(xs[0]) + ' ' + Y(ys[0]);
      for (var m = 1; m < xs.length; m++) line += ' L ' + X(xs[m]) + ' ' + Y(ys[m]);
      parts.push('<path d="' + line + '" fill="none" stroke="#c0392b" stroke-width="3"/>');

      xs.forEach(function (xv, idx) {
        var canDrag = idx > 0 && idx < xs.length - 1;
        parts.push(
          '<circle class="' +
            (canDrag ? 'bs-drag-pt' : '') +
            (dragIdx === idx ? ' dragging' : '') +
            '" data-idx="' +
            idx +
            '" cx="' +
            X(xv) +
            '" cy="' +
            Y(ys[idx]) +
            '" r="' +
            (canDrag ? 8 : 4) +
            '" fill="#c0392b"/>'
        );
      });
      parts.push(
        '<text x="' +
          W / 2 +
          '" y="' +
          (H - 8) +
          '" text-anchor="middle" font-size="12" fill="#5D6D7E">Anteil Merkmalsträger</text>'
      );
      parts.push(
        '<text x="14" y="' +
          H / 2 +
          '" transform="rotate(-90 14 ' +
          H / 2 +
          ')" text-anchor="middle" font-size="12" fill="#5D6D7E">kumulierte Merkmalssumme</text>'
      );
      parts.push('</svg>');
      host.innerHTML = parts.join('');
    }

    function applyDragFromEvent(ev) {
      if (dragIdx < 0 || !geom) return;
      var svg = host.querySelector('svg');
      if (!svg) return;
      var rect = svg.getBoundingClientRect();
      var py = ((ev.clientY - rect.top) / rect.height) * geom.H;
      var yVal = (geom.H - geom.pad - py) / (geom.H - 2 * geom.pad);
      var lo = ys[dragIdx - 1];
      var hi = ys[dragIdx + 1];
      yVal = Math.max(lo, Math.min(hi, yVal));
      yVal = Math.max(0, Math.min(1, yVal));
      ys[dragIdx] = yVal;
      update();
    }

    host.addEventListener('pointerdown', function (ev) {
      var t = ev.target;
      if (!t.getAttribute || t.getAttribute('data-idx') === null) return;
      if (!t.classList.contains('bs-drag-pt')) return;
      ev.preventDefault();
      dragIdx = parseInt(t.getAttribute('data-idx'), 10);
      host.setPointerCapture(ev.pointerId);
    });
    host.addEventListener('pointermove', function (ev) {
      if (dragIdx < 0) return;
      applyDragFromEvent(ev);
    });
    host.addEventListener('pointerup', function () {
      if (dragIdx >= 0) {
        dragIdx = -1;
        showDone('bsLorenzDone');
        markExplore(6);
        draw();
      }
    });
    host.addEventListener('pointercancel', function () {
      dragIdx = -1;
    });

    function update() {
      var g = giniFromCum(xs, ys);
      root.querySelector('[data-gini-val]').textContent = fmtDe(g, 3);
      renderTable();
      var note = root.querySelector('[data-lorenz-note]');
      if (g < 0.05) {
        note.className = 'bs-live-note ok';
        note.textContent = 'Nahe Gleichverteilung: Lorenz ≈ Diagonale, G ≈ 0.';
      } else if (g > 0.55) {
        note.className = 'bs-live-note warn';
        note.textContent =
          'Starke Konzentration (AT-typisch in Korrekturschätzungen): untere Hälfte kaum Vermögen, oberes Prozent hält sehr viel.';
      } else {
        note.className = 'bs-live-note';
        note.textContent = 'Je weiter die Kurve unter der Diagonalen, desto ungleicher die Verteilung.';
      }
      draw();
    }

    root.querySelector('[data-lorenz-equal]').addEventListener('click', function () {
      setPreset([0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.2, 0.4, 0.6, 0.8, 1]);
    });
    root.querySelector('[data-lorenz-at]').addEventListener('click', function () {
      // APA/AK gerundet: 50%→2,5%; 90%→34,2%; 95%→43,7%; 99%→59,4%; 100%→100%
      setPreset([0, 0.5, 0.9, 0.95, 0.99, 1], [0, 0.025, 0.342, 0.437, 0.594, 1]);
      showDone('bsLorenzDone');
      markExplore(6);
    });
    root.querySelector('[data-lorenz-at10]').addEventListener('click', function () {
      // AK: 90%→33%; +5%→43%; +4%→59%; +1%→100%
      setPreset([0, 0.9, 0.95, 0.99, 1], [0, 0.33, 0.43, 0.59, 1]);
      showDone('bsLorenzDone');
      markExplore(6);
    });
    root.querySelector('[data-lorenz-extreme]').addEventListener('click', function () {
      setPreset([0, 0.8, 0.95, 1], [0, 0.02, 0.08, 1]);
    });
    root.querySelector('[data-lorenz-reset-drag]').addEventListener('click', function () {
      setPreset([0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.05, 0.15, 0.3, 0.5, 1]);
    });

    root.querySelector('[data-lorenz-mini-check]').addEventListener('click', function () {
      var vals = [1, 1, 2, 6];
      var g = giniFromValues(vals);
      var inp = parseNum(root.querySelector('[data-lorenz-mini-input]').value);
      var fb = root.querySelector('[data-lorenz-mini-fb]');
      if (Math.abs(inp - g) <= 0.02) {
        fb.className = 'feedback correct';
        fb.style.display = 'block';
        fb.textContent = '✅ G ≈ ' + fmtDe(g, 3) + ' mit der Summenformel.';
        showDone('bsLorenzDone');
        markExplore(6);
      } else {
        fb.className = 'feedback incorrect';
        fb.style.display = 'block';
        fb.textContent =
          '❌ Erwartet ca. ' +
          fmtDe(g, 3) +
          '. Werte ordnen, dann G = 2Σ(i·xᵢ)/(n·Σxᵢ) − (n+1)/n.';
      }
    });

    update();
  }

  function initAll() {
    initFreqLab();
    initToyLab();
    initChoiceLab();
    initDispersionLab();
    initBoxplotLab();
    initPearsonLab();
    initLorenzLab();
  }

  window.bsRefreshVisibleLabs = function (tabIdx) {
    if (tabIdx === 5 && typeof pearsonRedraw === 'function') {
      setTimeout(pearsonRedraw, 40);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
})();
