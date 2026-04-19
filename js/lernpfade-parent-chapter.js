/**
 * Überkapitel-Übersicht (Karten + optional Lehrplan-Listen).
 * body[data-parent-chapter-id] — Registry-Kapitel mit subchapters
 * body[data-subchapters-mount] — Element-ID für die Unterkapitel-Karten
 * body[data-curriculum-mount] — (optional) Element-ID für Kompetenz-Abschnitte
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
    var pid = document.body.getAttribute('data-parent-chapter-id');
    var subMountId = document.body.getAttribute('data-subchapters-mount');
    var detailId = document.body.getAttribute('data-curriculum-mount');
    var subMount = subMountId ? document.getElementById(subMountId) : null;
    if (!R || !pid || !subMount) return;

    var parent = R.chapterById(pid);
    if (!parent || !parent.subchapters) return;

    var subs = parent.subchapters.slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });

    for (var i = 0; i < subs.length; i++) {
      var sub = subs[i];
      var card = el('a', 'index-card');
      var seg = sub.pathSegment.split('/');
      var folder = seg[seg.length - 1];
      card.href = folder + '/index.html';
      var head = el('div', 'chapter-card-head');
      head.appendChild(
        el(
          'h2',
          null,
          (sub.curriculumRef ? sub.curriculumRef + ' · ' : '') + sub.title
        )
      );
      card.appendChild(head);
      var teaser =
        sub.competencies && sub.competencies.length
          ? sub.competencies[0]
          : '';
      card.appendChild(
        el(
          'p',
          null,
          teaser || 'Unterkapitel — Lernpfade und Material folgen.'
        )
      );
      card.appendChild(
        el('span', 'index-card-meta', 'Zur Unterkapitel-Übersicht →')
      );
      subMount.appendChild(card);
    }

    if (!detailId) return;
    var detail = document.getElementById(detailId);
    if (!detail) return;

    for (var j = 0; j < subs.length; j++) {
      var sc = subs[j];
      var section = el('section', 'statistik-curriculum-block');
      section.appendChild(
        el(
          'h3',
          'statistik-curriculum-block-title',
          (sc.curriculumRef ? 'Baustein ' + sc.curriculumRef + ': ' : '') +
            sc.title
        )
      );
      if (sc.competencies && sc.competencies.length) {
        var ul = el('ul', 'chapter-competency-list');
        for (var k = 0; k < sc.competencies.length; k++) {
          ul.appendChild(el('li', null, sc.competencies[k]));
        }
        section.appendChild(ul);
      }
      detail.appendChild(section);
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
