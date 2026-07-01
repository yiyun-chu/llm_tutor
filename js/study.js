/* Study page (study.html): video + AI tutor, with the timeline that drives
 * the chatbot's condition behaviour. Exposes window.Study for chat.js. */
window.Study = (function () {
  const C = window.CONFIG;
  const CT = window.CONTENT;

  let videoEl = null;
  let triggered = [];
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

    let lastSteady = 0;      // last position during NORMAL (non-seeking) playback
    let lastHeartbeat = 0;

    // A completed seek is the reliable moment to capture from -> to. lastSteady
    // is the pre-drag position (timeupdate is ignored while seeking, so drag
    // positions never overwrite it).
    videoEl.addEventListener("seeked", () => {
      const to = videoEl.currentTime;
      const from = lastSteady;
      const delta = +(to - from).toFixed(2);
      if (Math.abs(delta) >= 0.5) {
        Logger.log("video_seek", {
          from_sec: +from.toFixed(2), to_sec: +to.toFixed(2),
          delta_sec: delta, direction: delta > 0 ? "forward" : "back",
        });
        // boundaries between from and to were jumped over, not watched
        CT.VIDEO_SECTIONS.forEach((s, i) => {
          if (!triggered[i] && to >= s.endSec) {
            triggered[i] = true;
            Logger.log("section_boundary_skipped_seek", { section_index: i, section_id: s.id });
          }
        });
      }
      lastSteady = to;
    });

    videoEl.addEventListener("timeupdate", () => {
      const t = videoEl.currentTime;
      if (videoEl.seeking) return;   // ignore positions while a seek is in progress

      if (t - lastHeartbeat >= C.VIDEO_HEARTBEAT_SEC) { lastHeartbeat = t; vlog("progress"); }

      const sec = CT.VIDEO_SECTIONS.find((s) => t >= s.startSec && t < s.endSec);
      const sid = sec ? sec.id : null;
      if (sid !== currentSectionId) {
        currentSectionId = sid;
        Logger.log("section_enter", { section_id: sid, video_time_sec: +t.toFixed(2) });
      }

      // normal-playback boundary crossings trigger the assistant (conditions 2/3)
      CT.VIDEO_SECTIONS.forEach((s, i) => {
        if (!triggered[i] && t >= s.endSec) { triggered[i] = true; Chat.onSectionBoundary(i); }
      });

      lastSteady = t;
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