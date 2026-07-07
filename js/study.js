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

    // A drag/scrub gesture fires several seeking/seeked pairs in a row (the
    // browser re-buffers at each intermediate point), and it can also fire
    // real "pause"/"play" events as a side effect of seeking through an
    // unbuffered region. seekGestureActive tracks whether we're currently
    // inside such a gesture so those spurious events can be suppressed, and
    // the seek itself is only logged once (debounced) after the gesture ends.
    let seekGestureActive = false;
    let seekAnchor = null;    // position captured at the start of the gesture
    let seekDebounce = null;
    const SEEK_DEBOUNCE_MS = 250;

    videoEl.addEventListener("play", () => { if (!seekGestureActive) vlog("play"); });
    videoEl.addEventListener("pause", () => { if (!seekGestureActive) vlog("pause"); });
    videoEl.addEventListener("ratechange", () => { if (!seekGestureActive) vlog("ratechange", { rate: videoEl.playbackRate }); });
    videoEl.addEventListener("ended", () => { vlog("ended"); document.getElementById("next").disabled = false; });

    let lastSteady = 0;      // last position during NORMAL (non-seeking) playback
    let lastHeartbeat = 0;

    videoEl.addEventListener("seeking", () => {
      if (!seekGestureActive) {
        seekGestureActive = true;
        seekAnchor = lastSteady;   // pre-drag position, captured once per gesture
      }
    });

    // Multiple seeked events can fire per gesture; only the last one (after
    // events stop arriving for SEEK_DEBOUNCE_MS) reflects where the user
    // actually released the scrubber, so that's the only one we log.
    videoEl.addEventListener("seeked", () => {
      clearTimeout(seekDebounce);
      seekDebounce = setTimeout(() => {
        const to = videoEl.currentTime;
        const from = seekAnchor;
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
        seekGestureActive = false;
        seekAnchor = null;
      }, SEEK_DEBOUNCE_MS);
    });

    videoEl.addEventListener("timeupdate", () => {
      const t = videoEl.currentTime;
      if (videoEl.seeking || seekGestureActive) return;   // ignore positions during/just after a seek gesture

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