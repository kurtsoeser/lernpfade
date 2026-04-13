// ══════════════════════════════════════════════
// TAB SWITCHING
// ══════════════════════════════════════════════
function switchTab(idx) {
  currentTab = idx;
  // Hide all panels
  document.querySelectorAll('.tab-panel').forEach((p, i) => {
    p.classList.toggle('active', i === idx);
  });
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
  // Scroll to top of container
  document.querySelector('.tab-bar').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Init chart on first visit to tab 1
  if (idx === 1 && !chartInitialized) {
    chartInitialized = true;
    setTimeout(() => updateMainChart(), 100);
  }
  if (idx === 1) {
    setTimeout(() => updateBinomialCoefficient(), 120);
  }

  // Re-render MathJax for the visible panel
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([document.getElementById('panel' + idx)]);
  }

  // Ensure chart resizes
  if (idx === 1 && mainChart) {
    setTimeout(() => mainChart.resize(), 50);
  }

  if (idx === 3 && typeof skWidgetResize === 'function') {
    setTimeout(() => skWidgetResize(), 80);
  }

  if (typeof nvRechnerRedrawAll === 'function') {
    setTimeout(() => nvRechnerRedrawAll(), 100);
  }
}

// ══════════════════════════════════════════════
// PROGRESS
// ══════════════════════════════════════════════
function updateProgress() {
  const pct = Math.round((completedSections.size / TOTAL_SECTIONS) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressPercent').textContent = pct + ' %';
  document.getElementById('progressText').textContent =
    `Station ${completedSections.size} von ${TOTAL_SECTIONS} abgeschlossen`;
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('completed-tab', completedSections.has(i + 1));
  });
}

function markComplete(secNum) {
  completedSections.add(secNum);
  updateProgress();
}
