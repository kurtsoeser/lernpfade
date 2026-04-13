Lernpfad „Normalverteilung als Näherung“ — JavaScript-Module
===========================================================

Ladereihenfolge (in der HTML-Datei fest verdrahtet):

  01-state.js              Globale Zustände (Fortschritt, Chart, Quiz)
  02-utils-parsing.js      parseNum, parseProbability, approxEq
  03-tabs-progress.js      Tabs, Fortschrittsanzeige
  04-quiz-vorwissen.js     Quick-Check (Tab 1)
  05-binomial.js           Binomialkoeffizient-Rechner (Tab 2)
  06-chart.js              Chart.js Diagramm (Tab 2)
  07-rule-exercise.js      Faustregel-Übung (Tab 3)
  08-stetigkeit-praxis-hints.js   Stetigkeitskorrektur, Praxis, Tipp-Toggle
  09-geogebra-modal-uebungen.js   GeoGebra-Modal, Übungen A1–A3, Selbstcheck Tab 8
  10-final-quiz.js         Abschlussquiz
  11-floating-tools.js     Schwebender FAB: Taschenrechner + GeoGebra-Popup
  12-init.js               DOMContentLoaded

Hinweis: Kein ES-Module-Build nötig — die Dateien nutzen gemeinsame globale Funktionen
(wie im ursprünglichen Einzel-Skript). So funktioniert die Seite auch ohne Bundler.

CSS: css/normalverteilung-lernpfad.css (relativ zur HTML-Datei lernpfad-approximation-normalverteilung.html)
