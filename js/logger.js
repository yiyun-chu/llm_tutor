/* ============================================================================
 * LOGGER  —  captures every action, ships it to the backend (JSONL store), and
 * keeps a per-session archive in sessionStorage so the end page can download a
 * complete backup even across separate pages.
 *
 * Each event: {respondent_id, condition, stage, type, ts_iso, t_ms, ...}
 * (t_ms is ms since THIS page loaded; ts_iso is absolute. Backend joins them
 *  per respondent. feature_processing scopes temporal features to stage="study".)
 * ==========================================================================*/

window.Logger = (function () {
  const C = window.CONFIG;
  let stage = null, rid = null, cond = null, startedAt = null;
  const buffer = [];   // not-yet-flushed (to backend)
  const page   = [];   // this page's events (merged into the archive on exit)
  let flushTimer = null;

  function init(stageName) {
    stage = stageName;
    rid = Flow.rid();
    cond = Flow.condition();
    startedAt = Date.now();
    flushTimer = setInterval(flush, C.LOG_FLUSH_INTERVAL_MS);
    window.addEventListener("beforeunload", () => { flush(true); persistArchive(); });
    document.addEventListener("visibilitychange", () => {
      log("visibility", { state: document.visibilityState });
      if (document.visibilityState === "hidden") { flush(true); persistArchive(); }
    });
    log("page_enter", { stage });
  }

  function log(type, data = {}) {
    const evt = {
      respondent_id: rid, condition: cond, stage, type,
      ts_iso: new Date().toISOString(),
      t_ms: startedAt ? Date.now() - startedAt : 0,
      ...data,
    };
    buffer.push(evt); page.push(evt);
    return evt;
  }

  async function flush(useBeacon = false) {
    if (!buffer.length || !C.BACKEND_URL) return;
    const batch = buffer.splice(0, buffer.length);
    const body = JSON.stringify({ respondent_id: rid, events: batch });
    const url = `${C.BACKEND_URL}/log`;
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      } else {
        const res = await fetch(url, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body, keepalive: true,
        });
        if (!res.ok) throw new Error(`log HTTP ${res.status}`);
      }
    } catch (err) {
      buffer.unshift(...batch);   // retry next time; never drop events
      console.warn("Log flush failed, will retry:", err.message);
    }
  }

  // merge this page's events into the cross-page archive
  function persistArchive() {
    if (window.Flow && page.length) Flow.archiveAppend(page.splice(0, page.length));
  }

  // full session log = archive (prior pages) + this page so far
  function getAll() {
    const prior = window.Flow ? Flow.archiveAll() : [];
    return prior.concat(page);
  }

  function downloadBackup() {
    if (!C.LOG_DOWNLOAD_BACKUP) return;
    const blob = new Blob([JSON.stringify(getAll(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${rid || "session"}_log.json`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  return { init, log, flush, persistArchive, getAll, downloadBackup,
           get id() { return rid; }, get condition() { return cond; } };
})();
