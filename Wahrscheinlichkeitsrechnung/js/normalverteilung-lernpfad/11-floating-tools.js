// ══════════════════════════════════════════════
// SCHWEBENDE WERKZEUGE (FAB: Taschenrechner + GeoGebra)
// ══════════════════════════════════════════════

var calcStored = null;
var calcPendingOp = null;
var calcDisplay = '0';
var calcInputNew = true;

function calcRender() {
  var el = document.getElementById('calcDisplay');
  if (el) el.value = calcDisplay.replace('.', ',');
}

function calcReset() {
  calcStored = null;
  calcPendingOp = null;
  calcDisplay = '0';
  calcInputNew = true;
  calcRender();
}

function calcFormat(n) {
  if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) return 'Fehler';
  var s = String(Math.round(n * 1e12) / 1e12);
  return s.replace('.', ',');
}

function calcCompute(a, b, op) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (op === '/') return b === 0 ? NaN : a / b;
  return b;
}

function calcPressDigit(d) {
  if (calcDisplay === 'Fehler') calcClear();
  if (calcInputNew) {
    calcDisplay = d === '.' ? '0.' : d;
    calcInputNew = false;
  } else {
    if (d === '.' && String(calcDisplay).indexOf('.') >= 0) return;
    calcDisplay += d;
  }
  calcRender();
}

function calcPressOp(op) {
  if (calcDisplay === 'Fehler') { calcClear(); return; }
  var v = parseFloat(String(calcDisplay).replace(',', '.'));
  if (calcStored !== null && calcPendingOp && !calcInputNew) {
    v = calcCompute(calcStored, v, calcPendingOp);
    calcDisplay = calcFormat(v);
    if (calcDisplay === 'Fehler') { calcRender(); return; }
    v = parseFloat(String(calcDisplay).replace(',', '.'));
  }
  calcStored = v;
  calcPendingOp = op;
  calcInputNew = true;
  calcRender();
}

function calcEquals() {
  if (calcDisplay === 'Fehler') { calcClear(); return; }
  if (calcPendingOp === null || calcStored === null) return;
  var v = parseFloat(String(calcDisplay).replace(',', '.'));
  var r = calcCompute(calcStored, v, calcPendingOp);
  calcDisplay = calcFormat(r);
  calcStored = null;
  calcPendingOp = null;
  calcInputNew = true;
  calcRender();
}

function calcClear() {
  calcReset();
}

function calcBackspace() {
  if (calcDisplay === 'Fehler' || calcInputNew) return;
  calcDisplay = String(calcDisplay).slice(0, -1);
  if (calcDisplay === '' || calcDisplay === '-') calcDisplay = '0';
  calcRender();
}

function openCalculatorModal() {
  closeGeoGebraModal();
  closeFloatingToolsMenu();
  var m = document.getElementById('calcModal');
  if (m) {
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  calcReset();
}

function closeCalculatorModal() {
  var m = document.getElementById('calcModal');
  if (m) {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

function toggleFloatingToolsMenu() {
  var menu = document.getElementById('floatingToolsMenu');
  var fab = document.getElementById('floatingToolsFab');
  if (!menu || !fab) return;
  var open = !menu.classList.contains('open');
  menu.classList.toggle('open', open);
  fab.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeFloatingToolsMenu() {
  var menu = document.getElementById('floatingToolsMenu');
  var fab = document.getElementById('floatingToolsFab');
  if (menu) menu.classList.remove('open');
  if (fab) fab.setAttribute('aria-expanded', 'false');
}

function openGeoGebraFromFloatingTools() {
  closeCalculatorModal();
  closeFloatingToolsMenu();
  openGeoGebraModal();
}

(function patchOpenGeoGebraModal() {
  var orig = window.openGeoGebraModal;
  if (typeof orig !== 'function') return;
  window.openGeoGebraModal = function () {
    if (typeof closeCalculatorModal === 'function') closeCalculatorModal();
    return orig.apply(this, arguments);
  };
})();
