/* ============================================================================
 * FLOW  —  ties the separate pages into one forward-only session.
 *
 *  - Persists respondent ID, condition, progress, and the full event archive
 *    in sessionStorage so they survive page-to-page navigation.
 *  - Forward-only: each page checks it is allowed; navigating back (URL or
 *    button) redirects forward to the furthest stage reached.
 *  - Blocks the browser Back button on every page.
 * ==========================================================================*/

window.Flow = (function () {
  const C = window.CONFIG;
  const SS = window.sessionStorage;

  const STAGES = ["intro", "pretest", "study", "posttest", "end"];
  const FILES = {
    intro: "index.html", pretest: "pretest.html", study: "study.html",
    posttest: "posttest.html", end: "end.html",
  };

  const get = (k, d = null) => { try { const v = SS.getItem(k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } };
  const set = (k, v) => SS.setItem(k, JSON.stringify(v));
  const idx = (s) => STAGES.indexOf(s);

  // ---- session identity --------------------------------------------------
  const rid        = () => get("rid");
  const condition  = () => get("condition");
  const furthest   = () => get("furthest", "intro");

  function makeRespondentId() {
    const t = Date.now().toString(36);
    const r = Math.random().toString(36).slice(2, 8);
    return `R-${t}-${r}`.toUpperCase();
  }

  async function assignCondition(respondentId) {
    const forced = new URLSearchParams(location.search).get("condition");
    if (forced && ["1", "2", "3"].includes(forced)) return +forced;

    const strat = C.CONDITION_STRATEGY;
    if (strat === 1 || strat === 2 || strat === 3) return strat;

    if (strat === "balanced" && C.BACKEND_URL) {
      try {
        const res = await fetch(`${C.BACKEND_URL}/assign`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ respondent_id: respondentId }),
        });
        if (res.ok) { const d = await res.json(); if (d.condition) return d.condition; }
      } catch (_) { /* fall through */ }
    }
    return 1 + Math.floor(Math.random() * 3);
  }

  function initSession(respondentId, cond) {
    set("rid", respondentId);
    set("condition", cond);
    set("furthest", "intro");
    set("archive", []);
  }

  // ---- event archive (for the end-of-study backup download) --------------
  function archiveAppend(events) {
    if (!events.length) return;
    const a = get("archive", []);
    for (const e of events) a.push(e);
    set("archive", a);
  }
  const archiveAll = () => get("archive", []);

  // ---- navigation guards -------------------------------------------------
  // Call at the top of each page. Only the furthest-reached stage is allowed;
  // any earlier page (Back) or later page (skip-ahead via URL) redirects to it.
  function requireStage(stage) {
    if (stage !== "intro" && !rid()) { location.replace(FILES.intro); return false; }
    if (stage !== furthest()) { location.replace(FILES[furthest()]); return false; }
    return true;
  }

  function advanceTo(stage) {
    if (idx(stage) > idx(furthest())) set("furthest", stage);
  }

  // Move to the next page (forward-only; previous page removed from history).
  function goNext(currentStage) {
    const next = STAGES[idx(currentStage) + 1];
    if (!next) return;
    advanceTo(next);
    if (window.Logger) Logger.persistArchive();   // save this page's events first
    location.replace(FILES[next]);
  }

  // Trap the browser Back button on this page.
  function lockBack() {
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", () => history.pushState(null, "", location.href));
  }

  return {
    STAGES, FILES, get, set,
    rid, condition, furthest,
    makeRespondentId, assignCondition, initSession,
    archiveAppend, archiveAll,
    requireStage, advanceTo, goNext, lockBack,
  };
})();
