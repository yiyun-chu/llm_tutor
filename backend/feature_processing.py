"""
feature_processing.py
=====================
Turns a participant's raw interaction log into model features, then scores them
with your trained survival model to decide whether the chatbot should step in.

Two functions are called by the backend:
    extract_features(events, video_time_sec, section_index) -> dict
    predict_help_probability(features, model_path)          -> (prob, version)

------------------------------------------------------------------------------
PLUGGING IN YOUR OWN MODEL
------------------------------------------------------------------------------
Replace the body of `predict_help_probability`. The pattern below loads a
pickled estimator once and calls it. Your survival model can be anything that,
given the feature vector, yields a probability/hazard of "needs help soon":

    * scikit-survival  (CoxnetSurvivalAnalysis, RandomSurvivalForest, ...)
    * lifelines        (CoxPHFitter.predict_partial_hazard)
    * a plain sklearn classifier with predict_proba
    * raw coefficients you dot with the feature vector

Keep FEATURE_ORDER in sync with whatever your model was trained on, so the
vector you build here matches the columns the model expects.
"""

from __future__ import annotations
import os, math, functools, pathlib
from typing import List, Dict, Any, Tuple

# The exact feature columns your model expects, in order.
FEATURE_ORDER = [
    "video_time_sec",
    "frac_section_idx",
    "n_user_messages",
    "n_bot_responses",
    "sec_since_last_user_msg",
    "n_video_pauses",
    "n_video_seeks",
    "msgs_in_current_section",
    "pretest_percent",
    "idle_ratio",
]


# --------------------------------------------------------------------------- #
# Feature extraction
# --------------------------------------------------------------------------- #
def extract_features(events: List[Dict[str, Any]],
                     video_time_sec: float | None = None,
                     section_index: int | None = None) -> Dict[str, float]:
    """Compute a feature dict from the chronological event log.

    Temporal/behavioural features are scoped to the STUDY page (where the video
    and chat live) so that time spent on earlier pages doesn't distort them.
    `pretest_percent` is read from any page. If no events carry a `stage` field
    (e.g. older single-page logs), all events are used.
    """
    study = [e for e in events if e.get("stage") == "study"]
    scoped = study if study else events

    def of(t):  # events of a given type, within the scoped window
        return [e for e in scoped if e.get("type") == t]

    user_msgs = of("chat_user_message")
    bot_resp  = of("chat_bot_response")
    pauses    = of("video_pause")
    seeks     = of("video_seek")

    # time since the last participant message (s). Big => possibly disengaged.
    now_ms = max((e.get("t_ms", 0) for e in scoped), default=0)
    last_user_ms = max((e.get("t_ms", 0) for e in user_msgs), default=0)
    sec_since_last = (now_ms - last_user_ms) / 1000.0 if user_msgs else 9999.0

    # messages sent while in the current section
    cur_sid = None
    for e in reversed(scoped):
        if e.get("type") == "section_enter":
            cur_sid = e.get("section_id"); break
    msgs_here = sum(1 for e in user_msgs if e.get("section") == cur_sid)

    # pretest performance, if scored already (read from ALL events)
    pre = next((e for e in events
                if e.get("type") == "phase_score" and e.get("phase") == "pretest"), None)
    pretest_pct = (pre.get("percent") or 0) / 100.0 if pre else 0.5

    # rough idle ratio: gaps > 20s between consecutive events / total span
    ts = sorted(e.get("t_ms", 0) for e in scoped)
    idle_ms = sum(max(0, b - a - 20000) for a, b in zip(ts, ts[1:])) if len(ts) > 1 else 0
    span = (ts[-1] - ts[0]) if len(ts) > 1 else 1
    idle_ratio = idle_ms / span if span else 0.0

    return {
        "video_time_sec": float(video_time_sec or 0),
        "frac_section_idx": float(section_index or 0),
        "n_user_messages": float(len(user_msgs)),
        "n_bot_responses": float(len(bot_resp)),
        "sec_since_last_user_msg": float(min(sec_since_last, 9999.0)),
        "n_video_pauses": float(len(pauses)),
        "n_video_seeks": float(len(seeks)),
        "msgs_in_current_section": float(msgs_here),
        "pretest_percent": float(pretest_pct),
        "idle_ratio": float(round(idle_ratio, 4)),
    }


def to_vector(features: Dict[str, float]) -> List[float]:
    """Order the feature dict into the vector your model was trained on."""
    return [features.get(k, 0.0) for k in FEATURE_ORDER]


# --------------------------------------------------------------------------- #
# Prediction
# --------------------------------------------------------------------------- #
@functools.lru_cache(maxsize=1)
def _load_model(model_path: str):
    """Load the trained model once. Returns None if no file is present."""
    p = pathlib.Path(model_path)
    if not p.exists():
        return None
    import pickle
    with p.open("rb") as f:
        return pickle.load(f)


def predict_help_probability(features: Dict[str, float],
                             model_path: str) -> Tuple[float, str]:
    """
    Return (probability_needs_help, model_version).

    If a trained model is found at `model_path`, it is used. Otherwise a
    transparent heuristic keeps the whole pipeline working out of the box so
    you can build and test the platform before the real model is ready.
    """
    model = _load_model(model_path)
    x = to_vector(features)

    if model is not None:
        # ---- YOUR MODEL HERE -------------------------------------------- #
        # Example for a sklearn classifier with predict_proba:
        #     prob = float(model.predict_proba([x])[0][1])
        # Example for lifelines CoxPH (risk -> 0..1 via a logistic squashing):
        #     risk = float(model.predict_partial_hazard(pd.DataFrame([features]))[0])
        #     prob = 1 / (1 + math.exp(-(risk - 1)))
        try:
            if hasattr(model, "predict_proba"):
                prob = float(model.predict_proba([x])[0][1])
            elif hasattr(model, "predict"):
                prob = float(model.predict([x])[0])
            else:
                prob = _heuristic(features)
            return max(0.0, min(1.0, prob)), os.getenv("MODEL_VERSION", "trained-v1")
        except Exception:
            pass  # fall back to heuristic if the model errors

    return _heuristic(features), "heuristic-fallback"


def _heuristic(f: Dict[str, float]) -> float:
    """
    Stand-in for the survival model. Higher when the learner looks stuck:
    long silence, no questions asked in this section, lots of pauses/seeks,
    and weaker pretest performance. Replace with your trained model.
    """
    z = (
        -1.4
        + 0.0010 * min(f["sec_since_last_user_msg"], 600)
        + 0.45  * (1 if f["msgs_in_current_section"] == 0 else 0)
        + 0.20  * f["n_video_pauses"]
        + 0.15  * f["n_video_seeks"]
        + 0.90  * (1 - f["pretest_percent"])
        + 1.2   * f["idle_ratio"]
    )
    return 1.0 / (1.0 + math.exp(-z))
