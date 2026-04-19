/**
 * Kapitalwertkurve NPV(i) — inkl. Anschaffungspreis (Parallelverschiebung)
 */
(function () {
  var BASIS_PREIS = 260000;
  var BASE_CF = [-BASIS_PREIS, 15000, 60000, 20000, 60000, 120000];

  var SCENARIOS = {
    standard: {
      label: 'Einführungsbeispiel (Standard)',
      cf: BASE_CF.slice()
    },
    verkauf: {
      label: 'Sensitivität: Verkaufserlös +25.000 \u20ac (Jahr 5)',
      cf: (function () {
        var a = BASE_CF.slice();
        a[5] += 25000;
        return a;
      })()
    },
    kosten: {
      label: 'Sensitivität: +10.000 \u20ac Auszahlung in Jahr 1',
      cf: (function () {
        var a = BASE_CF.slice();
        a[1] -= 10000;
        return a;
      })()
    }
  };

  var refCf = BASE_CF.slice();
  var currentCf = BASE_CF.slice();
  var refIrr = NaN;
  var currentIrr = NaN;
  var canvas;
  var ctx;
  var wCss;
  var hCss = 340;

  function npvAt(rate, cf) {
    if (rate <= -0.999999) return NaN;
    var s = 0;
    for (var t = 0; t < cf.length; t++) {
      s += cf[t] / Math.pow(1 + rate, t);
    }
    return s;
  }

  function irrBisection(cf) {
    var low = -0.9999;
    var high = 0.5;
    var fLow = npvAt(low, cf);
    var fHigh = npvAt(high, cf);
    var ext = 0;
    while (fLow * fHigh > 0 && ext < 50) {
      high += 0.5;
      fHigh = npvAt(high, cf);
      ext++;
    }
    if (fLow * fHigh > 0) return NaN;
    for (var i = 0; i < 160; i++) {
      var mid = (low + high) / 2;
      var fm = npvAt(mid, cf);
      if (Math.abs(fm) < 1e-9) return mid;
      if (fLow * fm <= 0) {
        high = mid;
        fHigh = fm;
      } else {
        low = mid;
        fLow = fm;
      }
    }
    return (low + high) / 2;
  }

  function fmtEuro(v) {
    if (!isFinite(v)) return '\u2014';
    return (
      v.toLocaleString('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }) + '\u00a0\u20ac'
    );
  }

  function fmtPct(rate) {
    if (!isFinite(rate)) return '\u2014';
    return (
      (rate * 100).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3
      }) + '\u00a0%'
    );
  }

  function getScenarioCf() {
    var sel = document.getElementById('kw-scenario');
    var key = sel && sel.value ? sel.value : 'standard';
    var sc = SCENARIOS[key];
    return sc ? sc.cf.slice() : BASE_CF.slice();
  }

  function getPrice() {
    var el = document.getElementById('kw-price-slider');
    if (!el) return BASIS_PREIS;
    var p = parseInt(el.value, 10);
    if (!isFinite(p) || p < 1) return BASIS_PREIS;
    return p;
  }

  function syncFlows() {
    var scen = getScenarioCf();
    refCf = scen.slice();
    refCf[0] = -BASIS_PREIS;

    currentCf = scen.slice();
    currentCf[0] = -getPrice();

    refIrr = irrBisection(refCf);
    currentIrr = irrBisection(currentCf);
  }

  function getSliderRate() {
    var el = document.getElementById('kw-rate-slider');
    if (!el) return 0.03;
    return parseFloat(el.value) / 100;
  }

  function priceDiffers() {
    return Math.abs(getPrice() - BASIS_PREIS) >= 1;
  }

  function updateReadout() {
    var r = getSliderRate();
    var price = getPrice();
    var elPrice = document.getElementById('kw-price-read');
    var elR = document.getElementById('kw-rate-read');
    var elK = document.getElementById('kw-npv-read');
    if (elPrice) elPrice.textContent = fmtEuro(price);
    if (elR) elR.textContent = fmtPct(r);
    if (elK) {
      var kw = npvAt(r, currentCf);
      elK.textContent = fmtEuro(kw);
      elK.className = kw >= 0 ? 'kw-pos' : 'kw-neg';
    }

    var diffRow = document.getElementById('kw-readout-compare');
    var singleRow = document.getElementById('kw-readout-single');
    var elDelta = document.getElementById('kw-delta-read');
    var elIrrRef = document.getElementById('kw-irr-ref-read');
    var elIrr = document.getElementById('kw-irr-read');
    var elIrrOnly = document.getElementById('kw-irr-read-only');

    if (priceDiffers()) {
      if (diffRow) diffRow.style.display = 'flex';
      if (singleRow) singleRow.style.display = 'none';
      var deltaKw = currentCf[0] - refCf[0];
      if (elDelta) {
        elDelta.textContent = fmtEuro(deltaKw);
        elDelta.className = deltaKw >= 0 ? 'kw-pos' : 'kw-neg';
      }
      if (elIrrRef) elIrrRef.textContent = fmtPct(refIrr);
      if (elIrr) elIrr.textContent = fmtPct(currentIrr);
    } else {
      if (diffRow) diffRow.style.display = 'none';
      if (singleRow) singleRow.style.display = 'flex';
      if (elIrrOnly) elIrrOnly.textContent = fmtPct(currentIrr);
    }
  }

  function sampleCurve(cf, iMin, iMax, steps) {
    var pts = [];
    for (var s = 0; s <= steps; s++) {
      var ir = iMin + (s / steps) * (iMax - iMin);
      var y = npvAt(ir, cf);
      if (isFinite(y)) pts.push({ i: ir, npv: y });
    }
    return pts;
  }

  function yBoundsFromPts(a, b) {
    var yMin = Infinity;
    var yMax = -Infinity;
    function scan(pts) {
      for (var i = 0; i < pts.length; i++) {
        yMin = Math.min(yMin, pts[i].npv);
        yMax = Math.max(yMax, pts[i].npv);
      }
    }
    scan(a);
    if (b && b.length) scan(b);
    var padY = Math.max(5000, (yMax - yMin) * 0.12);
    yMin -= padY;
    yMax += padY;
    if (yMin > 0) yMin = Math.min(0, yMin - 2000);
    if (yMax < 0) yMax = Math.max(0, yMax + 2000);
    return { yMin: yMin, yMax: yMax };
  }

  function draw() {
    canvas = document.getElementById('kwCurveCanvas');
    if (!canvas || !canvas.getContext) return;
    ctx = canvas.getContext('2d');
    var wrap = canvas.parentElement;
    wCss = wrap ? Math.min(920, Math.max(280, wrap.clientWidth - 4)) : 640;
    var dpr = typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1;
    canvas.width = Math.floor(wCss * dpr);
    canvas.height = Math.floor(hCss * dpr);
    canvas.style.width = wCss + 'px';
    canvas.style.height = hCss + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, wCss, hCss);

    var padL = 58;
    var padR = 22;
    var padT = 28;
    var padB = 46;
    var gw = wCss - padL - padR;
    var gh = hCss - padT - padB;

    var iMin = 0;
    var iMax = 0.1;
    var steps = 180;
    var showRef = priceDiffers();
    var ptsRef = sampleCurve(refCf, iMin, iMax, steps);
    var ptsCur = sampleCurve(currentCf, iMin, iMax, steps);
    var bounds = yBoundsFromPts(ptsCur, showRef ? ptsRef : []);
    var yMin = bounds.yMin;
    var yMax = bounds.yMax;

    function xPix(ir) {
      return padL + ((ir - iMin) / (iMax - iMin)) * gw;
    }
    function yPix(npv) {
      return padT + (1 - (npv - yMin) / (yMax - yMin)) * gh;
    }

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, wCss, hCss);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (var g = 0; g <= 5; g++) {
      var yi = padT + (g / 5) * gh;
      ctx.beginPath();
      ctx.moveTo(padL, yi);
      ctx.lineTo(padL + gw, yi);
      ctx.stroke();
    }

    function drawPolyline(pts, color, width, dashed) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dashed || []);
      ctx.beginPath();
      for (var p = 0; p < pts.length; p++) {
        var px = xPix(pts[p].i);
        var py = yPix(pts[p].npv);
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (showRef) {
      drawPolyline(ptsRef, '#212121', 2, [7, 5]);
    }
    drawPolyline(ptsCur, '#1976d2', showRef ? 2.5 : 2.5, []);

    var y0 = yPix(0);
    if (y0 >= padT && y0 <= padT + gh) {
      ctx.strokeStyle = '#757575';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, y0);
      ctx.lineTo(padL + gw, y0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#616161';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('KW = 0', padL + gw - 54, y0 - 6);
    }

    function drawIrrLine(irr, color, dashed, label) {
      if (!isFinite(irr) || irr <= iMin || irr >= iMax) return;
      var xIrr = xPix(irr);
      ctx.strokeStyle = color;
      ctx.setLineDash(dashed ? [4, 3] : []);
      ctx.lineWidth = dashed ? 1.3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(xIrr, padT);
      ctx.lineTo(xIrr, padT + gh);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, xIrr, padT + gh + 28);
    }

    if (showRef && isFinite(refIrr) && isFinite(currentIrr)) {
      var irrClose = Math.abs(refIrr - currentIrr) < 0.00015;
      if (!irrClose) drawIrrLine(refIrr, '#78909c', true, 'IKV Basis');
      drawIrrLine(currentIrr, '#2e7d32', false, irrClose ? 'IKV' : 'IKV');
    } else {
      drawIrrLine(currentIrr, '#2e7d32', false, 'IKV');
    }

    var rSel = getSliderRate();
    if (rSel >= iMin && rSel <= iMax) {
      if (showRef) {
        var kwRef = npvAt(rSel, refCf);
        var mrx = xPix(rSel);
        var mry = yPix(kwRef);
        ctx.fillStyle = 'rgba(120,120,120,0.35)';
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mrx, mry, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      var kwSel = npvAt(rSel, currentCf);
      var mx = xPix(rSel);
      var my = yPix(kwSel);
      ctx.fillStyle = '#f57c00';
      ctx.strokeStyle = '#e65100';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#bf360c';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      var tx = mx + 10;
      if (tx > wCss - 120) tx = mx - 115;
      ctx.fillText('gew\u00e4hlter Zins', tx, my - 10);
    }

    ctx.fillStyle = '#333';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Kalkulatorischer Zinssatz  i  (p.a.)', padL + gw / 2, hCss - 10);

    ctx.save();
    ctx.translate(16, padT + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Kapitalwert in \u20ac', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#555';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    for (var xi = 0; xi <= 10; xi += 2) {
      var irx = xi / 100;
      var xx = xPix(irx);
      ctx.fillText(xi + '%', xx, padT + gh + 16);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#555';
    var ticksY = 4;
    for (var gy = 0; gy <= ticksY; gy++) {
      var ty = gy / ticksY;
      var vy = yMax - ty * (yMax - yMin);
      var yy = padT + ty * gh;
      ctx.fillText(
        (vy / 1000).toLocaleString('de-DE', { maximumFractionDigits: 0 }) + 'k \u20ac',
        padL - 6,
        yy + 4
      );
    }
  }

  function redraw() {
    syncFlows();
    updateReadout();
    draw();
  }

  window.kwKurveRedraw = redraw;

  function bind() {
    var sl = document.getElementById('kw-rate-slider');
    var pr = document.getElementById('kw-price-slider');
    var sc = document.getElementById('kw-scenario');
    if (sl) {
      sl.addEventListener('input', function () {
        sl.setAttribute('aria-valuenow', sl.value);
        updateReadout();
        draw();
      });
    }
    if (pr) {
      pr.addEventListener('input', function () {
        pr.setAttribute('aria-valuenow', pr.value);
        redraw();
      });
    }
    if (sc) {
      sc.addEventListener('change', redraw);
    }
    window.addEventListener(
      'resize',
      function () {
        clearTimeout(window._kwResizeT);
        window._kwResizeT = setTimeout(draw, 120);
      },
      { passive: true }
    );

    var panel = document.getElementById('panel1');
    if (panel && typeof IntersectionObserver !== 'undefined') {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) requestAnimationFrame(draw);
          });
        },
        { threshold: 0.08 }
      );
      obs.observe(panel);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('kwCurveCanvas')) return;
    bind();
    redraw();
  });
})();
