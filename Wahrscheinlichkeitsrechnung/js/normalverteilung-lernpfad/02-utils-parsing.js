function parseNum(str) {
  return parseFloat(str.replace(',', '.').trim());
}
/** Dezimalzahl (0,81) oder Prozent (81,3) → Wahrscheinlichkeit in [0, 1] */
function parseProbability(str) {
  const x = parseNum(str);
  if (Number.isNaN(x)) return NaN;
  if (x > 1 && x <= 100) return x / 100;
  return x;
}
function approxEq(a, b, tol) {
  return Math.abs(a - b) <= (tol || 0.1);
}
