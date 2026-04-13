// ══════════════════════════════════════════════
// RULE CHECK EXERCISE
// ══════════════════════════════════════════════
function checkRuleExercise() {
  const answers = {
    rule_a: { correct: 0, explain: 'n\u00b7p = 100\u00b70,08 = 8 \u2265 5 \u2713 und n\u00b7(1\u2212p) = 92 \u2265 5 \u2713' },
    rule_b: { correct: 1, explain: 'n\u00b7p = 20\u00b70,1 = 2 < 5 \u2717 \u2192 Bedingung nicht erf\u00fcllt!' },
    rule_c: { correct: 0, explain: 'n\u00b7p = 200\u00b70,9 = 180 \u2265 5 \u2713 und n\u00b7(1\u2212p) = 20 \u2265 5 \u2713' },
    rule_d: { correct: 1, explain: 'n\u00b7p = 40\u00b70,02 = 0,8 < 5 \u2717 \u2192 Bedingung nicht erf\u00fcllt!' }
  };

  let allCorrect = true;
  Object.keys(answers).forEach(qid => {
    const container = document.querySelector(`[data-quiz="${qid}"]`);
    const selected = container.querySelector('.quiz-option.selected');
    const fb = document.getElementById('fb_' + qid);

    if (!selected) {
      fb.className = 'feedback incorrect'; fb.style.display = 'block';
      fb.textContent = 'Bitte w\u00e4hle eine Antwort.';
      allCorrect = false; return;
    }

    const idx = parseInt(selected.dataset.idx);
    if (idx === answers[qid].correct) {
      selected.classList.add('correct-answer');
      fb.className = 'feedback correct';
      fb.innerHTML = '\u2705 Richtig! ' + answers[qid].explain;
    } else {
      selected.classList.add('wrong-answer');
      fb.className = 'feedback incorrect';
      fb.innerHTML = '\u274c Falsch. ' + answers[qid].explain;
      allCorrect = false;
    }
    fb.style.display = 'block';
  });

  if (allCorrect) markComplete(3);
}
