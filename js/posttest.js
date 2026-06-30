/* Post-test page (posttest.html). */
(function () {
  Flow.lockBack();
  if (!Flow.requireStage("posttest")) return;
  Logger.init("posttest");

  document.getElementById("rid-value").textContent = Flow.rid();
  document.querySelector(".brand").textContent = CONFIG.STUDY_NAME;
  Survey.render("posttest-questions", CONTENT.POSTTEST);

  document.getElementById("next").addEventListener("click", () => {
    if (!Survey.allAnswered(CONTENT.POSTTEST)) {
      alert("Please answer all the questions before finishing.");
      return;
    }
    Survey.collect(CONTENT.POSTTEST, "posttest");
    Logger.flush();
    Flow.goNext("posttest");
  });
})();
