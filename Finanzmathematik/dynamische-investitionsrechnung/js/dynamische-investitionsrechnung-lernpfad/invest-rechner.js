/**
 * Interaktiver Investitionsrechner (Kapitalwert, IKV, Annuität, MIRR)
 */
(function () {
  var N = 5;

  function parseNum(el) {
    if (!el) return 0;
    var s = String(el.value || '').replace(/\s/g, '');
    if (s.indexOf(',') >= 0) {
      s = s.replace(/\./g, '').replace(',', '.');
    }
    var v = parseFloat(s);
    return isFinite(v) ? v : 0;
  }

  function fmtEuro(v) {
    if (!isFinite(v)) return '—';
    return (
      v.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + '\u00a0€'
    );
  }

  function fmtPct(v) {
    if (!isFinite(v)) return '—';
    return (
      (v * 100).toLocaleString('de-DE', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }) + '\u00a0%'
    );
  }

  function npvAt(rate, cfs) {
    if (rate <= -1) return NaN;
    var s = 0;
    for (var t = 0; t < cfs.length; t++) {
      s += cfs[t] / Math.pow(1 + rate, t);
    }
    return s;
  }

  function irrNewton(cfs, tol) {
    tol = tol || 1e-8;
    var r = 0.05;
    for (var it = 0; it < 120; it++) {
      if (r <= -0.999999) r = -0.99;
      var f = npvAt(r, cfs);
      var df = 0;
      for (var t = 1; t < cfs.length; t++) {
        df -= (t * cfs[t]) / Math.pow(1 + r, t + 1);
      }
      if (!isFinite(f) || !isFinite(df) || Math.abs(df) < 1e-18) break;
      var nr = r - f / df;
      if (!isFinite(nr) || Math.abs(nr - r) < tol) return nr;
      r = nr;
    }
    return irrBisection(cfs);
  }

  function irrBisection(cfs) {
    var low = -0.9999;
    var high = 1;
    var fLow = npvAt(low, cfs);
    var fHigh = npvAt(high, cfs);
    var ext = 0;
    while (fLow * fHigh > 0 && ext < 40) {
      high += 1;
      fHigh = npvAt(high, cfs);
      ext++;
    }
    if (fLow * fHigh > 0) return NaN;
    for (var i = 0; i < 150; i++) {
      var mid = (low + high) / 2;
      var fm = npvAt(mid, cfs);
      if (Math.abs(fm) < 1e-10) return mid;
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

  function mirrExcel(cfs, financeRate, reinvestRate) {
    if (financeRate <= -1 || reinvestRate <= -1) return NaN;
    var last = cfs.length - 1;
    if (last < 1) return NaN;
    var pvNeg = 0;
    var fvPos = 0;
    for (var t = 0; t < cfs.length; t++) {
      if (cfs[t] < 0) {
        pvNeg += cfs[t] / Math.pow(1 + financeRate, t);
      }
      if (cfs[t] > 0) {
        fvPos += cfs[t] * Math.pow(1 + reinvestRate, last - t);
      }
    }
    if (pvNeg >= 0 || fvPos <= 0) return NaN;
    return Math.pow(fvPos / -pvNeg, 1 / last) - 1;
  }

  /** Annuität zum Kapitalwert: C₀ = NPV · i(1+i)^n / ((1+i)^n − 1), n = Nutzungsdauer (letztes Jahr mit Zahlung ab t≥1) */
  function annuityFromNpv(npv, rate, nYears) {
    if (nYears < 1 || !isFinite(npv)) return NaN;
    if (Math.abs(rate) < 1e-12) return npv / nYears;
    var one = Math.pow(1 + rate, nYears);
    var fact = (rate * one) / (one - 1);
    return npv * fact;
  }

  function lastProjectYear(inc, exp) {
    var last = 1;
    for (var t = 1; t <= N; t++) {
      if (Math.abs(inc[t]) > 0.005 || Math.abs(exp[t]) > 0.005) last = t;
    }
    return last;
  }

  function readFlows() {
    var inc = [];
    var exp = [];
    for (var t = 0; t <= N; t++) {
      inc[t] = parseNum(document.getElementById('di-inc-' + t));
      exp[t] = parseNum(document.getElementById('di-exp-' + t));
    }
    var cf = [];
    for (var i = 0; i <= N; i++) {
      cf[i] = inc[i] - exp[i];
    }
    return { inc: inc, exp: exp, cf: cf };
  }

  function readRates() {
    var kalk = parseNum(document.getElementById('di-rate-kalk')) / 100;
    var fin = parseNum(document.getElementById('di-rate-fin')) / 100;
    var rein = parseNum(document.getElementById('di-rate-reinvest')) / 100;
    return {
      kalk: kalk,
      fin: isFinite(fin) ? fin : kalk,
      rein: isFinite(rein) ? rein : 0.025
    };
  }

  function update() {
    var r = readRates();
    var flows = readFlows();
    var cf = flows.cf;
    var inc = flows.inc;
    var exp = flows.exp;

    document.getElementById('di-r-kalk').textContent =
      (100 + r.kalk * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + '\u00a0%';
    document.getElementById('di-r-fin').textContent =
      (100 + r.fin * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + '\u00a0%';
    document.getElementById('di-r-reinvest').textContent =
      (100 + r.rein * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + '\u00a0%';

    var sumInc = 0;
    var sumExp = 0;
    var sumCf = 0;
    var sumPv = 0;
    var sumFv = 0;
    var last = N;

    for (var t = 0; t <= N; t++) {
      sumInc += inc[t];
      sumExp += exp[t];
      sumCf += cf[t];
      var pv = cf[t] / Math.pow(1 + r.kalk, t);
      sumPv += pv;
      var fvRe = cf[t] * Math.pow(1 + r.rein, last - t);
      sumFv += fvRe;

      var cellCf = document.getElementById('di-cf-' + t);
      if (cellCf) {
        cellCf.textContent = fmtEuro(cf[t]);
        cellCf.className = 'xls-num' + (cf[t] < 0 ? ' xls-neg' : '');
      }

      var cellPv = document.getElementById('di-pv-' + t);
      var cellFv = document.getElementById('di-fv-' + t);
      if (cellPv) {
        cellPv.textContent = fmtEuro(pv);
        cellPv.className = 'xls-num xls-out' + (pv < 0 ? ' xls-neg' : '');
      }
      if (cellFv) {
        cellFv.textContent = fmtEuro(fvRe);
        cellFv.className = 'xls-num xls-out' + (fvRe < 0 ? ' xls-neg' : '');
      }
    }

    var elSInc = document.getElementById('di-sum-inc');
    var elSExp = document.getElementById('di-sum-exp');
    var elSCf = document.getElementById('di-sum-cf');
    var elSPv = document.getElementById('di-sum-pv');
    var elSFv = document.getElementById('di-sum-fv');
    if (elSInc) elSInc.textContent = fmtEuro(sumInc);
    if (elSExp) elSExp.textContent = fmtEuro(sumExp);
    if (elSCf) {
      elSCf.textContent = fmtEuro(sumCf);
      elSCf.className = sumCf < 0 ? 'xls-neg' : '';
    }
    if (elSPv) {
      elSPv.textContent = fmtEuro(sumPv);
      elSPv.className = sumPv < 0 ? 'xls-neg' : '';
    }
    if (elSFv) elSFv.textContent = fmtEuro(sumFv);

    var nettoBar = 0;
    for (var j = 1; j <= N; j++) {
      nettoBar += cf[j] / Math.pow(1 + r.kalk, j);
    }
    var pv0 = cf[0];
    var kapitalwert = sumPv;

    document.getElementById('di-statisch').textContent = fmtEuro(sumCf);
    document.getElementById('di-dynamisch').textContent = fmtEuro(kapitalwert);
    document.getElementById('di-nettobar').textContent = fmtEuro(nettoBar);
    document.getElementById('di-invest-saldo').textContent = fmtEuro(pv0);
    document.getElementById('di-kapitalwert').textContent = fmtEuro(kapitalwert);

    var ikv = irrNewton(cf);
    var elIkv = document.getElementById('di-ikv');
    var elNpvIkv = document.getElementById('di-npv-ikv');
    if (elIkv) elIkv.textContent = isFinite(ikv) ? fmtPct(ikv) : '—';
    if (elNpvIkv) elNpvIkv.textContent = isFinite(ikv) ? fmtEuro(npvAt(ikv, cf)) : '—';

    var mirr = mirrExcel(cf, r.fin, r.rein);
    var elMirr = document.getElementById('di-mirr');
    if (elMirr) elMirr.textContent = isFinite(mirr) ? fmtPct(mirr) : '—';

    var nProj = lastProjectYear(inc, exp);
    document.getElementById('di-n-proj').textContent = String(nProj);
    var ann = annuityFromNpv(kapitalwert, r.kalk, nProj);
    var elAnn = document.getElementById('di-ann');
    if (elAnn) elAnn.textContent = isFinite(ann) ? fmtEuro(ann) : '—';

  }

  function bind() {
    var ids = ['di-rate-kalk', 'di-rate-fin', 'di-rate-reinvest'];
    for (var t = 0; t <= N; t++) {
      ids.push('di-inc-' + t);
      ids.push('di-exp-' + t);
    }
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('di-rate-kalk')) return;
    bind();
    update();
  });
})();
