/* Study page (study.html): video + AI tutor, with the timeline that drives
 * the chatbot's condition behaviour. Exposes window.Study for chat.js. */
window.Study = (function () {
  const C = window.CONFIG;
  const CT = window.CONTENT;

  let videoEl = null;
  let triggered = [];
  let lastTime = 0;
  let currentSectionId = null;

  const videoTime = () => (videoEl ? +videoEl.currentTime.toFixed(2) : null);
  const currentSection = () => currentSectionId;

  function dropboxDirect(url) {
    try { const u = new URL(url); u.searchParams.delete("dl"); u.searchParams.set("raw", "1"); return u.toString(); }
    catch (_) { return url; }
  }

  function setupVideo() {
    videoEl = document.getElementById("lecture-video");
    videoEl.src = dropboxDirect(C.VIDEO_DROPBOX_URL);
    triggered = CT.VIDEO_SECTIONS.map(() => false);

    const vlog = (t, extra = {}) => Logger.log("video_" + t, { video_time_sec: videoTime(), ...extra });
    videoEl.addEventListener("play", () => vlog("play"));
    videoEl.addEventListener("pause", () => vlog("pause"));
    videoEl.addEventListener("ratechange", () => vlog("ratechange", { rate: videoEl.playbackRate }));
    videoEl.addEventListener("ended", () => { vlog("ended"); document.getElementById("next").disabled = false; });
    videoEl.addEventListener("seeking", () => Logger.log("video_seek", { from_sec: +lastTime.toFixed(2), to_sec: videoTime() }));

    let lastHeartbeat = 0;
    videoEl.addEventListener("timeupdate", () => {
      const t = videoEl.currentTime;
      if (t - lastHeartbeat >= C.VIDEO_HEARTBEAT_SEC) { lastHeartbeat = t; vlog("progress"); }

      const sec = CT.VIDEO_SECTIONS.find((s) => t >= s.startSec && t < s.endSec);
      const sid = sec ? sec.id : null;
      if (sid !== currentSectionId) {
        currentSectionId = sid;
        Logger.log("section_enter", { section_id: sid, video_time_sec: +t.toFixed(2) });
      }

      const jumped = (t - lastTime) > 2.0;
      CT.VIDEO_SECTIONS.forEach((s, i) => {
        if (!triggered[i] && t >= s.endSec) {
          triggered[i] = true;
          if (jumped) Logger.log("section_boundary_skipped_seek", { section_index: i, section_id: s.id });
          else Chat.onSectionBoundary(i);
        }
      });
      lastTime = t;
    });
  }

  function init() {
    Flow.lockBack();
    if (!Flow.requireStage("study")) return;
    Logger.init("study");

    document.getElementById("rid-value").textContent = Flow.rid();
    document.querySelector(".brand").textContent = C.STUDY_NAME;
    document.getElementById("chat-input").placeholder = C.CHAT_PLACEHOLDER;

    Chat.mount({
      messages: document.getElementById("chat-messages"),
      input: document.getElementById("chat-input"),
      send: document.getElementById("chat-send"),
    });
    setupVideo();

    document.getElementById("next").addEventListener("click", () => {
      Logger.log("study_complete", { video_time_sec: videoTime() });
      Flow.goNext("study");
    });
  }

  return { init, videoTime, currentSection };
})();

document.addEventListener("DOMContentLoaded", () => Study.init());
