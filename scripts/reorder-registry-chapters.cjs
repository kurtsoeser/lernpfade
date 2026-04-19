/**
 * Einmal: Kapitel-Reihenfolge + chapterLetter A–J in lernpfade-registry.js setzen.
 * A Grundlagen, B Gleichungen, C Matrizen, D Trigonometrie, E Funktionen,
 * F Finanzmathematik, G Wachstumsprozesse, H Differential/Integral, I Statistik, J Wahrscheinlichkeit.
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'js', 'lernpfade-registry.js');
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

function sliceLines(start1, end1Inclusive) {
  return lines.slice(start1 - 1, end1Inclusive).join('\n');
}

const blocks = {
  semester3: sliceLines(32, 217),
  semester6: sliceLines(218, 281),
  wahrscheinlichkeit: sliceLines(282, 349),
  statistik: sliceLines(350, 410),
  finanzmathematik: sliceLines(411, 528),
  funktionen: sliceLines(529, 636),
  gleichungen: sliceLines(637, 737),
  matrizen: sliceLines(738, 756),
  trigonometrie: sliceLines(757, 775),
  wachstumsprozesse: sliceLines(776, 871)
};

function setLetter(text, letter) {
  return text.replace(/chapterLetter: '[A-J]'/, `chapterLetter: '${letter}'`);
}

const order = [
  ['semester3', 'A'],
  ['gleichungen', 'B'],
  ['matrizen', 'C'],
  ['trigonometrie', 'D'],
  ['funktionen', 'E'],
  ['finanzmathematik', 'F'],
  ['wachstumsprozesse', 'G'],
  ['semester6', 'H'],
  ['statistik', 'I'],
  ['wahrscheinlichkeit', 'J']
];

const newBody =
  order
    .map(function (pair) {
      var key = pair[0];
      var letter = pair[1];
      return setLetter(blocks[key], letter);
    })
    .join(',\n') + '\n';

/* Zeilen 1–31: Header bis einschließlich `var chapters = [` (Zeile 31). */
const pre = lines.slice(0, 31).join('\n');
const post = lines.slice(871).join('\n');

const out = pre + '\n' + newBody + post;
fs.writeFileSync(file, out, 'utf8');
console.log('OK: chapters reordered and letters A–J set.');
