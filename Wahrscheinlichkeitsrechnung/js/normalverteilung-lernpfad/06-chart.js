// ══════════════════════════════════════════════
// INTERACTIVE CHART
// ══════════════════════════════════════════════
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

function updateMainChart() {
  const n = parseInt(document.getElementById('sliderN').value);
  const p = parseInt(document.getElementById('sliderP').value) / 100;
  document.getElementById('valN').textContent = n;
  document.getElementById('valP').textContent = p.toFixed(2).replace('.', ',');

  const mu = n * p;
  const sigma = Math.sqrt(n * p * (1 - p));

  const np = n * p;
  const nq = n * (1 - p);
  const condEl = document.getElementById('conditionCheck');
  if (np >= 5 && nq >= 5) {
    condEl.innerHTML = '<span style="color:var(--green)">\u2705 Faustregel erf\u00fcllt: n\u00b7p = ' +
      np.toFixed(1).replace('.', ',') + ' \u2265 5 und n\u00b7(1\u2212p) = ' +
      nq.toFixed(1).replace('.', ',') + ' \u2265 5</span>';
  } else {
    condEl.innerHTML = '<span style="color:var(--red)">\u274c Faustregel NICHT erf\u00fcllt: n\u00b7p = ' +
      np.toFixed(1).replace('.', ',') + (np < 5 ? ' < 5' : ' \u2265 5') + ' und n\u00b7(1\u2212p) = ' +
      nq.toFixed(1).replace('.', ',') + (nq < 5 ? ' < 5' : ' \u2265 5') + '</span>';
  }

  document.getElementById('chartMuSigma').innerHTML =
    '\u03bc = ' + mu.toFixed(2).replace('.', ',') + ' &nbsp;|&nbsp; \u03c3 = ' + sigma.toFixed(2).replace('.', ',');

  const lo = Math.max(0, Math.floor(mu - 4 * sigma));
  const hi = Math.min(n, Math.ceil(mu + 4 * sigma));

  const labels = [];
  const binomData = [];
  const normalData = [];

  for (let k = lo; k <= hi; k++) {
    labels.push(k);
    binomData.push(binomPMF(k, n, p));
    normalData.push(normalPDF(k, mu, sigma));
  }

  if (mainChart) mainChart.destroy();

  const ctx = document.getElementById('mainChart').getContext('2d');
  mainChart = new Chart(ctx, {
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: 'Binomialverteilung B(' + n + '; ' + p.toFixed(2) + ')',
          data: binomData,
          backgroundColor: 'rgba(59,130,196,0.6)',
          borderColor: 'rgba(59,130,196,0.9)',
          borderWidth: 1,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
          order: 2
        },
        {
          type: 'line',
          label: 'Normalverteilung N(' + mu.toFixed(1) + '; ' + sigma.toFixed(2) + ')',
          data: normalData,
          borderColor: '#F39C12',
          borderWidth: 3,
          pointRadius: 0,
          fill: false,
          tension: 0.4,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: "'Nunito'" } } },
        tooltip: {
          callbacks: {
            label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(4)
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'k (Anzahl Erfolge)', font: { family: "'Nunito'" } },
          ticks: { maxTicksLimit: 20, font: { family: "'Nunito'" } }
        },
        y: {
          title: { display: true, text: 'Wahrscheinlichkeit', font: { family: "'Nunito'" } },
          ticks: { font: { family: "'Nunito'" } }
        }
      }
    }
  });

  // Mark tab 2 as explored
  markComplete(2);
}
