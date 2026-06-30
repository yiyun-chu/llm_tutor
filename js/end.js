/* End page (end.html): finalize, guarantee the last batch is saved, back up. */
(async function () {
  Flow.lockBack();
  if (!Flow.requireStage("end")) return;
  Logger.init("end");

  document.querySelector(".brand").textContent = CONFIG.STUDY_NAME;
  Logger.log("survey_end", {});
  await Logger.flush();          // make sure everything reached the backend
  Logger.persistArchive();
  Logger.downloadBackup();       // local JSON backup (configurable)

  document.getElementById("end-rid").textContent = Flow.rid();
})();
