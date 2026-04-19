/**
 * Gesamtübersicht: Tabs nach Semester und Tabs nach Kapitel.
 */
(function () {
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function semesterBadge(sem) {
    var cls = 'lp-sem-badge';
    if (sem && sem.id) cls += ' lp-sem-badge--' + sem.id;
    var span = el('span', cls, sem.shortLabel || sem.label);
    span.title = sem.label;
    return span;
  }

  function uberChapterPillText(uber) {
    if (!uber) return '';
    var L = uber.chapterLetter ? uber.chapterLetter + ' · ' : '';
    return L + uber.title;
  }

  function makeCard(href, title, description, badges, chapterPill) {
    var shell = el('div', 'hub-index-card-shell');
    var a = el('a', 'index-card hub-index-card');
    a.href = href;
    var head = el('div', 'hub-card-head');
    var h = el('h2', null, title);
    head.appendChild(h);
    if (badges && badges.length) {
      var wrap = el('div', 'hub-card-badges');
      for (var i = 0; i < badges.length; i++) wrap.appendChild(badges[i]);
      head.appendChild(wrap);
    }
    a.appendChild(head);
    a.appendChild(el('p', null, description));
    a.appendChild(el('span', 'index-card-meta', 'Zum Lernpfad →'));
    shell.appendChild(a);
    if (chapterPill && chapterPill.text) {
      var pill = el('a', 'hub-chapter-pill');
      pill.href = '#hub-tab-ch-' + chapterPill.chapterId;
      pill.setAttribute('aria-label', 'Zu diesem Überkapitel im Bereich „Nach Kapitel“');
      pill.textContent = chapterPill.text;
      shell.appendChild(pill);
    }
    return shell;
  }

  function makeSubchapterCard(sub, parentChapter) {
    var shell = el('div', 'hub-index-card-shell');
    var a = el('a', 'index-card hub-index-card');
    a.href = sub.pathSegment + '/index.html';
    var head = el('div', 'hub-card-head');
    var titleText =
      (sub.curriculumRef ? sub.curriculumRef + ' · ' : '') + sub.title;
    head.appendChild(el('h2', null, titleText));
    a.appendChild(head);
    var teaser =
      sub.competencies && sub.competencies.length
        ? sub.competencies[0]
        : 'Inhalt und Lernpfade werden ergänzt.';
    a.appendChild(el('p', null, teaser));
    a.appendChild(el('span', 'index-card-meta', 'Zur Unterkapitel-Übersicht →'));
    shell.appendChild(a);
    if (parentChapter && parentChapter.id) {
      var pill = el('a', 'hub-chapter-pill');
      pill.href = '#hub-tab-ch-' + parentChapter.id;
      pill.setAttribute('aria-label', 'Zu diesem Überkapitel im Bereich „Nach Kapitel“');
      pill.textContent = uberChapterPillText(parentChapter);
      shell.appendChild(pill);
    }
    return shell;
  }

  function chapterTabLabel(ch) {
    var base = ch.hubTabLabel || ch.title;
    if (ch.chapterLetter) return ch.chapterLetter + ' · ' + base;
    return base;
  }

  function setupTabs(wrap, defaultId) {
    var buttons = wrap.querySelectorAll('.hub-tab-btn');
    var panels = wrap.querySelectorAll('.hub-tab-panel');

    function activate(id) {
      for (var i = 0; i < buttons.length; i++) {
        var b = buttons[i];
        var bid = b.getAttribute('data-tab');
        var on = bid === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.classList.toggle('hub-tab-btn--active', on);
        b.tabIndex = on ? 0 : -1;
      }
      for (var j = 0; j < panels.length; j++) {
        var p = panels[j];
        var pid = p.getAttribute('data-panel');
        var show = pid === id;
        p.classList.toggle('hub-tab-panel--active', show);
        p.hidden = !show;
      }
    }

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.hub-tab-btn');
      if (!btn || !wrap.contains(btn)) return;
      var id = btn.getAttribute('data-tab');
      if (id) activate(id);
    });

    wrap.addEventListener('keydown', function (e) {
      var keys = { ArrowLeft: -1, ArrowRight: 1, Home: 'home', End: 'end' };
      if (!keys.hasOwnProperty(e.key)) return;
      var list = Array.prototype.slice.call(buttons);
      var ix = list.indexOf(document.activeElement);
      if (ix < 0 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        var t = e.key === 'Home' ? list[0] : list[list.length - 1];
        if (t) {
          t.focus();
          activate(t.getAttribute('data-tab'));
        }
        return;
      }
      if (ix >= 0 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        var dir = keys[e.key];
        var nx = (ix + dir + list.length) % list.length;
        var nb = list[nx];
        nb.focus();
        activate(nb.getAttribute('data-tab'));
      }
    });

    activate(defaultId || (buttons[0] && buttons[0].getAttribute('data-tab')) || '');
    wrap.__hubActivate = activate;
  }

  function renderSemesterGrid(items, R) {
    var grid = el('div', 'index-grid hub-grid');
    if (!items.length) {
      var empty = el(
        'p',
        'hub-empty-hint',
        'Für dieses Semester sind noch keine Lernpfade eingetragen.'
      );
      grid.appendChild(empty);
      return grid;
    }
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var sem = R.semesterById(it.path.semesterId);
      var badges = sem ? [semesterBadge(sem)] : [];
      var cardTitle = it.path.cardTitle;
      if (it.path.semesterTopicCode) {
        cardTitle = it.path.semesterTopicCode + ' · ' + cardTitle;
      }
      var uber = it.parentChapter || it.chapter;
      var pill =
        uber && uber.id
          ? { text: uberChapterPillText(uber), chapterId: uber.id }
          : null;
      grid.appendChild(
        makeCard(it.url, cardTitle, it.path.description, badges, pill)
      );
    }
    return grid;
  }

  function renderBySemesterTabs(root, R) {
    var groups = R.getPathsGroupedBySemester();
    if (!groups.length) return;

    var tablist = el('div', 'hub-tabs hub-tabs--semester');
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Semester wählen');

    var panelsWrap = el('div', 'hub-tab-panels');

    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g];
      var sem = grp.semester;
      var id = sem.id;
      var btn = el('button', 'hub-tab-btn', sem.shortLabel || sem.label);
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-tab', id);
      btn.setAttribute('id', 'hub-tab-sem-' + id);
      btn.setAttribute('aria-controls', 'hub-panel-sem-' + id);
      btn.title = sem.label;
      if (g === 0) btn.setAttribute('aria-selected', 'true');
      else {
        btn.setAttribute('aria-selected', 'false');
        btn.tabIndex = -1;
      }
      tablist.appendChild(btn);

      var panel = el('div', 'hub-tab-panel');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('data-panel', id);
      panel.setAttribute('id', 'hub-panel-sem-' + id);
      panel.setAttribute('aria-labelledby', 'hub-tab-sem-' + id);
      if (g > 0) panel.hidden = true;
      else panel.classList.add('hub-tab-panel--active');

      panel.appendChild(renderSemesterGrid(grp.items, R));
      panelsWrap.appendChild(panel);
    }

    root.appendChild(tablist);
    root.appendChild(panelsWrap);
    setupTabs(root, groups[0].semester.id);
  }

  function renderChapterInner(ch, R) {
    var inner = el('div', 'hub-chapter-tab-inner');
    var chTitle = (ch.chapterLetter ? ch.chapterLetter + ' · ' : '') + ch.title;

    if (ch.subchapters && ch.subchapters.length) {
      var subs = ch.subchapters.slice().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });
      for (var s = 0; s < subs.length; s++) {
        var sub = subs[s];
        inner.appendChild(
          el(
            'h3',
            'hub-subchapter-heading',
            (sub.curriculumRef ? 'Lehrplanbaustein ' + sub.curriculumRef + ': ' : '') +
              sub.title
          )
        );
        var grid = el('div', 'index-grid hub-grid');
        var paths = (sub.paths || []).slice().sort(function (a, b) {
          return (a.order || 0) - (b.order || 0);
        });
        if (paths.length) {
          for (var p = 0; p < paths.length; p++) {
            var path = paths[p];
            var sem = R.semesterById(path.semesterId);
            var badges = sem ? [semesterBadge(sem)] : [];
            grid.appendChild(
              makeCard(
                R.pathUrl(sub, path),
                path.cardTitle,
                path.description,
                badges,
                ch.id ? { text: uberChapterPillText(ch), chapterId: ch.id } : null
              )
            );
          }
        } else {
          grid.appendChild(makeSubchapterCard(sub, ch));
        }
        inner.appendChild(grid);
      }
      return inner;
    }

    if (!ch.paths || !ch.paths.length) {
      inner.appendChild(
        el(
          'p',
          'hub-coming-soon',
          'Für dieses Kapitel sind noch keine Lernpfade hinterlegt.'
        )
      );
      return inner;
    }

    var gridFlat = el('div', 'index-grid hub-grid');
    var pathsFlat = ch.paths.slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
    for (var pf = 0; pf < pathsFlat.length; pf++) {
      var pathF = pathsFlat[pf];
      var semF = R.semesterById(pathF.semesterId);
      var badgesF = semF ? [semesterBadge(semF)] : [];
      gridFlat.appendChild(
        makeCard(
          R.pathUrl(ch, pathF),
          pathF.cardTitle,
          pathF.description,
          badgesF,
          ch.id ? { text: uberChapterPillText(ch), chapterId: ch.id } : null
        )
      );
    }
    inner.appendChild(gridFlat);
    return inner;
  }

  function renderByChapterTabs(root, R) {
    var list = R.getChaptersForHub();
    if (!list.length) return;

    var tablist = el('div', 'hub-tabs hub-tabs--chapter');
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-label', 'Kapitel wählen');

    var panelsWrap = el('div', 'hub-tab-panels');

    for (var c = 0; c < list.length; c++) {
      var ch = list[c];
      var id = ch.id;
      var btn = el('button', 'hub-tab-btn', chapterTabLabel(ch));
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-tab', id);
      btn.setAttribute('id', 'hub-tab-ch-' + id);
      btn.setAttribute('aria-controls', 'hub-panel-ch-' + id);
      btn.title = (ch.chapterLetter ? ch.chapterLetter + ' — ' : '') + ch.title;
      if (c === 0) btn.setAttribute('aria-selected', 'true');
      else {
        btn.setAttribute('aria-selected', 'false');
        btn.tabIndex = -1;
      }
      tablist.appendChild(btn);

      var panel = el('div', 'hub-tab-panel hub-tab-panel--chapter');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('data-panel', id);
      panel.setAttribute('id', 'hub-panel-ch-' + id);
      panel.setAttribute('aria-labelledby', 'hub-tab-ch-' + id);
      if (c > 0) panel.hidden = true;
      else panel.classList.add('hub-tab-panel--active');

      var panelHeading =
        (ch.chapterLetter ? ch.chapterLetter + ' · ' : '') + ch.title;
      var subtitle = el('p', 'hub-chapter-panel-title', panelHeading);
      panel.appendChild(subtitle);
      panel.appendChild(renderChapterInner(ch, R));
      panelsWrap.appendChild(panel);
    }

    root.appendChild(tablist);
    root.appendChild(panelsWrap);
    setupTabs(root, list[0].id);
  }

  function applyChapterTabHash() {
    var m = /^#hub-tab-ch-(.+)$/.exec(location.hash);
    if (!m) return;
    var chRoot = document.getElementById('hub-by-chapter');
    if (!chRoot || !chRoot.__hubActivate) return;
    chRoot.__hubActivate(m[1]);
  }

  function init() {
    var R = window.LernpfadeRegistry;
    if (!R) return;
    var semRoot = document.getElementById('hub-by-semester');
    var chRoot = document.getElementById('hub-by-chapter');
    if (semRoot) renderBySemesterTabs(semRoot, R);
    if (chRoot) renderByChapterTabs(chRoot, R);
    applyChapterTabHash();
  }

  window.addEventListener('hashchange', applyChapterTabHash);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
