// ══════════════════════════════════════════════
// PDF-Export: Zusammenfassung + Lernergebnisse (jsPDF)
// ══════════════════════════════════════════════

const PDF_SUMMARY_POINTS = [
  'Die Binomialverteilung ist diskret (Balkendiagramm), die Normalverteilung ist stetig (Glockenkurve).',
  'Die Normalapproximation ist nur sinnvoll, wenn n*p >= 5 und n*(1-p) >= 5 (Faustregel).',
  'Parameter der Naeherung: mu = n*p, sigma = sqrt(n*p*(1-p)).',
  'Beim Uebergang diskret zu stetig: Stetigkeitskorrektur mit +/- 0,5 bei Grenzen.',
  'Praxis: Faustregel pruefen, mu und sigma berechnen, korrigierte Grenzen im Normalverteilungsrechner.'
];

function pdfEscape(str) {
  if (str == null) return '';
  return String(str)
    .replace(/\u00e4/g, 'ae')
    .replace(/\u00f6/g, 'oe')
    .replace(/\u00fc/g, 'ue')
    .replace(/\u00df/g, 'ss')
    .replace(/\u2013|\u2014/g, '-');
}

/** LaTeX/MJ-Spuren in Abschlussquiz-Text fuer PDF vereinfachen */
function pdfPlainQuizText(s) {
  if (!s) return '';
  let t = String(s);
  t = t.replace(/\\[()\[\]]/g, '');
  t = t.replace(/\\cdot/g, ' * ');
  t = t.replace(/\\sigma/g, 'sigma');
  t = t.replace(/\\mu/g, 'mu');
  t = t.replace(/\\Phi/g, 'Phi');
  t = t.replace(/\\leq/g, '<=');
  t = t.replace(/\\geq/g, '>=');
  t = t.replace(/\\lt/g, '<');
  t = t.replace(/\\gt/g, '>');
  t = t.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
  t = t.replace(/\{([0-9.,]+)\}/g, '$1');
  t = t.replace(/[{}]/g, '');
  t = t.replace(/\\[a-zA-Z]+/g, '');
  t = t.replace(/\s+/g, ' ').trim();
  return pdfEscape(t);
}

function getQuizSelectedIdx(quizId) {
  const container = document.querySelector('[data-quiz="' + quizId + '"]');
  if (!container) return null;
  const sel = container.querySelector('.quiz-option.selected');
  if (!sel) return null;
  return parseInt(sel.getAttribute('data-idx'), 10);
}

function scoreVorwissen() {
  const ids = ['q1_1', 'q1_2'];
  let ok = 0;
  ids.forEach(function (qid) {
    const container = document.querySelector('[data-quiz="' + qid + '"]');
    if (!container) return;
    const correct = parseInt(container.getAttribute('data-correct'), 10);
    const idx = getQuizSelectedIdx(qid);
    if (idx !== null && idx === correct) ok++;
  });
  return { ok: ok, total: 2 };
}

function scoreRuleExercise() {
  const map = { rule_a: 0, rule_b: 1, rule_c: 0, rule_d: 1 };
  let ok = 0;
  Object.keys(map).forEach(function (qid) {
    const idx = getQuizSelectedIdx(qid);
    if (idx !== null && idx === map[qid]) ok++;
  });
  return { ok: ok, total: 4 };
}

function scoreStetigkeit() {
  const a = parseNum(document.getElementById('sk_a').value);
  const b1 = parseNum(document.getElementById('sk_b1').value);
  const b2 = parseNum(document.getElementById('sk_b2').value);
  const c = parseNum(document.getElementById('sk_c').value);
  const d = parseNum(document.getElementById('sk_d').value);
  let ok = 0;
  if (approxEq(a, 12.5)) ok++;
  if (approxEq(b1, 19.5) && approxEq(b2, 20.5)) ok++;
  if (approxEq(c, 29.5)) ok++;
  if (approxEq(d, 45.5)) ok++;
  return { ok: ok, total: 4 };
}

