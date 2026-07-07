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

      let seekGestureActive = false;
      let seekAnchor = null;    // pre-jump position captured at the start of the gesture
      let seekDebounce = null;
      const SEEK_DEBOUNCE_MS = 250;

      let lastSteady = 0;
      (function trackPosition() {
        if (!videoEl.paused && !videoEl.seeking && !seekGestureActive) {
          lastSteady = videoEl.currentTime;
        }
        requestAnimationFrame(trackPosition);
      })();

      let segmentStart = null;
      const MIN_LOG_SPAN_SEC = 0.5;   // ignore near-zero-length segments/seeks as noise

      function closeSegment(reason, endPos) {
        if (segmentStart === null) return;
        const from = segmentStart;
        segmentStart = null;
        if (Math.abs(endPos - from) < MIN_LOG_SPAN_SEC) return;
        Logger.log("video_progress", {
          from_sec: +from.toFixed(2), to_sec: +endPos.toFixed(2),
          duration_sec: +(endPos - from).toFixed(2), reason,
        });
      }

      videoEl.addEventListener("play", () => {
        if (seekGestureActive || videoEl.seeking) return;
        vlog("play");
        if (segmentStart === null) segmentStart = videoEl.currentTime;
      });

      videoEl.addEventListener("pause", () => {
        if (seekGestureActive || videoEl.seeking) return;

        // Filter out seek-induced pauses when browser fires "pause" before "seeking"
        const isJump = Math.abs(videoEl.currentTime - lastSteady) > 0.8;
        if (isJump) return;

        vlog("pause");
        closeSegment("pause", lastSteady);
      });

      videoEl.addEventListener("ratechange", () => { 
        if (!seekGestureActive && !videoEl.seeking) {
          vlog("ratechange", { rate: videoEl.playbackRate }); 
        }
      });

      videoEl.addEventListener("ended", () => {
        vlog("ended");
        closeSegment("ended", videoEl.currentTime);
        document.getElementById("next").disabled = false;
      });

      videoEl.addEventListener("seeking", () => {
        if (!seekGestureActive) {
          seekGestureActive = true;
          seekAnchor = lastSteady;             // pre-jump position for this gesture
          closeSegment("seek", lastSteady);    // watched segment closes out at last known steady point
        }
      });

      videoEl.addEventListener("seeked", () => {
        clearTimeout(seekDebounce);
        seekDebounce = setTimeout(() => {
          const to = videoEl.currentTime;
          const from = seekAnchor !== null ? seekAnchor : lastSteady;
          const delta = +(to - from).toFixed(2);
          
          if (Math.abs(delta) >= MIN_LOG_SPAN_SEC) {
            Logger.log("video_seek", {
              from_sec: +from.toFixed(2), to_sec: +to.toFixed(2),
              delta_sec: delta, direction: delta > 0 ? "forward" : "back",
            });
            
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
          
          // Resume watched segment from seek landing point only if video continues playing
          if (!videoEl.paused) {
            segmentStart = to;
          } else {
            segmentStart = null;
          }
        }, SEEK_DEBOUNCE_MS);
      });

      videoEl.addEventListener("timeupdate", () => {
        const t = videoEl.currentTime;
        if (videoEl.seeking || seekGestureActive) return;

        const sec = CT.VIDEO_SECTIONS.find((s) => t >= s.startSec && t < s.endSec);
        const sid = sec ? sec.id : null;
        if (sid !== currentSectionId) {
          currentSectionId = sid;
          Logger.log("section_enter", { section_id: sid, video_time_sec: +t.toFixed(2) });
        }

        CT.VIDEO_SECTIONS.forEach((s, i) => {
          if (!triggered[i] && t >= s.endSec) { triggered[i] = true; Chat.onSectionBoundary(i); }
        });
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