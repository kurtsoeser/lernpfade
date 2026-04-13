/**
 * Fügt die gemeinsame Lernpfad-Navigation (Inhaltsverzeichnis) ein.
 * Erwartet optional: body[data-current-page="index|nv-grund|nv-approx"]
 */
(function () {
  var LINKS = [
    { id: 'index', href: 'index.html', label: 'Übersicht' },
    { id: 'nv-grund', href: 'lernpfad-normalverteilung.html', label: 'Normalverteilung' },
    {
      id: 'nv-approx',
      href: 'lernpfad-approximation-normalverteilung.html',
      label: 'NV · Näherung Binomial'
    }
  ];

  function insertNav() {
    if (document.querySelector('.lernpfade-site-nav')) return;

    var current = document.body.getAttribute('data-current-page') || '';

    var nav = document.createElement('nav');
    nav.className = 'lernpfade-site-nav';
    nav.setAttribute('aria-label', 'Lernpfade — Inhaltsverzeichnis');

    var html = '<span class="lernpfade-site-nav-title">Lernpfade</span>';
    for (var i = 0; i < LINKS.length; i++) {
      var L = LINKS[i];
      var isCurrent = L.id === current;
      var cls = isCurrent ? ' class="current"' : '';
      var aria = isCurrent ? ' aria-current="page"' : '';
      html +=
        '<a href="' +
        L.href +
        '"' +
        cls +
        aria +
        '>' +
        L.label +
        '</a>';
    }
    nav.innerHTML = html;

    var progress = document.querySelector('.progress-bar-container');
    var container = document.querySelector('.container');
    if (progress) {
      progress.insertAdjacentElement('afterend', nav);
    } else if (container && container.parentNode) {
      container.parentNode.insertBefore(nav, container);
    } else {
      document.body.insertBefore(nav, document.body.firstChild);
    }

    document.body.classList.add('has-lernpfade-nav');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertNav);
  } else {
    insertNav();
  }
})();
