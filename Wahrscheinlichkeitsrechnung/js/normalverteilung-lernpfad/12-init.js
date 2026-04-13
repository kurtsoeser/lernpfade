// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  buildFinalQuiz();
  updateBinomialCoefficient();
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeGeoGebraModal();
      if (typeof closeBinomModal === 'function') closeBinomModal();
      if (typeof closeCalculatorModal === 'function') closeCalculatorModal();
      if (typeof closeFloatingToolsMenu === 'function') closeFloatingToolsMenu();
    }
  });
});
