/* ============================================================================
 * SURVEY  —  shared rendering/validation/scoring for the pre- and post-tests.
 * ==========================================================================*/

window.Survey = (function () {

  function render(containerId, list) {
    const root = document.getElementById(containerId);
    root.innerHTML = "";
    list.forEach((q, i) => {
      const card = document.createElement("fieldset");
      card.className = "question";
      const legend = document.createElement("legend");
      legend.innerHTML = `<span class="qnum">${i + 1}</span> ${q.prompt}`;
      card.appendChild(legend);

      if (q.type === "text") {
        const ta = document.createElement("textarea");
        ta.dataset.qid = q.id; ta.rows = 3; ta.placeholder = "Type your answer…";
        card.appendChild(ta);
      } else {
        (q.options || []).forEach((opt, j) => {
          const id = `${q.id}_${j}`;
          const row = document.createElement("label");
          row.className = "option"; row.htmlFor = id;
          row.innerHTML =
            `<input type="radio" id="${id}" name="${q.id}" value="${j}" data-qid="${q.id}"> <span>${opt}</span>`;
          card.appendChild(row);
        });
      }
      root.appendChild(card);
    });
  }

  function allAnswered(list) {
    return list.every((q) =>
      q.type === "text" ? true : !!document.querySelector(`input[name="${q.id}"]:checked`));
  }

  // collect + score; logs each answer and a phase score
  function collect(list, phase) {
    let correct = 0, scored = 0;
    list.forEach((q) => {
      let value = null;
      if (q.type === "text") {
        const el = document.querySelector(`textarea[data-qid="${q.id}"]`);
        value = el ? el.value.trim() : "";
      } else {
        const el = document.querySelector(`input[name="${q.id}"]:checked`);
        value = el ? +el.value : null;
      }
      const isCorrect = (typeof q.answer === "number" && value !== null) ? value === q.answer : null;
      if (isCorrect !== null) { scored++; if (isCorrect) correct++; }
      Logger.log("question_answer", { phase, qid: q.id, type: q.type, value, is_correct: isCorrect, prompt: q.prompt });
    });
    Logger.log("phase_score", { phase, correct, scored, percent: scored ? Math.round((100 * correct) / scored) : null });
  }

  return { render, allAnswered, collect };
})();
