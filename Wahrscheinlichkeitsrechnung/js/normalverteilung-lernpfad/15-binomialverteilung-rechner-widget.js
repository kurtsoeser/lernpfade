// ══════════════════════════════════════════════
// BINOMIALVERTEILUNGSRECHNER (nativ, GeoGebra-ähnlich)
// ══════════════════════════════════════════════
(function () {
  'use strict';

  function bvParseNum(s) {
    if (s == null || s === '') return NaN;
    return parseFloat(String(s).replace(',', '.').trim());
  }

  function parseProbability(str) {
    const x = bvParseNum(str);
    if (Number.isNaN(x)) return NaN;
    if (x > 1 && x <= 100) return x / 100;
    return x;
  }

  function fmtDeProb(p) {
    if (!Number.isFinite(p)) return '—';
    return p.toFixed(4).replace('.', ',');
  }

  function fmtDeNum(x, digits) {
    const d = digits == null ? 4 : digits;
    if (!Number.isFinite(x)) return '—';
    return x.toFixed(d).replace('.', ',');
  }

  /** Dichte der Normalverteilung N(μ, σ²) — gleiche Skala wie Binomial-PMF (Binbreite 1). */
  function normalPDF(x, mu, sigma) {
    if (sigma <= 0) return 0;
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
  }

  /** PMF P(X=k) für X ~ Bin(n,p), k ∈ [0,n] */
  function binomPMFArray(n, p) {
    const arr = new Array(n + 1);
    if (p <= 0) {
      arr.fill(0);
      arr[0] = 1;
      return arr;
    }
    if (p >= 1) {
      arr.fill(0);
      arr[n] = 1;
      return arr;
    }
    arr[0] = Math.pow(1 - p, n);
    for (let k = 1; k <= n; k++) {
      arr[k] = arr[k - 1] * ((n - k + 1) / k) * (p / (1 - p));
    }
    return arr;
  }

  function cdfFromPmf(pmf) {
    const n = pmf.length - 1;
    const F = new Array(n + 1);
    let s = 0;
    for (let k = 0; k <= n; k++) {
      s += pmf[k];
      F[k] = s;
    }
    return F;
  }

  function tailFromPmf(pmf) {
    const n = pmf.length - 1;
    const T = new Array(n + 1);
    let s = 0;
    for (let k = n; k >= 0; k--) {
      s += pmf[k];
      T[k] = s;
    }
    return T;
  }

  /** Kleinste k mit F(k) ≥ p */
  function invLeftFromCdf(F, p) {
    const n = F.length - 1;
    if (p <= 0) return 0;
    if (p >= 1) return n;
    for (let k = 0; k <= n; k++) {
      if (F[k] >= p) return k;
    }
    return n;
  }

  /** Kleinste k mit P(X≥k) ≤ p (p ∈ (0,1]) */
  function invRightFromTail(T, p) {
    const n = T.length - 1;
    if (p >= 1) return 0;
    if (p <= 0) return n;
    for (let k = 0; k <= n; k++) {
      if (T[k] <= p) return k;
    }
    return n;
  }

  function clampInt(v, lo, hi) {
    return Math.min(Math.max(Math.round(v), lo), hi);
  }

  function initBvRechner(root) {
    if (!root || root.getAttribute('data-bv-init') === '1') return;

    const canvas = root.querySelector('.bv-canvas');
    const nEl = root.querySelector('.bv-n');
    const pEl = root.querySelector('.bv-p');
    const aEl = root.querySelector('.bv-a');
    const bEl = root.querySelector('.bv-b');
    const probOut = root.querySelector('.bv-prob-out');
    const formulaEl = root.querySelector('.bv-formula-display');
    const rowA = root.querySelector('.bv-row-a');
    const rowB = root.querySelector('.bv-row-b');
    const modeBtns = root.querySelectorAll('.bv-mode-btn');
    const statsEl = root.querySelector('.bv-stats');
    const normalToggleEl = root.querySelector('.bv-normal-toggle');
    const tableToggleEl = root.querySelector('.bv-table-toggle');
    const tablePanelEl = root.querySelector('.bv-pmf-table-panel');
    const tableBodyEl = root.querySelector('.bv-pmf-table-body');

    if (!canvas || !nEl || !pEl || !aEl || !bEl || !probOut) return;
    root.setAttribute('data-bv-init', '1');

    let mode = 'left';
    const activeClass = 'bv-mode-btn--active';
    let showNormalOverlay = false;

    let lastPlot = null;
    let drag = null;
    let probSyncLock = false;

    function setProbDisplay(s) {
      probSyncLock = true;
      if (probOut.tagName === 'INPUT') probOut.value = s;
      else probOut.textContent = s;
      probSyncLock = false;
    }

    function setMode(m) {
      mode = m;
      modeBtns.forEach(function (btn) {
        const on = btn.getAttribute('data-bv-mode') === m;
        btn.classList.toggle(activeClass, on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (rowA) rowA.style.display = m === 'right' ? 'none' : '';
      if (rowB) rowB.style.display = m === 'left' ? 'none' : '';
      if (probOut.tagName === 'INPUT') {
        probOut.readOnly = m === 'between' || m === 'two';
        probOut.title = probOut.readOnly
          ? ''
          : 'Grenze ändern oder hier P eingeben (0 < P < 1 oder Prozent) → Umkehr zu k';
      }
      redraw();
    }

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.getAttribute('data-bv-mode') || 'left');
      });
    });

    [nEl, pEl, aEl, bEl].forEach(function (el) {
      el.addEventListener('input', redraw);
      el.addEventListener('change', redraw);
    });

    if (normalToggleEl) {
      normalToggleEl.addEventListener('click', function () {
        showNormalOverlay = !showNormalOverlay;
        normalToggleEl.classList.toggle('bv-normal-toggle--active', showNormalOverlay);
        normalToggleEl.setAttribute('aria-pressed', showNormalOverlay ? 'true' : 'false');
        redraw();
      });
    }

    if (tableToggleEl && tablePanelEl) {
      tableToggleEl.addEventListener('click', function () {
        const open = !tablePanelEl.classList.contains('bv-pmf-table-panel--open');
        tablePanelEl.classList.toggle('bv-pmf-table-panel--open', open);
        tableToggleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
        tablePanelEl.setAttribute('aria-hidden', open ? 'false' : 'true');
        redraw();
      });
    }

    function fillPmfTableBody(pmf, n) {
      if (!tableBodyEl) return;
      if (!pmf || !Number.isFinite(n) || n < 0) {
        tableBodyEl.innerHTML = '';
        return;
      }
      const MAX_ROWS = 501;
      const lastK = Math.min(n, MAX_ROWS - 1);
      let html = '';
      for (let k = 0; k <= lastK && k < pmf.length; k++) {
        html += '<tr><td>' + k + '</td><td>' + fmtDeProb(pmf[k]) + '</td></tr>';
      }
      if (n > lastK) {
        html +=
          '<tr><td colspan="2" class="bv-pmf-table-note">… gekürzt (n = ' +
          n +
          ', Anzeige max. ' +
          MAX_ROWS +
          ' Zeilen)</td></tr>';
      }
      tableBodyEl.innerHTML = html;
    }

    function handleProbInverse() {
      if (probSyncLock) return;
      if (mode !== 'left' && mode !== 'right') return;
      const pUser = parseProbability(probOut.tagName === 'INPUT' ? probOut.value : '');
      const n = Math.round(bvParseNum(nEl.value));
      const p = bvParseNum(pEl.value);
      if (!Number.isFinite(n) || n < 0 || n > 5000) return;
      if (!Number.isFinite(p) || p <= 0 || p >= 1) return;
      if (!Number.isFinite(pUser) || pUser <= 0 || pUser >= 1) return;
      const pmf = binomPMFArray(n, p);
      const F = cdfFromPmf(pmf);
      const T = tailFromPmf(pmf);
      if (mode === 'left') {
        const k = invLeftFromCdf(F, pUser);
        aEl.value = String(k);
      } else {
        const k = invRightFromTail(T, pUser);
        bEl.value = String(k);
      }
      redraw();
    }

    if (probOut.tagName === 'INPUT') {
      probOut.addEventListener('input', handleProbInverse);
      probOut.addEventListener('change', handleProbInverse);
    }

    function compute() {
      const n = Math.round(bvParseNum(nEl.value));
      const p = bvParseNum(pEl.value);
      const a = Math.round(bvParseNum(aEl.value));
      const b = Math.round(bvParseNum(bEl.value));
      if (!Number.isFinite(n) || n < 0 || n > 5000) {
        return { ok: false };
      }
      if (!Number.isFinite(p) || p <= 0 || p >= 1) {
        return { ok: false };
      }
      const pmf = binomPMFArray(n, p);
      const F = cdfFromPmf(pmf);
      function Fk(k) {
        if (k < 0) return 0;
        if (k > n) return 1;
        return F[k];
      }
      let prob;
      let parts = null;
      if (mode === 'left') {
        if (!Number.isFinite(a)) return { ok: false };
        const k = clampInt(a, 0, n);
        prob = Fk(k);
        return { ok: true, p: prob, n: n, pParam: p, pmf: pmf, F: F, a: k, b: k };
      }
      if (mode === 'right') {
        if (!Number.isFinite(b)) return { ok: false };
        const k = clampInt(b, 0, n);
        prob = k === 0 ? 1 : 1 - F[k - 1];
        return { ok: true, p: prob, n: n, pParam: p, pmf: pmf, F: F, a: k, b: k };
      }
      if (mode === 'between') {
        if (!Number.isFinite(a) || !Number.isFinite(b)) return { ok: false };
        const lo = clampInt(Math.min(a, b), 0, n);
        const hi = clampInt(Math.max(a, b), 0, n);
        prob = Fk(hi) - (lo > 0 ? Fk(lo - 1) : 0);
        return { ok: true, p: prob, n: n, pParam: p, pmf: pmf, F: F, a: lo, b: hi };
      }
      if (mode === 'two') {
        if (!Number.isFinite(a) || !Number.isFinite(b)) return { ok: false };
        const lo = clampInt(Math.min(a, b), 0, n);
        const hi = clampInt(Math.max(a, b), 0, n);
        const pLeft = Fk(lo);
        const pRight = hi === 0 ? 1 : 1 - F[hi - 1];
        prob = pLeft + pRight;
        parts = [pLeft, pRight];
        return { ok: true, p: prob, parts: parts, n: n, pParam: p, pmf: pmf, F: F, a: lo, b: hi };
      }
      return { ok: false };
    }

    function updateFormula(c) {
      if (!formulaEl) return;
      if (!c || !c.ok) {
        formulaEl.textContent = '';
        return;
      }
      const fa = Number.isFinite(c.a) ? String(c.a) : '—';
      const fb = Number.isFinite(c.b) ? String(c.b) : '—';
      if (mode === 'left') {
        formulaEl.textContent = 'P(X ≤ ' + fa + ') =';
      } else if (mode === 'right') {
        formulaEl.textContent = 'P(X ≥ ' + fb + ') =';
      } else if (mode === 'between') {
        formulaEl.textContent = 'P(' + fa + ' ≤ X ≤ ' + fb + ') =';
      } else {
        formulaEl.textContent = 'P(X ≤ ' + fa + ') + P(X ≥ ' + fb + ') =';
      }
    }

    function isBarShaded(k, c) {
      if (!c || !c.ok) return false;
      if (mode === 'left') return k <= c.a;
      if (mode === 'right') return k >= c.b;
      if (mode === 'between') return k >= c.a && k <= c.b;
      return k <= c.a || k >= c.b;
    }

    function redraw() {
      lastPlot = null;
      const c = compute();
      updateFormula(c);

      if (!c || !c.ok || !Number.isFinite(c.p)) {
        setProbDisplay('—');
      } else if (c.parts) {
        setProbDisplay(fmtDeProb(c.parts[0]) + ' + ' + fmtDeProb(c.parts[1]) + ' = ' + fmtDeProb(c.p));
      } else {
        setProbDisplay(fmtDeProb(c.p));
      }

      const wrap = canvas.closest('.bv-canvas-wrap') || canvas.parentElement;
      const wCss = wrap.clientWidth || 520;
      const hCss = Math.max(260, Math.round(wCss * 0.55));
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = wCss + 'px';
      canvas.style.height = hCss + 'px';
      canvas.width = Math.round(wCss * dpr);
      canvas.height = Math.round(hCss * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, wCss, hCss);

      if (!c || !c.ok) {
        if (statsEl) statsEl.textContent = '';
        fillPmfTableBody(null, -1);
        ctx.fillStyle = '#888';
        ctx.font = '14px Nunito, system-ui, sans-serif';
        ctx.fillText('n und p gültig eingeben (n ≥ 0, 0 < p < 1).', 12, 28);
        return;
      }

      fillPmfTableBody(c.pmf, c.n);

      const n = c.n;
      const pmf = c.pmf;
      const pParam = c.pParam;
      const muApprox = n * pParam;
      const sigmaApprox = Math.sqrt(n * pParam * (1 - pParam));

      if (statsEl) {
        statsEl.innerHTML =
          '<span class="bv-stats-mu-sigma">μ = ' + fmtDeNum(muApprox) +
          ' &nbsp;·&nbsp; σ = ' + fmtDeNum(sigmaApprox) + '</span>' +
          '<span class="bv-stats-muted">(Normalapproximation)</span>';
      }

      let yMax = 0.001;
      for (let k = 0; k <= n; k++) yMax = Math.max(yMax, pmf[k]);
      if (showNormalOverlay && n > 0 && sigmaApprox > 1e-12) {
        const step = Math.max(0.02, 1 / Math.min(200, n * 8));
        for (let x = -0.5; x <= n + 0.5 + 1e-9; x += step) {
          yMax = Math.max(yMax, normalPDF(x, muApprox, sigmaApprox));
        }
      }
      yMax *= 1.15;
      const yMin = -yMax * 0.06;
      const xMin = -0.5;
      const xMax = n + 0.5;

      const padL = 44;
      const padR = 16;
      const padT = 12;
      const padB = 32;
      const plotW = wCss - padL - padR;
      const plotH = hCss - padT - padB;

      function mapX(x) {
        return padL + ((x - xMin) / (xMax - xMin)) * plotW;
      }
      function mapY(y) {
        return padT + (1 - (y - yMin) / (yMax - yMin)) * plotH;
      }

      const y0 = 0;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(padL, padT, plotW, plotH);

      const fillCol = 'rgba(59, 130, 196, 0.78)';
      const outlineCol = 'rgba(29, 78, 216, 0.95)';
      const emptyFill = 'rgba(255,255,255,0.95)';

      for (let k = 0; k <= n; k++) {
        const xLeft = mapX(k - 0.5);
        const xRight = mapX(k + 0.5);
        const barW = xRight - xLeft;
        const h = pmf[k];
        const yTop = mapY(h);
        const yBot = mapY(y0);
        const shaded = isBarShaded(k, c);
        ctx.beginPath();
        ctx.rect(xLeft, yTop, barW, yBot - yTop);
        ctx.fillStyle = shaded ? fillCol : emptyFill;
        ctx.fill();
        ctx.strokeStyle = outlineCol;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }

      if (showNormalOverlay && n > 0 && sigmaApprox > 1e-12) {
        ctx.beginPath();
        let started = false;
        const step = Math.max(0.015, 1 / Math.min(240, n * 10));
        for (let x = -0.5; x <= n + 0.5 + 1e-9; x += step) {
          const py = mapY(normalPDF(x, muApprox, sigmaApprox));
          const px = mapX(x);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.25;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, mapY(y0));
      ctx.lineTo(padL + plotW, mapY(y0));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '11px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const tickEvery = n <= 25 ? 1 : n <= 50 ? 2 : n <= 100 ? 5 : 10;
      for (let tx = 0; tx <= n; tx += tickEvery) {
        const px = mapX(tx);
        ctx.beginPath();
        ctx.moveTo(px, mapY(y0));
        ctx.lineTo(px, mapY(y0) + 4);
        ctx.stroke();
        ctx.fillText(String(tx), px, mapY(y0) + 16);
      }

      function markAtInt(kv) {
        if (!Number.isFinite(kv)) return;
        const px = mapX(kv);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(px, mapY(y0) + 2);
        ctx.lineTo(px - 5, mapY(y0) + 10);
        ctx.lineTo(px + 5, mapY(y0) + 10);
        ctx.closePath();
        ctx.fill();
      }

      if (mode === 'left') markAtInt(c.a);
      else if (mode === 'right') markAtInt(c.b);
      else {
        markAtInt(c.a);
        markAtInt(c.b);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.fillText('k', padL + plotW / 2, hCss - 8);

      lastPlot = {
        n: n,
        xMin: xMin,
        xMax: xMax,
        padL: padL,
        plotW: plotW,
        yAxisY: mapY(y0),
        handles: []
      };
      if (mode === 'left') {
        lastPlot.handles.push({ k: c.a, role: 'a' });
      } else if (mode === 'right') {
        lastPlot.handles.push({ k: c.b, role: 'b' });
      } else {
        lastPlot.handles.push({ k: c.a, role: 'lo' });
        lastPlot.handles.push({ k: c.b, role: 'hi' });
      }
    }

    function kFromMouse(mx) {
      if (!lastPlot) return NaN;
      const t = (mx - lastPlot.padL) / lastPlot.plotW;
      const x = lastPlot.xMin + t * (lastPlot.xMax - lastPlot.xMin);
      return clampInt(x, 0, lastPlot.n);
    }

    function hitHandle(mx, my) {
      if (!lastPlot) return null;
      const y0 = lastPlot.yAxisY;
      if (my < y0 - 4 || my > y0 + 18) return null;
      const tolPx = 14;
      let best = null;
      let bestD = tolPx + 1;
      for (let i = 0; i < lastPlot.handles.length; i++) {
        const h = lastPlot.handles[i];
        const px = lastPlot.padL + ((h.k - lastPlot.xMin) / (lastPlot.xMax - lastPlot.xMin)) * lastPlot.plotW;
        const d = Math.abs(mx - px);
        if (d <= tolPx && d < bestD) {
          bestD = d;
          best = h.role;
        }
      }
      return best;
    }

    function applyDrag(role, kNew) {
      if (!lastPlot || !Number.isFinite(kNew)) return;
      const n = lastPlot.n;
      const kk = clampInt(kNew, 0, n);
      if (role === 'a') {
        aEl.value = String(kk);
      } else if (role === 'b') {
        bEl.value = String(kk);
      } else if (role === 'lo') {
        const a = Math.round(bvParseNum(aEl.value));
        const b = Math.round(bvParseNum(bEl.value));
        const hi = Math.max(a, b);
        const newLo = Math.min(kk, hi);
        if (a <= b) aEl.value = String(newLo);
        else bEl.value = String(newLo);
      } else if (role === 'hi') {
        const a = Math.round(bvParseNum(aEl.value));
        const b = Math.round(bvParseNum(bEl.value));
        const lo = Math.min(a, b);
        const newHi = Math.max(kk, lo);
        if (a <= b) bEl.value = String(newHi);
        else aEl.value = String(newHi);
      }
    }

    function onPointerDown(e) {
      if (!lastPlot) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const role = hitHandle(mx, my);
      if (!role) return;
      e.preventDefault();
      drag = { role: role, pointerId: e.pointerId };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
      canvas.style.cursor = 'grabbing';
    }

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (drag) {
        const kNew = kFromMouse(mx);
        applyDrag(drag.role, kNew);
        redraw();
        e.preventDefault();
      } else {
        const h = hitHandle(mx, my);
        canvas.style.cursor = h ? 'grab' : 'default';
      }
    }

    function endDrag(e) {
      if (!drag) return;
      if (e && e.pointerId !== undefined && e.pointerId !== drag.pointerId) return;
      try {
        if (e && e.pointerId !== undefined) canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
      drag = null;
      canvas.style.cursor = 'default';
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('lostpointercapture', function () {
      drag = null;
      canvas.style.cursor = 'default';
    });

    const ro = new ResizeObserver(function () {
      redraw();
    });
    const roTarget = canvas.closest('.bv-canvas-wrap') || canvas.parentElement;
    if (roTarget) ro.observe(roTarget);

    root.__bvRedraw = redraw;
    setMode('left');
  }

  function initAllBvRechner() {
    document.querySelectorAll('.bv-rechner').forEach(initBvRechner);
  }

  window.bvRechnerRedrawAll = function () {
    document.querySelectorAll('.bv-rechner').forEach(function (root) {
      if (typeof root.__bvRedraw === 'function') root.__bvRedraw();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllBvRechner);
  } else {
    initAllBvRechner();
  }
})();
