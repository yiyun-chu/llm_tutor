/* Pre-test page (pretest.html). */
(function () {
  Flow.lockBack();
  if (!Flow.requireStage("pretest")) return;
  Logger.init("pretest");

  document.getElementById("rid-value").textContent = Flow.rid();
  document.querySelector(".brand").textContent = CONFIG.STUDY_NAME;
  Survey.render("pretest-questions", CONTENT.PRETEST);

  document.getElementById("next").addEventListener("click", () => {
    if (!Survey.allAnswered(CONTENT.PRETEST)) {
      alert("Please answer all the questions before continuing.");
      return;
    }
    Survey.collect(CONTENT.PRETEST, "pretest");
    Logger.flush();
    Flow.goNext("pretest");
  });
})();
