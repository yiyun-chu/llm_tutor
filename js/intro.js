/* Intro page (index.html): create the respondent, assign condition, show intro. */
(async function () {
  Flow.lockBack();
  if (!Flow.requireStage("intro")) return;

  let id = Flow.rid();
  let cond = Flow.condition();
  const fresh = !id;
  if (fresh) {
    id = Flow.makeRespondentId();
    cond = await Flow.assignCondition(id);
    Flow.initSession(id, cond);
  }

  Logger.init("intro");
  if (fresh) {
    Logger.log("session_start", {
      user_agent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`,
      lang: navigator.language, referrer: document.referrer || null,
    });
    Logger.log("condition_assigned", { condition: cond, strategy: CONFIG.CONDITION_STRATEGY });
  }

  document.getElementById("rid-value").textContent = id;
  document.getElementById("intro-body").innerHTML = CONTENT.INTRO_HTML;
  document.getElementById("irb-line").textContent = CONFIG.IRB_LINE;
  document.querySelector(".brand").textContent = CONFIG.STUDY_NAME;

  document.getElementById("next").addEventListener("click", () => Flow.goNext("intro"));
})();
