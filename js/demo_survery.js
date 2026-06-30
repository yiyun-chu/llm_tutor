/* ============================================================================
 * Demographics Survey Page (demographics.html)
 * ==========================================================================*/

(function () {
  Flow.lockBack();

  if (!Flow.requireStage("demographics")) return;

  Logger.init("demographics");

  // Display respondent ID and study name
  document.getElementById("rid-value").textContent = Flow.rid();
  document.querySelector(".brand").textContent = CONFIG.STUDY_NAME;

  // Render demographic questions
  Survey.render("demographics-questions", CONTENT.DEMOGRAPHICS);

  // Handle Next button
  document.getElementById("next").addEventListener("click", () => {

    if (!Survey.allAnswered(CONTENT.DEMOGRAPHICS)) {
      alert("Please answer all the questions before continuing.");
      return;
    }

    // Save responses
    Survey.collect(CONTENT.DEMOGRAPHICS, "demographics");

    // Send logs to the backend
    Logger.flush();

    // Move to the pre-test
    Flow.goNext("demographics");
  });

})();