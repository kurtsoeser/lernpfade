// ══════════════════════════════════════════════
// BINOMIALKOEFFIZIENT (BigInt, Tab „Warum Näherung?“)
// ══════════════════════════════════════════════
function binomialCoefficientBigInt(n, k) {
  if (!Number.isFinite(n) || !Number.isFinite(k)) return null;
  let nn = Math.floor(n);
  let kk = Math.floor(k);
  if (nn < 0 || kk < 0) return null;
  if (kk > nn) return null;
  if (kk === 0 || kk === nn) return 1n;
  if (kk > nn - kk) kk = nn - kk;
  let N = BigInt(nn);
  let K = BigInt(kk);
  let c = 1n;
  for (let i = 0n; i < K; i++) {
    c = c * (N - i) / (i + 1n);
  }
  return c;
}

/** \(\log_{10}\binom{n}{k}\) über Summe der Logarithmen (für Gleitkomma-/10er-Darstellung) */
function binomialCoefficientLog10(n, k) {
  let kk = k < n - k ? k : n - k;
  let s = 0;
  for (let i = 0; i < kk; i++) {
    s += Math.log10(n - i) - Math.log10(i + 1);
  }
  return s;
}

/** Wissenschaftliche Schreibweise aus \(\log_{10}\) (Mantisse · 10^Exponent) */
function formatBinomialScientific(log10c) {
  if (!Number.isFinite(log10c)) return '—';
  if (log10c < -12) return '≈ 0';
  const exp = Math.floor(log10c);
  const mant = Math.pow(10, log10c - exp);
  const mantStr = mant.toPrecision(8).replace('.', ',');
  return '≈ ' + mantStr + ' · 10^' + exp;
}

function updateBinomialCoefficient() {
  const out = document.getElementById('binomCoeffOut');
  const nEl = document.getElementById('binomN');
  const kEl = document.getElementById('binomK');
  if (!out || !nEl || !kEl) return;

  const nMax = 8000;
  let n = parseInt(nEl.value, 10);
  let k = parseInt(kEl.value, 10);

  if (Number.isNaN(n) || Number.isNaN(k)) {
    out.innerHTML = '<span class="binom-err">Bitte gültige ganze Zahlen für \\(n\\) und \\(k\\) eingeben.</span>';
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([out]).catch(function () {});
    }
    return;
  }
  if (n < 0 || k < 0) {
    out.innerHTML = '<span class="binom-err">\\(n\\) und \\(k\\) müssen nichtnegativ sein.</span>';
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([out]).catch(function () {});
    }
    return;
  }
  if (n > nMax) {
    nEl.value = nMax;
    n = nMax;
  }
  if (k > nMax) {
    kEl.value = nMax;
    k = nMax;
  }
  if (k > n) {
    out.innerHTML = '<div class="binom-formula">\\(\\displaystyle\\binom{' + n + '}{' + k + '} = 0\\)</div>' +
      '<span class="binom-err">Es gilt \\(k \\le n\\); sonst ist der Binomialkoeffizient \\(0\\).</span>';
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([out]).catch(function () {});
    }
    return;
  }

  const kEff = k < n - k ? k : n - k;
  if (kEff > 3500) {
    out.innerHTML = '<span class="binom-err">Für \\(\\min(k,\\, n-k) > 3500\\) würde die exakte Berechnung den Browser stark belasten. Bitte wähle kleinere Werte (z.&nbsp;B. \\(k\\) nahe \\(0\\) oder \\(n\\)).</span>';
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([out]).catch(function () {});
    }
    return;
  }

  const tic = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const coeff = binomialCoefficientBigInt(n, k);
  const log10c = binomialCoefficientLog10(n, k);
  const toc = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const ms = Math.round(toc - tic);

  let s = coeff.toString();
  let body;
  if (s.length <= 160) {
    body = s;
  } else {
    body = s.slice(0, 72) + ' … <span style="color:var(--text-light);font-family:\'Nunito\',sans-serif">(' +
      s.length + ' Stellen)</span> … ' + s.slice(-72);
  }

  let floatBlock =
    '<div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(59,130,196,0.2); font-family:\'Nunito\',sans-serif; font-size:0.88rem;">' +
    '<strong>Gleitkomma-Näherung</strong> (wissenschaftliche Schreibweise, ca. 8 gültige Ziffern der Mantisse):<br>' +
    '<span style="font-family:ui-monospace,Consolas,monospace; font-size:0.9rem;">' + formatBinomialScientific(log10c) + '</span>';
  const asNum = Number(coeff);
  if (Number.isFinite(asNum)) {
    floatBlock += '<br><span style="color:var(--text-light); font-size:0.82rem;">Zusätzlich als JavaScript-<code>Number</code> (kann gerundet sein): ' +
      asNum.toExponential(10).replace(/\./g, ',') + '</span>';
  } else {
    floatBlock += '<br><span style="color:var(--text-light); font-size:0.82rem;">Der exakte Ganzzahlwert passt nicht in ein <code>Number</code> — die wissenschaftliche Zeile oben ist die sinnvolle Gleitkomma-Darstellung.</span>';
  }
  floatBlock += '</div>';

  out.innerHTML =
    '<div class="binom-formula">\\(\\displaystyle\\binom{' + n + '}{' + k + '} =\\)</div>' + body + floatBlock +
    (ms > 50 ? '<div style="margin-top:10px;font-size:0.8rem;color:var(--text-light);font-family:\'Nunito\',sans-serif">Berechnet in ca. ' + ms + ' ms</div>' : '');

  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([out]).catch(function () {});
  }
}
