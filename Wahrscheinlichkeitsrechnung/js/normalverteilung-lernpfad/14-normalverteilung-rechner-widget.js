// ══════════════════════════════════════════════
// NORMALVERTEILUNGSRECHNER (nativ, GeoGebra-ähnlich)
// ══════════════════════════════════════════════
(function () {
  'use strict';

  function nvParseNum(s) {
    if (s == null || s === '') return NaN;
    return parseFloat(String(s).replace(',', '.').trim());
  }

  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
    return sign * y;
  }

  function normalCDF(x) {
    return 0.5 * (1 + erf(x / Math.SQRT2));
  }

  /** Quantil der Standardnormalverteilung: \(z\) mit \(\Phi(z)=p\), \(p\in(0,1)\). */
  function invNormCdf(p) {
    if (p <= 0 || p >= 1 || !Number.isFinite(p)) return NaN;
    let lo = -12;
    let hi = 12;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (normalCDF(mid) < p) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function parseProbability(str) {
    const x = nvParseNum(str);
    if (Number.isNaN(x)) return NaN;
    if (x > 1 && x <= 100) return x / 100;
    return x;
  }

  function normalPDF(x, mu, sigma) {
    if (sigma <= 0) return 0;
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
  }

  function fmtDeProb(p) {
    if (!Number.isFinite(p)) return '—';
    return p.toFixed(4).replace('.', ',');
  }

  function fillUnder(ctx, x0, x1, mu, sigma, y0, mapX, mapY, fillStyle) {
    const step = 0.04;
    ctx.beginPath();
    ctx.moveTo(mapX(x0), mapY(y0));
    for (let x = x0; x <= x1 + 1e-9; x += step) {
      ctx.lineTo(mapX(x), mapY(normalPDF(x, mu, sigma)));
    }
    ctx.lineTo(mapX(x1), mapY(y0));
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  function fmtInput(v) {
    if (!Number.isFinite(v)) return '';
    return v.toFixed(4).replace('.', ',');
  }

  function initNvRechner(root) {
    if (!root || root.getAttribute('data-nv-init') === '1') return;

    const canvas = root.querySelector('.nv-canvas');
    const muEl = root.querySelector('.nv-mu');
    const sigEl = root.querySelector('.nv-sigma');
    const aEl = root.querySelector('.nv-a');
    const bEl = root.querySelector('.nv-b');
    const probOut = root.querySelector('.nv-prob-out');
    const formulaEl = root.querySelector('.nv-formula-display');
    const rowA = root.querySelector('.nv-row-a');
    const rowB = root.querySelector('.nv-row-b');
    const modeBtns = root.querySelectorAll('.nv-mode-btn');

    if (!canvas || !muEl || !sigEl || !aEl || !bEl || !probOut) return;
    root.setAttribute('data-nv-init', '1');

    let mode = 'between';
    const activeClass = 'nv-mode-btn--active';

    /** Letzter Plot für Zieh-Hit-Tests (CSS-Pixel) */
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
        const on = btn.getAttribute('data-nv-mode') === m;
        btn.classList.toggle(activeClass, on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (rowA) rowA.style.display = m === 'right' ? 'none' : '';
      if (rowB) rowB.style.display = m === 'left' ? 'none' : '';
      if (probOut.tagName === 'INPUT') {
        probOut.readOnly = m === 'between' || m === 'two';
        probOut.title = probOut.readOnly
          ? ''
          : 'Grenze ändern oder hier P eingeben (0 < P < 1 oder Prozent) → Umkehr zu a bzw. b';
      }
      redraw();
    }

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.getAttribute('data-nv-mode') || 'between');
      });
    });

    [muEl, sigEl, aEl, bEl].forEach(function (el) {
      el.addEventListener('input', redraw);
      el.addEventListener('change', redraw);
    });

    function handleProbInverse() {
      if (probSyncLock) return;
      if (mode !== 'left' && mode !== 'right') return;
      const p = parseProbability(probOut.tagName === 'INPUT' ? probOut.value : '');
      const mu = nvParseNum(muEl.value);
      const sigma = nvParseNum(sigEl.value);
      if (!Number.isFinite(mu) || !Number.isFinite(sigma) || sigma <= 0) return;
      if (!Number.isFinite(p) || p <= 0 || p >= 1) return;
      const z = invNormCdf(mode === 'left' ? p : (1 - p));
      if (!Number.isFinite(z)) return;
      const boundary = mu + sigma * z;
      if (mode === 'left') {
        aEl.value = fmtInput(boundary);
      } else {
        bEl.value = fmtInput(boundary);
      }
      redraw();
    }

    if (probOut.tagName === 'INPUT') {
      probOut.addEventListener('input', handleProbInverse);
      probOut.addEventListener('change', handleProbInverse);
    }

    function compute() {
      const mu = nvParseNum(muEl.value);
      const sigma = nvParseNum(sigEl.value);
      const a = nvParseNum(aEl.value);
      const b = nvParseNum(bEl.value);
      if (!Number.isFinite(mu) || !Number.isFinite(sigma) || sigma <= 0) {
        return { ok: false, mu: mu, sigma: sigma, a: a, b: b };
      }
      const Phi = normalCDF;
      let p;
      let parts = null;
      let zl;
      let zh;
      if (mode === 'left') {
        if (!Number.isFinite(a)) return { ok: false };
        zl = (a - mu) / sigma;
        p = Phi(zl);
      } else if (mode === 'right') {
        if (!Number.isFinite(b)) return { ok: false };
        zh = (b - mu) / sigma;
        p = 1 - Phi(zh);
      } else if (mode === 'between') {
        if (!Number.isFinite(a) || !Number.isFinite(b)) return { ok: false };
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        zl = (lo - mu) / sigma;
        zh = (hi - mu) / sigma;
        p = Phi(zh) - Phi(zl);
      } else if (mode === 'two') {
        if (!Number.isFinite(a) || !Number.isFinite(b)) return { ok: false };
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        zl = (lo - mu) / sigma;
        zh = (hi - mu) / sigma;
        const p1 = Phi(zl);
        const p2 = 1 - Phi(zh);
        p = p1 + p2;
        parts = [p1, p2];
      } else {
        return { ok: false };
      }
      return { ok: true, p: p, parts: parts, mu: mu, sigma: sigma, a: a, b: b };
    }

    function updateFormula(c) {
      if (!formulaEl) return;
      if (!c || !c.ok) {
        formulaEl.textContent = '';
        return;
      }
      const fa = Number.isFinite(c.a) ? fmtDeProb(c.a) : '—';
      const fb = Number.isFinite(c.b) ? fmtDeProb(c.b) : '—';
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

      const wrap = canvas.parentElement;
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

      if (!c || !c.ok || !Number.isFinite(c.mu) || !Number.isFinite(c.sigma) || c.sigma <= 0) {
        ctx.fillStyle = '#888';
        ctx.font = '14px Nunito, system-ui, sans-serif';
        ctx.fillText('μ und σ gültig eingeben (σ > 0).', 12, 28);
        return;
      }

      const mu = c.mu;
      const sigma = c.sigma;
      const xPad = 4 * sigma;
      let xMin = mu - xPad;
      let xMax = mu + xPad;
      let yMax = 0.001;
      for (let x = xMin; x <= xMax; x += (xMax - xMin) / 200) {
        yMax = Math.max(yMax, normalPDF(x, mu, sigma));
      }
      yMax *= 1.12;
      const yMin = -yMax * 0.06;

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

      /** Wahrscheinlichkeit als Text in der gefärbten Fläche (Mitte des Intervalls, unterhalb der Kurve) */
      function drawAreaLabel(xLo, xHi, probStr) {
        if (!Number.isFinite(xLo) || !Number.isFinite(xHi) || xHi <= xLo) return;
        const xc = (xLo + xHi) / 2;
        const yMidPdf = normalPDF(xc, mu, sigma);
        if (yMidPdf <= 1e-12 || !Number.isFinite(yMidPdf)) return;
        const px = mapX(xc);
        const yText = mapY(yMidPdf * 0.38);
        ctx.save();
        ctx.font = 'bold 12px Nunito, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 3;
        ctx.strokeText(probStr, px, yText);
        ctx.fillStyle = '#0f172a';
        ctx.fillText(probStr, px, yText);
        ctx.restore();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(padL, padT, plotW, plotH);

      const y0 = 0;
      const fillCol = 'rgba(59, 130, 196, 0.72)';

      if (mode === 'left' && Number.isFinite(c.a)) {
        fillUnder(ctx, xMin, c.a, mu, sigma, y0, mapX, mapY, fillCol);
      } else if (mode === 'right' && Number.isFinite(c.b)) {
        fillUnder(ctx, c.b, xMax, mu, sigma, y0, mapX, mapY, fillCol);
      } else if (mode === 'between' && Number.isFinite(c.a) && Number.isFinite(c.b)) {
        const lo = Math.min(c.a, c.b);
        const hi = Math.max(c.a, c.b);
        fillUnder(ctx, lo, hi, mu, sigma, y0, mapX, mapY, fillCol);
      } else if (mode === 'two' && Number.isFinite(c.a) && Number.isFinite(c.b)) {
        const lo = Math.min(c.a, c.b);
        const hi = Math.max(c.a, c.b);
        fillUnder(ctx, xMin, lo, mu, sigma, y0, mapX, mapY, fillCol);
        fillUnder(ctx, hi, xMax, mu, sigma, y0, mapX, mapY, fillCol);
      }

      ctx.beginPath();
      let started = false;
      for (let x = xMin; x <= xMax + 1e-9; x += (xMax - xMin) / 240) {
        const py = mapY(normalPDF(x, mu, sigma));
        const px = mapX(x);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (c.ok && Number.isFinite(c.p)) {
        if (mode === 'left' && Number.isFinite(c.a)) {
          drawAreaLabel(xMin, c.a, fmtDeProb(c.p));
        } else if (mode === 'right' && Number.isFinite(c.b)) {
          drawAreaLabel(c.b, xMax, fmtDeProb(c.p));
        } else if (mode === 'between' && Number.isFinite(c.a) && Number.isFinite(c.b)) {
          const lo = Math.min(c.a, c.b);
          const hi = Math.max(c.a, c.b);
          drawAreaLabel(lo, hi, fmtDeProb(c.p));
        } else if (mode === 'two' && Number.isFinite(c.a) && Number.isFinite(c.b) && c.parts && c.parts.length === 2) {
          const lo = Math.min(c.a, c.b);
          const hi = Math.max(c.a, c.b);
          drawAreaLabel(xMin, lo, fmtDeProb(c.parts[0]));
          drawAreaLabel(hi, xMax, fmtDeProb(c.parts[1]));
        }
      }

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, mapY(0));
      ctx.lineTo(padL + plotW, mapY(0));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '11px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const tickStep = (xMax - xMin) <= 20 ? 2 : (xMax - xMin) <= 40 ? 5 : 10;
      for (let tx = Math.ceil(xMin / tickStep) * tickStep; tx <= xMax; tx += tickStep) {
        const px = mapX(tx);
        ctx.beginPath();
        ctx.moveTo(px, mapY(0));
        ctx.lineTo(px, mapY(0) + 4);
        ctx.stroke();
        ctx.fillText(String(Math.round(tx * 10) / 10), px, mapY(0) + 16);
      }

      /** Vertikale Hilfslinie beim Mittelwert μ (fein, strichliert) */
      const xMuPx = mapX(mu);
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xMuPx, padT);
      ctx.lineTo(xMuPx, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      /** σ: zwei horizontale Pfeile von μ zu μ±σ (hellgrün, strichliert; ohne Mittelpunkt) */
      const ySig = padT + plotH * 0.07;
      const xLeft = mapX(mu - sigma);
      const xRight = mapX(mu + sigma);
      const ah = 5;
      const colSig = 'rgba(34, 197, 94, 0.78)';
      const colSigHead = 'rgba(34, 197, 94, 0.9)';
      const colSigLabel = 'rgba(22, 101, 52, 0.92)';

      function arrowHeadLeft(xTip, y) {
        ctx.beginPath();
        ctx.moveTo(xTip, y);
        ctx.lineTo(xTip + ah, y - 2.5);
        ctx.lineTo(xTip + ah, y + 2.5);
        ctx.closePath();
        ctx.fillStyle = colSigHead;
        ctx.fill();
      }
      function arrowHeadRight(xTip, y) {
        ctx.beginPath();
        ctx.moveTo(xTip, y);
        ctx.lineTo(xTip - ah, y - 2.5);
        ctx.lineTo(xTip - ah, y + 2.5);
        ctx.closePath();
        ctx.fillStyle = colSigHead;
        ctx.fill();
      }

      ctx.save();
      ctx.strokeStyle = colSig;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(xMuPx, ySig);
      ctx.lineTo(xLeft, ySig);
      ctx.stroke();
      ctx.setLineDash([]);
      arrowHeadLeft(xLeft, ySig);

      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(xMuPx, ySig);
      ctx.lineTo(xRight, ySig);
      ctx.stroke();
      ctx.setLineDash([]);
      arrowHeadRight(xRight, ySig);
      ctx.restore();

      ctx.font = '10px Nunito, system-ui, sans-serif';
      ctx.fillStyle = colSigLabel;
      ctx.textAlign = 'center';
      ctx.fillText('\u2212\u03c3', (xMuPx + xLeft) / 2, ySig - 8);
      ctx.fillText('+\u03c3', (xMuPx + xRight) / 2, ySig - 8);

      function markX(xv) {
        if (!Number.isFinite(xv)) return;
        const px = mapX(xv);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(px, mapY(0) + 2);
        ctx.lineTo(px - 5, mapY(0) + 10);
        ctx.lineTo(px + 5, mapY(0) + 10);
        ctx.closePath();
        ctx.fill();
      }

      if (mode === 'left') markX(c.a);
      else if (mode === 'right') markX(c.b);
      else if (mode === 'between') {
        markX(Math.min(c.a, c.b));
        markX(Math.max(c.a, c.b));
      } else if (mode === 'two') {
        markX(Math.min(c.a, c.b));
        markX(Math.max(c.a, c.b));
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.fillText('x', padL + plotW / 2, hCss - 8);

      lastPlot = {
        xMin: xMin,
        xMax: xMax,
        padL: padL,
        plotW: plotW,
        yAxisY: mapY(0),
        handles: []
      };
      if (mode === 'left' && Number.isFinite(c.a)) {
        lastPlot.handles.push({ px: mapX(c.a), role: 'a' });
      } else if (mode === 'right' && Number.isFinite(c.b)) {
        lastPlot.handles.push({ px: mapX(c.b), role: 'b' });
      } else if ((mode === 'between' || mode === 'two') && Number.isFinite(c.a) && Number.isFinite(c.b)) {
        const lo = Math.min(c.a, c.b);
        const hi = Math.max(c.a, c.b);
        lastPlot.handles.push({ px: mapX(lo), role: 'lo' });
        lastPlot.handles.push({ px: mapX(hi), role: 'hi' });
      }
    }

    function xFromMouse(mx) {
      if (!lastPlot) return NaN;
      return lastPlot.xMin + (mx - lastPlot.padL) / lastPlot.plotW * (lastPlot.xMax - lastPlot.xMin);
    }

    function hitHandle(mx, my) {
      if (!lastPlot) return null;
      const y0 = lastPlot.yAxisY;
      if (my < y0 - 4 || my > y0 + 18) return null;
      const tol = 14;
      let best = null;
      let bestD = tol + 1;
      for (let i = 0; i < lastPlot.handles.length; i++) {
        const h = lastPlot.handles[i];
        const d = Math.abs(mx - h.px);
        if (d <= tol && d < bestD) {
          bestD = d;
          best = h.role;
        }
      }
      return best;
    }

    function applyDrag(role, xNew) {
      if (!lastPlot || !Number.isFinite(xNew)) return;
      const clamp = function (v, lo, hi) {
        return Math.min(Math.max(v, lo), hi);
      };
      if (role === 'a') {
        aEl.value = fmtInput(clamp(xNew, lastPlot.xMin, lastPlot.xMax));
      } else if (role === 'b') {
        bEl.value = fmtInput(clamp(xNew, lastPlot.xMin, lastPlot.xMax));
      } else if (role === 'lo') {
        const a = nvParseNum(aEl.value);
        const b = nvParseNum(bEl.value);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return;
        const hi = Math.max(a, b);
        const newLo = clamp(xNew, lastPlot.xMin, Math.min(hi, lastPlot.xMax));
        if (a <= b) aEl.value = fmtInput(newLo); else bEl.value = fmtInput(newLo);
      } else if (role === 'hi') {
        const a = nvParseNum(aEl.value);
        const b = nvParseNum(bEl.value);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return;
        const lo = Math.min(a, b);
        const newHi = clamp(xNew, Math.max(lo, lastPlot.xMin), lastPlot.xMax);
        if (a <= b) bEl.value = fmtInput(newHi); else aEl.value = fmtInput(newHi);
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
        const xNew = xFromMouse(mx);
        applyDrag(drag.role, xNew);
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
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    root.__nvRedraw = redraw;
    setMode('between');
  }

  function initAllNvRechner() {
    document.querySelectorAll('.nv-rechner').forEach(initNvRechner);
  }

  window.nvRechnerRedrawAll = function () {
    document.querySelectorAll('.nv-rechner').forEach(function (root) {
      if (typeof root.__nvRedraw === 'function') root.__nvRedraw();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllNvRechner);
  } else {
    initAllNvRechner();
  }
})();
