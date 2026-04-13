// ══════════════════════════════════════════════
// GEOGEBRA-MODAL (Übungen)
// ══════════════════════════════════════════════
function openGeoGebraModal() {
  const modal = document.getElementById('geogebraModal');
  const frame = document.getElementById('geogebraModalFrame');
  if (frame && frame.dataset.src && !frame.dataset.loaded) {
    frame.src = frame.dataset.src;
    frame.dataset.loaded = '1';
  }
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  if (window.MathJax && MathJax.typesetPromise) {
    var body = document.getElementById('ggModalBody');
    if (body) MathJax.typesetPromise([body]).catch(function () {});
  }
}

function closeGeoGebraModal() {
  const modal = document.getElementById('geogebraModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// ══════════════════════════════════════════════
// EXERCISE A1/A2/A3
// ══════════════════════════════════════════════
function checkA1() {
  const mu = parseNum(document.getElementById('a1_mu').value);
  const sig = parseNum(document.getElementById('a1_sigma').value);
  const korr = parseNum(document.getElementById('a1_korr').value);
  const prob = parseProbability(document.getElementById('a1_prob').value);
  const fb = document.getElementById('fb_a1');
  let correct = 0;
  if (approxEq(mu, 140)) correct++;
  if (approxEq(sig, 9.54, 0.15)) correct++;
  if (approxEq(korr, 150.5)) correct++;
  if (!Number.isNaN(prob) && approxEq(prob, 0.1357, 0.04)) correct++;
  if (correct === 4) {
    fb.className = 'feedback correct';
    fb.innerHTML = '\u2705 Perfekt! P \u2248 13,6 % bzw. 0,136.';
  } else {
    fb.className = 'feedback incorrect';
    fb.innerHTML = '\u274c ' + correct + ' von 4 richtig. Klicke auf \u201eL\u00f6sung\u201c.';
  }
  fb.style.display = 'block';
  if (correct >= 3) checkStation6();
}

function checkA2() {
  const mu = parseNum(document.getElementById('a2_mu').value);
  const sig = parseNum(document.getElementById('a2_sigma').value);
  const lo = parseNum(document.getElementById('a2_low').value);
  const hi = parseNum(document.getElementById('a2_high').value);
  const prob = parseProbability(document.getElementById('a2_prob').value);
  const fb = document.getElementById('fb_a2');
  let correct = 0;
  if (approxEq(mu, 30)) correct++;
  if (approxEq(sig, 5.14, 0.15)) correct++;
  if (approxEq(lo, 24.5)) correct++;
  if (approxEq(hi, 35.5)) correct++;
  if (!Number.isNaN(prob) && approxEq(prob, 0.7154, 0.05)) correct++;
  if (correct === 5) {
    fb.className = 'feedback correct';
    fb.innerHTML = '\u2705 Sehr gut! P \u2248 71,5 % bzw. 0,715.';
  } else if (correct >= 4) {
    fb.className = 'feedback incorrect';
    fb.innerHTML = '\ud83d\udfe0 ' + correct + ' von 5 richtig \u2014 fast! Schau dir die L\u00f6sung an.';
  } else {
    fb.className = 'feedback incorrect';
    fb.innerHTML = '\u274c ' + correct + ' von 5 richtig. Schau dir die L\u00f6sung an.';
  }
  fb.style.display = 'block';
  if (correct >= 4) checkStation6();
}

function checkA3() {
  const mu = parseNum(document.getElementById('a3_mu').value);
  const sig = parseNum(document.getElementById('a3_sigma').value);
  const lo = parseNum(document.getElementById('a3_low').value);
  const hi = parseNum(document.getElementById('a3_high').value);
  const prob = parseProbability(document.getElementById('a3_prob').value);
  const fb = document.getElementById('fb_a3');
  let correct = 0;
  if (approxEq(mu, 50)) correct++;
  if (approxEq(sig, 5)) correct++;
  if (approxEq(lo, 49.5)) correct++;
  if (approxEq(hi, 50.5)) correct++;
  if (!Number.isNaN(prob) && approxEq(prob, 0.0796, 0.025)) correct++;
  if (correct === 5) {
    fb.className = 'feedback correct';
    fb.innerHTML = '\u2705 Richtig! P(X = 50) \u2248 P(49,5 \u2264 X \u2264 50,5) \u2248 8,0 %';
  } else if (correct >= 4) {
    fb.className = 'feedback incorrect';
    fb.innerHTML = '\ud83d\udfe0 ' + correct + ' von 5 richtig \u2014 fast! Klicke auf \u201eL\u00f6sung\u201c.';
  } else {
    fb.className = 'feedback incorrect';
    fb.innerHTML = '\u274c ' + correct + ' von 5 richtig. Klicke auf \u201eL\u00f6sung\u201c.';
  }
  fb.style.display = 'block';
  if (correct >= 3) checkStation6();
}

function checkStation6() {
  station6Count++;
  if (station6Count >= 2) markComplete(6);
}

// ══════════════════════════════════════════════
// GEOGEBRA EXERCISE
// ══════════════════════════════════════════════
function checkGeoGebra() {
  const mu = parseNum(document.getElementById('gg_mu').value);
  const sig = parseNum(document.getElementById('gg_sigma').value);
  const grenze = parseNum(document.getElementById('gg_grenze').value);
  const result = parseNum(document.getElementById('gg_result').value);

  const fb = document.getElementById('fb_gg');
  let correct = 0;

  if (approxEq(mu, 50)) correct++;
  if (approxEq(sig, 5)) correct++;
  if (approxEq(grenze, 55.5)) correct++;
  if (approxEq(result, 0.8643, 0.02)) correct++;

  if (correct >= 3) {
    fb.className = 'feedback correct';
    fb.innerHTML = '\u2705 Sehr gut! Du kannst GeoGebra korrekt f\u00fcr die Normalapproximation einsetzen.' +
      (correct < 4 ? '<br>Kleiner Hinweis: Pr\u00fcfe nochmal alle Werte.' : '');
  } else {
    fb.className = 'feedback incorrect';
    fb.innerHTML = '\u274c ' + correct + ' von 4 richtig. Klicke auf \u201eL\u00f6sung\u201c f\u00fcr die vollst\u00e4ndige Rechnung.';
  }
  fb.style.display = 'block';
}
