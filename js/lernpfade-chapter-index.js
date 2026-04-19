/**
 * Füllt die Kapitel-Übersicht (Blatt-Kapitel, z. B. Wahrscheinlichkeit oder Statistik/Grundlagen).
 * body[data-chapter-id] = registry chapters[].id oder subchapters[].id
 */
(function () {
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function init() {
    var R = window.LernpfadeRegistry;
    var chapterId = document.body.getAttribute('data-chapter-id');
    var mount = document.getElementById('chapter-index-grid');
    if (!R || !chapterId || !mount) return;

    var ch = R.chapterById(chapterId);
    if (!ch) return;

    var rawPaths = (ch.paths || []).slice();
    var hasChapterNav = rawPaths.some(function (p) {
      return p.chapterNavOrder != null;
    });
    var sorted = rawPaths.sort(function (a, b) {
      if (hasChapterNav) {
        return (a.chapterNavOrder || 0) - (b.chapterNavOrder || 0);
      }
      return (a.order || 0) - (b.order || 0);
    });

    if (sorted.length) {
      mount.classList.remove('chapter-index-grid--stack');
      for (var i = 0; i < sorted.length; i++) {
        var p = sorted[i];
        var sem = R.semesterById(p.semesterId);
        var a = el('a', 'index-card');
        a.href = p.href;
        var head = el('div', 'chapter-card-head');
        var cardHeading = p.cardTitle;
        if (p.semesterTopicCode) {
          cardHeading = p.semesterTopicCode + ' · ' + cardHeading;
        }
        head.appendChild(el('h2', null, cardHeading));
        if (sem) {
          var cls = 'lp-sem-badge';
          if (sem.id) cls += ' lp-sem-badge--' + sem.id;
          var b = el('span', cls, sem.shortLabel || sem.label);
          b.title = sem.label;
          head.appendChild(b);
        }
        a.appendChild(head);
        a.appendChild(el('p', null, p.description));
        a.appendChild(el('span', 'index-card-meta', 'Zum Lernpfad →'));
        mount.appendChild(a);
      }
      return;
    }

    mount.classList.add('chapter-index-grid--stack');

    var hint = el(
      'p',
      'chapter-index-placeholder',
      'Die interaktiven Lernpfade zu diesen Inhalten werden ergänzt. Unten findest du die zugeordneten Kompetenzen aus dem Lehrplan.'
    );
    mount.appendChild(hint);

    if (ch.competencies && ch.competencies.length) {
      var ul = el('ul', 'chapter-competency-list');
      for (var c = 0; c < ch.competencies.length; c++) {
        var li = el('li', null, ch.competencies[c]);
        ul.appendChild(li);
      }
      mount.appendChild(ul);
    }
  }

  function boot() {
    init();
    if (
      window.LernpfadeRegistry &&
      typeof window.LernpfadeRegistry.injectChapterLetterBadge === 'function'
    ) {
      window.LernpfadeRegistry.injectChapterLetterBadge();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
