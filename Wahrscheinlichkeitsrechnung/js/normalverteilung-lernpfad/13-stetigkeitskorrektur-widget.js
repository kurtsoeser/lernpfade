// ══════════════════════════════════════════════
// STETIGKEITSKORREKTUR — natives Canvas-Widget (Tab „Überführung“)
// ══════════════════════════════════════════════
(function () {
  'use strict';

  const N_FIXED = 20;
  const K_LO = 6;
  const K_HI = 9;
  const A_NO = 6;
  const B_NO = 9;
  const A_CO = 5.5;
  const B_CO = 9.5;

  function binomPMF(k, n, p) {
    let logP = 0;
    for (let i = 0; i < k; i++) {
      logP += Math.log(n - i) - Math.log(i + 1);
    }
    logP += k * Math.log(p) + (n - k) * Math.log(1 - p);
    return Math.exp(logP);
  }

  function normalPDF(x, mu, sigma) {
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
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

  function normalProbBetween(a, b, mu, sigma) {
    if (sigma <= 0) return 0;
    return normalCDF((b - mu) / sigma) - normalCDF((a - mu) / sigma);
  }

  function fmtDe(x, digits) {
    return x.toFixed(digits).replace('.', ',');
  }

  let canvas;
  let ctx;
  let resizeObs;

  function binomSumRange(n, p, k0, k1) {
    let s = 0;
    for (let k = k0; k <= k1; k++) {
      s += binomPMF(k, n, p);
    }
    return s;
  }

  function fillUnderNormal(ctx2, x0, x1, mu, sigma, yBottom, mapX, mapY, rgbaFill) {
    const step = 0.06;
    ctx2.beginPath();
    ctx2.moveTo(mapX(x0), mapY(yBottom));
    for (let x = x0; x <= x1 + 1e-9; x += step) {
      ctx2.lineTo(mapX(x), mapY(normalPDF(x, mu, sigma)));
    }
    ctx2.lineTo(mapX(x1), mapY(yBottom));
    ctx2.closePath();
    ctx2.fillStyle = rgbaFill;
    ctx2.fill();
  }

  function draw() {
    if (!canvas || !ctx) return;

    const wrap = canvas.parentElement;
    const wCss = wrap.clientWidth || 900;
    const hCss = Math.round(wCss * (520 / 900));
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = wCss + 'px';
    canvas.style.height = hCss + 'px';
    canvas.width = Math.round(wCss * dpr);
    canvas.height = Math.round(hCss * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pEl = document.getElementById('skSliderP');
    if (!pEl) return;

    const p = parseInt(pEl.value, 10) / 100;
    const step = getSkStep();
    pEl.setAttribute('aria-valuenow', String(Math.round(p * 100) / 100));

    const mu = N_FIXED * p;
    const sigma = Math.sqrt(N_FIXED * p * (1 - p));

    let yMax = 0.01;
    for (let k = 0; k <= N_FIXED; k++) {
      yMax = Math.max(yMax, binomPMF(k, N_FIXED, p));
    }
    for (let x = 0; x <= N_FIXED; x += 0.2) {
      yMax = Math.max(yMax, normalPDF(x, mu, sigma));
    }
    yMax *= 1.08;
    const yMin = -0.05;
    const xMin = -1;
    const xMax = 19;

    const padL = 48;
    const padR = 18;
    const padT = 14;
    const padB = 36;
    const plotW = wCss - padL - padR;
    const plotH = hCss - padT - padB;

    function mapX(x) {
      return padL + ((x - xMin) / (xMax - xMin)) * plotW;
    }
    function mapY(y) {
      return padT + (1 - (y - yMin) / (yMax - yMin)) * plotH;
    }

    ctx.clearRect(0, 0, wCss, hCss);

    // Achsen-Hintergrund
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(padL, padT, plotW, plotH);

    /** Unterkante der Balken und der Integralflächen: x-Achse bei \(y = 0\) (nicht \(y_{\min}\)). */
    const yBarBase = 0;

    // Flächen unter der Normalverteilung (hinter Balken) — hohe Deckkraft (Alpha), damit Flächen gut sichtbar sind
    if (step >= 4) {
      fillUnderNormal(ctx, A_CO, B_CO, mu, sigma, yBarBase, mapX, mapY, 'rgba(234, 88, 12, 0.82)');
    }
    if (step >= 2) {
      fillUnderNormal(ctx, A_NO, B_NO, mu, sigma, yBarBase, mapX, mapY,
        step >= 4 ? 'rgba(15, 118, 42, 0.78)' : 'rgba(46, 125, 50, 0.72)');
    }
    if (step === 3) {
      fillUnderNormal(ctx, A_CO, A_NO, mu, sigma, yBarBase, mapX, mapY, 'rgba(30, 64, 175, 0.82)');
      fillUnderNormal(ctx, B_NO, B_CO, mu, sigma, yBarBase, mapX, mapY, 'rgba(30, 64, 175, 0.82)');
    }

    // Balken (Binomial)
    for (let k = 0; k <= N_FIXED; k++) {
      const h = binomPMF(k, N_FIXED, p);
      const x1 = mapX(k - 0.5);
      const x2 = mapX(k + 0.5);
      const yt = mapY(h);
      const yb = mapY(yBarBase);
      const inRange = k >= K_LO && k <= K_HI;
      ctx.beginPath();
      ctx.rect(x1, yt, x2 - x1, yb - yt);
      if (inRange && step >= 0) {
        ctx.fillStyle = 'rgba(139, 69, 19, 0.72)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(101, 50, 14, 0.95)';
      } else {
        ctx.fillStyle = 'rgba(255, 245, 235, 0.95)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(180, 90, 70, 0.85)';
      }
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Normalverteilungskurve
    if (step >= 1) {
      ctx.beginPath();
      let started = false;
      for (let x = xMin; x <= xMax + 0.01; x += 0.04) {
        const y = normalPDF(x, mu, sigma);
        const px = mapX(x);
        const py = mapY(y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Achsen
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, mapY(0));
    ctx.lineTo(padL + plotW, mapY(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.stroke();

    ctx.fillStyle = '#444';
    ctx.font = '11px Nunito, system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let t = 0; t <= 18; t += 2) {
      const tx = mapX(t);
      ctx.beginPath();
      ctx.moveTo(tx, mapY(0));
      ctx.lineTo(tx, mapY(0) + 4);
      ctx.stroke();
      ctx.fillText(String(t), tx, mapY(0) + 16);
    }

    ctx.textAlign = 'right';
    for (let v = 0; v <= 0.4 + 1e-9; v += 0.05) {
      const ty = mapY(v);
      ctx.beginPath();
      ctx.moveTo(padL - 4, ty);
      ctx.lineTo(padL, ty);
      ctx.stroke();
      ctx.fillText(fmtDe(v, 2), padL - 8, ty + 4);
    }

    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Wahrscheinlichkeitsdichte', 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillText('k', padL + plotW / 2, hCss - 10);

    updateFormulas(p, sigma, step, mu);
  }

  function updateFormulas(p, sigma, step, mu) {
    const binSum = binomSumRange(N_FIXED, p, K_LO, K_HI);
    const intNo = normalProbBetween(A_NO, B_NO, mu, sigma);
    const intCo = normalProbBetween(A_CO, B_CO, mu, sigma);

    const elB = document.getElementById('skLineBinom');
    const elN = document.getElementById('skLineIntNo');
    const elC = document.getElementById('skLineIntCorr');
    const elStep = document.getElementById('skStepHint');
    const valP = document.getElementById('skValP');

    if (valP) valP.textContent = fmtDe(p, 2);

    if (elB) {
      elB.innerHTML =
        '<span class="sk-formula-binomial">Binomialverteilung: \\(P(6 \\le X \\le 9) = ' +
        'P(X=6)+P(X=7)+P(X=8)+P(X=9) = ' + fmtDe(binSum, 2) + '\\)</span>';
    }
    if (elN) {
      if (step >= 2) {
        elN.style.display = 'block';
        elN.innerHTML =
          '<span class="sk-formula-green">\\(\\displaystyle\\int_{6}^{9} N(x)\\,\\mathrm{d}x = ' +
          fmtDe(intNo, 2) + '\\)</span>';
      } else {
        elN.style.display = 'none';
      }
    }
    if (elC) {
      if (step >= 4) {
        elC.style.display = 'block';
        elC.innerHTML =
          '<span class="sk-formula-amber">\\(\\displaystyle\\int_{5{,}5}^{9{,}5} N(x)\\,\\mathrm{d}x = ' +
          fmtDe(intCo, 2) + '\\)</span>';
      } else {
        elC.style.display = 'none';
      }
    }

    const hints = [
      'Schritt 0: Ausgangspunkt — nur die Binomialverteilung \\(B(20;\\, p)\\), Bereich \\(6 \\le X \\le 9\\) hervorgehoben.',
      'Schritt 1: Dazu die zugehörige Normalverteilung \\(N(\\mu,\\sigma)\\) mit \\(\\mu = n\\cdot p\\), \\(\\sigma = \\sqrt{n\\cdot p\\cdot(1-p)}\\).',
      'Schritt 2: Fläche unter der Kurve von \\(6\\) bis \\(9\\) <em>ohne</em> Stetigkeitskorrektur — oft zu klein gegenüber der Binomialsumme.',
      'Schritt 3: Korrekturrechtecke (blaue Streifen): die „fehlenden“ Ränder \\([5{,}5;\\,6]\\) und \\([9;\\,9{,}5]\\) unter der Dichte.',
      'Schritt 4: Fläche von \\(5{,}5\\) bis \\(9{,}5\\) <em>mit</em> Stetigkeitskorrektur — nah an der Binomialwahrscheinlichkeit.'
    ];
    if (elStep) elStep.innerHTML = hints[step] || '';

    if (window.MathJax && MathJax.typesetPromise) {
      const box = document.getElementById('skFormulas');
      const hint = document.getElementById('skStepHint');
      const nodes = [];
      if (box) nodes.push(box);
      if (hint) nodes.push(hint);
      if (nodes.length) MathJax.typesetPromise(nodes).catch(function () {});
    }
  }

  function getSkStep() {
    const active = document.querySelector('.sk-step-btn.active');
    if (active) {
      const s = parseInt(active.getAttribute('data-step'), 10);
      if (!Number.isNaN(s) && s >= 0 && s <= 4) return s;
    }
    return 0;
  }

  function setSkStep(step) {
    const s = Math.max(0, Math.min(4, parseInt(step, 10) || 0));
    document.querySelectorAll('.sk-step-btn').forEach(function (btn) {
      const n = parseInt(btn.getAttribute('data-step'), 10);
      const on = n === s;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    draw();
  }
  window.setSkStep = setSkStep;

  function skWidgetResize() {
    draw();
  }
  window.skWidgetResize = skWidgetResize;

  function skWidgetReset() {
    const pEl = document.getElementById('skSliderP');
    if (pEl) pEl.value = '50';
    setSkStep(0);
  }
  window.skWidgetReset = skWidgetReset;

  function init() {
    canvas = document.getElementById('skCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    const pEl = document.getElementById('skSliderP');
    if (pEl) pEl.addEventListener('input', draw);

    document.querySelectorAll('.sk-step-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const s = parseInt(btn.getAttribute('data-step'), 10);
        setSkStep(s);
      });
    });

    window.addEventListener('resize', draw);
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      resizeObs = new ResizeObserver(function () {
        draw();
      });
      resizeObs.observe(canvas.parentElement);
    }

    draw();
    setTimeout(draw, 320);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
