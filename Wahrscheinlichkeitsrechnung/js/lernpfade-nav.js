/**
 * Gemeinsame Lernpfad-Navigation: kompaktes Globales Menü (Semester & Unterkapitel)
 * sowie optional Kapitel-Links. Nutzt window.LernpfadeRegistry.
 *
 * Auf Lernpfad-Seiten: Reihenfolge im Dokument — fixe Nav oben, dann Hero, Schritte,
 * Fortschritt, Inhalt (Schritte+Fortschritt optional gemeinsam „sticky“ unter der Nav).
 */
(function () {
  var FALLBACK_LINKS = [
    { id: 'index', href: 'index.html', label: 'Übersicht' },
    {
      id: 'wk-grund',
      href: 'lernpfad-wahrscheinlichkeit-grundlagen.html',
      label: '05 Einleitung Wahrscheinlichkeit'
    },
    {
      id: 'wv-dist',
      href: 'lernpfad-wahrscheinlichkeitsverteilungen.html',
      label: '01 Wahrscheinlichkeitsverteilungen'
    },
    {
      id: 'binom',
      href: 'lernpfad-binomialverteilung.html',
      label: '02 Binomialverteilung'
    },
    { id: 'nv-grund', href: 'lernpfad-normalverteilung.html', label: '03 Normalverteilung' },
    {
      id: 'nv-approx',
      href: 'lernpfad-approximation-normalverteilung.html',
      label: '04 Approximation der BV durch NV'
    }
  ];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rootHrefPrefix() {
    var folder = document.body.getAttribute('data-chapter-folder') || '';
    var parts = folder.split('/').filter(Boolean);
    var out = '';
    for (var i = 0; i < parts.length; i++) out += '../';
    return out || '../';
  }

  function getLinks() {
    var R = window.LernpfadeRegistry;
    var folder =
      document.body.getAttribute('data-chapter-folder') || 'Wahrscheinlichkeitsrechnung';
    if (R && typeof R.getNavLinksForPathSegment === 'function') {
      var links = R.getNavLinksForPathSegment(folder);
      if (links && links.length) return links;
    }
    if (!window.LernpfadeRegistry) {
      console.warn(
        'lernpfade-registry.js fehlt — Navigation nutzt Fallback. Bitte Registry vor lernpfade-nav.js einbinden.'
      );
    }
    return FALLBACK_LINKS;
  }

  function groupItemsByChapter(items) {
    var map = {};
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var key = it.chapter.id || it.chapter.pathSegment || 'x';
      if (!map[key]) {
        map[key] = {
          chapter: it.chapter,
          parent: it.parentChapter,
          items: []
        };
      }
      map[key].items.push(it);
    }
    var out = [];
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
    }
    out.sort(function (a, b) {
      var pa = a.parent && a.parent.order != null ? a.parent.order : 0;
      var pb = b.parent && b.parent.order != null ? b.parent.order : 0;
      if (pa !== pb) return pa - pb;
      var oa = a.chapter.order != null ? a.chapter.order : 0;
      var ob = b.chapter.order != null ? b.chapter.order : 0;
      if (oa !== ob) return oa - ob;
      return (a.chapter.title || '').localeCompare(b.chapter.title || '', 'de');
    });
    return out;
  }

  function buildGlobalMenuPanelHtml(R, prefix, currentId) {
    if (!R || typeof R.getPathsGroupedBySemester !== 'function') {
      return '<p class="lp-menu-fallback">Semester-Menü: Registry nicht verfügbar.</p>';
    }
    var semGroups = R.getPathsGroupedBySemester();
    var html = '<div class="lp-global-menu-inner" role="navigation" aria-label="Alle Lernpfade nach Semester">';
    for (var gi = 0; gi < semGroups.length; gi++) {
      var block = semGroups[gi];
      if (!block.items || !block.items.length) continue;
      html += '<details class="lp-sem-accordion">';
      html += '<summary>' + escapeHtml(block.semester.label) + '</summary>';
      html += '<div class="lp-sem-accordion-body">';
      var chapters = groupItemsByChapter(block.items);
      for (var ci = 0; ci < chapters.length; ci++) {
        var chg = chapters[ci];
        var title = R.displayChapterTitle
          ? R.displayChapterTitle(chg.chapter, chg.parent)
          : chg.chapter.title;
        html += '<div class="lp-chapter-block">';
        html += '<div class="lp-chapter-block-title">' + escapeHtml(title) + '</div>';
        html += '<ul class="lp-path-list">';
        for (var pi = 0; pi < chg.items.length; pi++) {
          var it = chg.items[pi];
          var href = prefix + it.url;
          var isCur = it.path.id === currentId;
          var curCls = isCur ? ' class="current"' : '';
          var aria = isCur ? ' aria-current="page"' : '';
          var label = it.path.navLabel || it.path.cardTitle || it.displayTitle;
          html +=
            '<li><a href="' +
            escapeHtml(href) +
            '"' +
            curCls +
            aria +
            '>' +
            escapeHtml(label) +
            '</a></li>';
        }
        html += '</ul></div>';
      }
      html += '</div></details>';
    }
    html += '</div>';
    return html;
  }

  function buildLocalChapterDetails(LINKS, current) {
    if (!LINKS || LINKS.length < 2) return '';
    var html =
      '<details class="lp-nav-dd lp-nav-dd--local">' +
      '<summary>Dieses Kapitel</summary>' +
      '<div class="lp-nav-dd-panel lp-nav-dd-panel--local" role="menu">';
    for (var i = 0; i < LINKS.length; i++) {
      var L = LINKS[i];
      var isCurrent = L.id === current;
      var curCls = isCurrent ? ' class="current"' : '';
      var aria = isCurrent ? ' aria-current="page"' : '';
      html +=
        '<a href="' +
        escapeHtml(L.href) +
        '" role="menuitem"' +
        curCls +
        aria +
        '>' +
        escapeHtml(L.label) +
        '</a>';
    }
    html += '</div></details>';
    return html;
  }

  function wireDetailsNav(nav) {
    nav.addEventListener('toggle', function (ev) {
      var t = ev.target;
      if (!(t instanceof HTMLDetailsElement) || !t.open) return;
      if (t.classList.contains('lp-nav-dd')) {
        var others = nav.querySelectorAll('details.lp-nav-dd');
        for (var i = 0; i < others.length; i++) {
          if (others[i] !== t) others[i].removeAttribute('open');
        }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      nav.querySelectorAll('details[open]').forEach(function (d) {
        d.removeAttribute('open');
      });
    });

    document.addEventListener('click', function (e) {
      if (nav.contains(e.target)) return;
      var dds = nav.querySelectorAll('details[open]');
      for (var i = 0; i < dds.length; i++) dds[i].removeAttribute('open');
    });
  }

  function buildNavElement(LINKS, current) {
    var R = window.LernpfadeRegistry;
    var prefix = rootHrefPrefix();
    var hubHref = prefix + 'index.html';

    var nav = document.createElement('nav');
    nav.className = 'lernpfade-site-nav';
    nav.setAttribute('aria-label', 'Lernpfade');

    var toolbar =
      '<div class="lernpfade-site-nav-inner">' +
      '<span class="lernpfade-site-nav-title">Lernpfade</span>' +
      '<a class="lp-nav-hub" href="' +
      escapeHtml(hubHref) +
      '">Gesamtübersicht</a>' +
      buildLocalChapterDetails(LINKS, current) +
      '<details class="lp-nav-dd lp-nav-dd--global">' +
      '<summary>Alle Lernpfade</summary>' +
      '<div class="lp-nav-dd-panel lp-nav-dd-panel--global">' +
      '<div class="lp-global-menu-scroll">' +
      buildGlobalMenuPanelHtml(R, prefix, current) +
      '</div></div></details>' +
      '</div>';

    nav.innerHTML = toolbar;
    return nav;
  }

  function insertNav() {
    if (document.querySelector('.lernpfade-site-nav')) return;

    var current = document.body.getAttribute('data-current-page') || '';
    var LINKS = getLinks();
    var pageType = document.body.getAttribute('data-page-type');
    var progress = document.querySelector('.progress-bar-container');
    var tabBar = document.querySelector('.tab-bar');
    var isLernpfad = pageType === 'lernpfad' && progress && tabBar;

    var nav = buildNavElement(LINKS, current);

    if (isLernpfad) {
      document.body.insertBefore(nav, document.body.firstChild);
      if (progress.parentNode) {
        progress.parentNode.removeChild(progress);
      }
      var wrap = document.createElement('div');
      wrap.className = 'lp-steps-progress-wrap';
      wrap.setAttribute('data-lp-steps-progress', '1');
      tabBar.parentNode.insertBefore(wrap, tabBar);
      wrap.appendChild(tabBar);
      wrap.appendChild(progress);
    } else {
      var container = document.querySelector('.container');
      if (progress && progress.parentNode) {
        progress.insertAdjacentElement('afterend', nav);
      } else if (container && container.parentNode) {
        container.parentNode.insertBefore(nav, container);
      } else {
        document.body.insertBefore(nav, document.body.firstChild);
      }
    }

    wireDetailsNav(nav);

    document.body.classList.add('has-lernpfade-nav');

    if (
      window.LernpfadeRegistry &&
      typeof window.LernpfadeRegistry.injectChapterLetterBadge === 'function'
    ) {
      window.LernpfadeRegistry.injectChapterLetterBadge();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertNav);
  } else {
    insertNav();
  }
})();
