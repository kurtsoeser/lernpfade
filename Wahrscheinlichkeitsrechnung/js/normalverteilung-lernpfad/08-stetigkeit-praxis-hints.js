function checkStetigkeitskorrektur() {
  const a = parseNum(document.getElementById('sk_a').value);
  const b1 = parseNum(document.getElementById('sk_b1').value);
  const b2 = parseNum(document.getElementById('sk_b2').value);
  const c = parseNum(document.getElementById('sk_c').value);
  const d = parseNum(document.getElementById('sk_d').value);

  const fb = document.getElementById('fb_sk');
  let errors = [];
  let correct = 0;

  if (approxEq(a, 12.5)) correct++; else errors.push('a) P(X \u2264 12) \u2192 P(X \u2264 12,5)');
  if (approxEq(b1, 19.5) && approxEq(b2, 20.5)) correct++; else errors.push('b) P(X = 20) \u2192 P(19,5 \u2264 X \u2264 20,5)');
  if (approxEq(c, 29.5)) correct++; else errors.push('c) P(X \u2265 30) \u2192 P(X \u2265 29,5)');
  if (approxEq(d, 45.5)) correct++; else errors.push('d) P(X > 45) \u2192 P(X \u2265 45,5)');

  if (correct === 4) {
    fb.className = 'feedback correct';
    fb.innerHTML = '\u2705 Alles richtig! Du beherrschst die Stetigkeitskorrektur.';
    markComplete(4);
  } else {
    fb.className = 'feedback incorrect';
    fb.innerHTML = '\u274c ' + correct + ' von 4 richtig. Korrektur:<br>' + errors.join('<br>');
  }
  fb.style.display = 'block';
}

function showHint(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ══════════════════════════════════════════════
// PRAXIS EXERCISE
// ══════════════════════════════════════════════
function checkPraxis() {
  const np = parseNum(document.getElementById('praxis_np').value);
  const nq = parseNum(document.getElementById('praxis_nq').value);
  const mu = parseNum(document.getElementById('praxis_mu').value);
  const sig = parseNum(document.getElementById('praxis_sigma').value);
  const korr = parseNum(document.getElementById('praxis_korrektur').value);
  const prob = parseProbability(document.getElementById('praxis_prob').value);
  const zOptRaw = document.getElementById('praxis_z').value.trim();
  const zOpt = zOptRaw ? parseNum(zOptRaw) : NaN;

  const fb = document.getElementById('fb_praxis');
  let correct = 0;
  let details = [];

  if (approxEq(np, 255)) correct++; else details.push('n\u00b7p = 300 \u00b7 0,85 = 255');
  if (approxEq(nq, 45)) correct++; else details.push('n\u00b7(1\u2212p) = 300 \u00b7 0,15 = 45');
  if (approxEq(mu, 255)) correct++; else details.push('\u03bc = 255');
  if (approxEq(sig, 6.18, 0.15)) correct++; else details.push('\u03c3 = \u221a(300\u00b70,85\u00b70,15) = \u221a38,25 \u2248 6,18');
  if (approxEq(korr, 260.5)) correct++; else details.push('Stetigkeitskorrektur: 260 + 0,5 = 260,5');
  if (!Number.isNaN(prob) && approxEq(prob, 0.8133, 0.03)) correct++;
  else details.push('Wahrscheinlichkeit: im GeoGebra-Rechner P(X \u2264 260,5) \u2248 0,813 (bzw. 81,3 %)');

  let zExtra = '';
  if (zOptRaw) {
    if (!Number.isNaN(zOpt) && approxEq(zOpt, 0.89, 0.15)) {
      zExtra = '<br><span style="color:var(--green)">\u2705 Optional: z \u2248 0,89 passt zur Standardisierung.</span>';
    } else {
      zExtra = '<br><span style="color:var(--text-light)">Optional: z = (260,5 \u2212 255) / 6,18 \u2248 0,89</span>';
    }
  }

  if (correct >= 5) {
    fb.className = 'feedback correct';
    fb.innerHTML = '\u2705 Ausgezeichnet! ' + correct + ' von 6 richtig.' +
      (details.length > 0 ? '<br>Kleine Korrektur: ' + details.join(', ') : '') +
      '<br>P(X \u2264 260,5) \u2248 81,3 % (Normalverteilungsrechner).' + zExtra;
    markComplete(5);
  } else if (correct >= 3) {
    fb.className = 'feedback incorrect';
    fb.innerHTML = '\ud83d\udfe0 ' + correct + ' von 6 richtig \u2014 fast! Korrekturen:<br>' + details.join('<br>') + zExtra;
  } else {
    fb.className = 'feedback incorrect';
    fb.innerHTML = '\u274c ' + correct + ' von 6 richtig. Schau dir den Tipp an.<br>' + details.join('<br>') + zExtra;
  }
  fb.style.display = 'block';
}