function scorePraxis() {
  const np = parseNum(document.getElementById('praxis_np').value);
  const nq = parseNum(document.getElementById('praxis_nq').value);
  const mu = parseNum(document.getElementById('praxis_mu').value);
  const sig = parseNum(document.getElementById('praxis_sigma').value);
  const korr = parseNum(document.getElementById('praxis_korrektur').value);
  const prob = parseProbability(document.getElementById('praxis_prob').value);
  let ok = 0;
  if (approxEq(np, 255)) ok++;
  if (approxEq(nq, 45)) ok++;
  if (approxEq(mu, 255)) ok++;
  if (approxEq(sig, 6.18, 0.15)) ok++;
  if (approxEq(korr, 260.5)) ok++;
  if (!Number.isNaN(prob) && approxEq(prob, 0.8133, 0.03)) ok++;
  return { ok: ok, total: 6 };
}

function scoreA1() {
  const mu = parseNum(document.getElementById('a1_mu').value);
  const sig = parseNum(document.getElementById('a1_sigma').value);
  const korr = parseNum(document.getElementById('a1_korr').value);
  const prob = parseProbability(document.getElementById('a1_prob').value);
  let ok = 0;
  if (approxEq(mu, 140)) ok++;
  if (approxEq(sig, 9.54, 0.15)) ok++;
  if (approxEq(korr, 150.5)) ok++;
  if (!Number.isNaN(prob) && approxEq(prob, 0.1357, 0.04)) ok++;
  return { ok: ok, total: 4 };
}

function scoreA2() {
  const mu = parseNum(document.getElementById('a2_mu').value);
  const sig = parseNum(document.getElementById('a2_sigma').value);
  const lo = parseNum(document.getElementById('a2_low').value);
  const hi = parseNum(document.getElementById('a2_high').value);
  const prob = parseProbability(document.getElementById('a2_prob').value);
  let ok = 0;
  if (approxEq(mu, 30)) ok++;
  if (approxEq(sig, 5.14, 0.15)) ok++;
  if (approxEq(lo, 24.5)) ok++;
  if (approxEq(hi, 35.5)) ok++;
  if (!Number.isNaN(prob) && approxEq(prob, 0.7154, 0.05)) ok++;
  return { ok: ok, total: 5 };
}

function scoreA3() {
  const mu = parseNum(document.getElementById('a3_mu').value);
  const sig = parseNum(document.getElementById('a3_sigma').value);
  const lo = parseNum(document.getElementById('a3_low').value);
  const hi = parseNum(document.getElementById('a3_high').value);
  const prob = parseProbability(document.getElementById('a3_prob').value);
  let ok = 0;
  if (approxEq(mu, 50)) ok++;
  if (approxEq(sig, 5)) ok++;
  if (approxEq(lo, 49.5)) ok++;
  if (approxEq(hi, 50.5)) ok++;
  if (!Number.isNaN(prob) && approxEq(prob, 0.0796, 0.025)) ok++;
  return { ok: ok, total: 5 };
}

function scoreFinalQuiz() {
  if (typeof finalQuizData === 'undefined' || !Array.isArray(fqAnswers)) {
    return { ok: 0, total: 0, evaluated: false };
  }
  let ok = 0;
  let answered = 0;
  finalQuizData.forEach(function (q, i) {
    if (fqAnswers[i] >= 0) answered++;
    if (fqAnswers[i] === q.correct) ok++;
  });
  const evaluated = document.getElementById('finalResult') &&
    document.getElementById('finalResult').style.display !== 'none';
  return { ok: ok, total: finalQuizData.length, evaluated: evaluated, answered: answered };
}

function scoreGeoGebraOptional() {
  const mu = parseNum(document.getElementById('gg_mu').value);
  const sig = parseNum(document.getElementById('gg_sigma').value);
  const grenze = parseNum(document.getElementById('gg_grenze').value);
  const result = parseNum(document.getElementById('gg_result').value);
  let ok = 0;
  if (approxEq(mu, 50)) ok++;
  if (approxEq(sig, 5)) ok++;
  if (approxEq(grenze, 55.5)) ok++;
  if (approxEq(result, 0.8643, 0.02)) ok++;
  return { ok: ok, total: 4 };
}

function getJsPDFConstructor() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  if (typeof window.jsPDF === 'function') return window.jsPDF;
  return null;
}

