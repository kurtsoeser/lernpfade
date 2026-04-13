// ══════════════════════════════════════════════
// QUIZ SYSTEM
// ══════════════════════════════════════════════
function selectQuiz(el) {
  const parent = el.closest('.quiz-options');
  parent.querySelectorAll('.quiz-option').forEach(o => {
    o.classList.remove('selected', 'correct-answer', 'wrong-answer');
  });
  el.classList.add('selected');
}

function checkQuizGroup(tabIdx, quizIds) {
  let allCorrect = true;
  quizIds.forEach(qid => {
    const container = document.querySelector(`[data-quiz="${qid}"]`);
    const correct = parseInt(container.dataset.correct);
    const selected = container.querySelector('.quiz-option.selected');
    const fb = document.getElementById('fb_' + qid);

    if (!selected) {
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = 'Bitte wähle eine Antwort aus.';
      allCorrect = false;
      return;
    }

    const idx = parseInt(selected.dataset.idx);
    if (idx === correct) {
      container.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      selected.classList.add('correct-answer');
      fb.className = 'feedback correct';
      fb.style.display = 'block';
      fb.textContent = '\u2705 Richtig!';
    } else {
      selected.classList.add('wrong-answer');
      container.querySelectorAll('.quiz-option')[correct].classList.add('correct-answer');
      fb.className = 'feedback incorrect';
      fb.style.display = 'block';
      fb.textContent = '\u274c Leider falsch. Die richtige Antwort ist markiert.';
      allCorrect = false;
    }
  });

  if (allCorrect) markComplete(tabIdx + 1);
}