function downloadLernpfadPdf() {
  const JsPDF = getJsPDFConstructor();
  if (!JsPDF) {
    alert('PDF-Bibliothek nicht geladen. Bitte Seite neu laden.');
    return;
  }

  const fq = scoreFinalQuiz();
  if (!fq.evaluated) {
    alert('Bitte zuerst das Abschlussquiz mit „Auswerten“ abschliessen.');
    return;
  }

  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const margin = 14;
  const maxW = 182;
  let y = 16;
  const titleSize = 15;
  const bodySize = 10;
  const smallSize = 9;
  const line = 5;

  function addParagraph(text, size, bold) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(pdfEscape(text), maxW);
    lines.forEach(function (ln) {
      if (y > 285) {
        doc.addPage();
        y = 16;
      }
      doc.text(ln, margin, y);
      y += line;
    });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(titleSize);
  doc.text('Lernpfad: NV als Naeherung der Binomialverteilung', margin, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(smallSize);
  const now = new Date();
  const dateStr = now.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text('Erstellt: ' + pdfEscape(dateStr), margin, y);
  y += 8;

  addParagraph('Inhaltszusammenfassung (Kernpunkte)', bodySize, true);
  PDF_SUMMARY_POINTS.forEach(function (p, i) {
    addParagraph((i + 1) + '. ' + p, smallSize, false);
    y += 1;
  });
  y += 4;

  addParagraph('Deine Ergebnisse (Stand beim PDF-Export)', bodySize, true);

  const v = scoreVorwissen();
  addParagraph('Vorwissen Quick-Check: ' + v.ok + ' / ' + v.total + ' Aufgaben richtig', smallSize, false);

  const r = scoreRuleExercise();
  addParagraph('Faustregel (a-d): ' + r.ok + ' / ' + r.total + ' richtig', smallSize, false);

  const st = scoreStetigkeit();
  addParagraph('Stetigkeitskorrektur (Freitext): ' + st.ok + ' / ' + st.total + ' Teilaufgaben richtig', smallSize, false);

  const pr = scorePraxis();
  addParagraph('Gefuehrte Praxis (Versandunternehmen): ' + pr.ok + ' / ' + pr.total + ' Schritte richtig', smallSize, false);

  const a1 = scoreA1();
  const a2 = scoreA2();
  const a3 = scoreA3();
  addParagraph('Uebung Aufgabe 1 (Wahlumfrage): ' + a1.ok + ' / ' + a1.total, smallSize, false);
  addParagraph('Uebung Aufgabe 2 (Retouren): ' + a2.ok + ' / ' + a2.total, smallSize, false);
  addParagraph('Uebung Aufgabe 3 (Muenze): ' + a3.ok + ' / ' + a3.total, smallSize, false);

  addParagraph('Abschlussquiz: ' + fq.ok + ' / ' + fq.total + ' Fragen richtig', smallSize, true);
  if (typeof finalQuizData !== 'undefined') {
    finalQuizData.forEach(function (q, i) {
      const correct = fqAnswers[i] === q.correct;
      const mark = correct ? '[+]' : '[-]';
      const qtext = pdfPlainQuizText(q.q);
      addParagraph(
        mark + ' Frage ' + (i + 1) + ': ' + qtext,
        smallSize - 0.5,
        false
      );
      if (!correct && fqAnswers[i] >= 0 && q.opts[fqAnswers[i]]) {
        addParagraph(
          '   Deine Antwort: ' + pdfPlainQuizText(q.opts[fqAnswers[i]]),
          smallSize - 1,
          false
        );
      }
    });
  }

  y += 2;
  const gg = scoreGeoGebraOptional();
  const hasGgInput = ['gg_mu', 'gg_sigma', 'gg_grenze', 'gg_result'].some(function (id) {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '';
  });
  if (hasGgInput) {
    addParagraph(
      'Optionaler GeoGebra-Selbstcheck (Tab Info): ' + gg.ok + ' / ' + gg.total + ' Felder passend',
      smallSize,
      false
    );
  }

  y += 4;
  doc.setFontSize(smallSize - 1);
  doc.setTextColor(80);
  addParagraph(
    'Hinweis: Ergebnisse stuetzen sich auf deine aktuellen Eingaben und Quiz-Antworten in dieser Sitzung.',
    smallSize - 1,
    false
  );
  doc.setTextColor(0);

  doc.save('Lernpfad_NV-Binomial_Zusammenfassung.pdf');
}

window.downloadLernpfadPdf = downloadLernpfadPdf;
