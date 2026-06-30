"""
Backend for the video-learning study.

Endpoints
---------
GET  /health   liveness check
POST /assign   balanced (permuted-block) condition assignment
POST /chat     proxy to Qwen (OpenAI-compatible); injects transcript + guardrails
POST /predict  survival-model prediction (condition 3): does this user need help?
POST /log      append a batch of interaction events to a JSONL store

Run locally:
    pip install -r requirements.txt
    # Hugging Face Inference Providers (your case):
    export QWEN_API_KEY=hf_your_token
    export QWEN_BASE_URL=https://router.huggingface.co/v1
    export QWEN_MODEL=Qwen/Qwen3.6-27B:featherless-ai
    # Qwen3.6 thinks by default; <think> is stripped automatically. To also tell
    # the provider not to think: export QWEN_EXTRA_BODY='{"chat_template_kwargs":{"enable_thinking":false}}'
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload

The API key NEVER leaves this server. The frontend only talks to these endpoints.
"""

import os, json, random, threading, datetime, pathlib
from typing import List, Optional, Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

import feature_processing  # local module

# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #
DATA_DIR   = pathlib.Path(os.getenv("DATA_DIR", "./data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

QWEN_API_KEY  = os.getenv("QWEN_API_KEY", "") or os.getenv("HF_TOKEN", "")
QWEN_BASE_URL = os.getenv("QWEN_BASE_URL", "https://router.huggingface.co/v1")
QWEN_MODEL    = os.getenv("QWEN_MODEL", "Qwen/Qwen3.6-27B:featherless-ai")
MODEL_PATH    = os.getenv("SURVIVAL_MODEL_PATH", "./model/survival_model.pkl")
CORS_ORIGINS  = os.getenv("CORS_ORIGINS", "*").split(",")

# Optional provider-specific params, as a JSON string, passed to the model.
# To turn OFF Qwen3.6's <think> output on vLLM/SGLang/HF providers, set:
#   QWEN_EXTRA_BODY='{"chat_template_kwargs": {"enable_thinking": false}}'
# (On Alibaba DashScope use '{"enable_thinking": false}' instead.)
try:
    QWEN_EXTRA_BODY = json.loads(os.getenv("QWEN_EXTRA_BODY", "") or "null")
except Exception:
    QWEN_EXTRA_BODY = None

TRANSCRIPT_PATH = DATA_DIR / "transcript.txt"
QUIZ_STEMS_PATH = DATA_DIR / "quiz_stems.txt"   # OPTIONAL: question stems, NO answers

_client = OpenAI(api_key=QWEN_API_KEY, base_url=QWEN_BASE_URL) if QWEN_API_KEY else None
_lock = threading.Lock()

app = FastAPI(title="Video Learning Study Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _read(path: pathlib.Path) -> str:
    try:
        return path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return ""

def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def build_system_prompt() -> str:
    transcript = _read(TRANSCRIPT_PATH) or "(transcript not provided)"
    stems = _read(QUIZ_STEMS_PATH)
    quiz_block = ""
    if stems:
        quiz_block = (
            "\n\nThese are the assessment questions the student must answer on their "
            "own. You are NEVER allowed to answer them, confirm an answer, or reveal "
            "which option is correct:\n" + stems
        )
    return (
        "You are a friendly study assistant helping a student understand a lecture "
        "video. Use the transcript below as your source of truth about what the video "
        "covers. Help the student build understanding: explain concepts in plain "
        "language, give intuitions and analogies, work through examples, and ask "
        "guiding questions.\n\n"
        "HARD RULES (never break these):\n"
        "1. This is a graded study. NEVER give answers to test, quiz, or assessment "
        "questions, and never tell the student which choice is correct. If asked, "
        "encourage them to reason it through and offer a conceptual hint instead.\n"
        "2. Never write the student's answers for them or do their assessment work.\n"
        "3. Stay on the lecture's topics; gently redirect off-topic requests.\n"
        "4. Be concise, warm, and encouraging.\n\n"
        f"TRANSCRIPT:\n{transcript}"
        f"{quiz_block}"
    )

def append_jsonl(path: pathlib.Path, rows: List[Dict[str, Any]]) -> None:
    with _lock:
        with path.open("a", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")

# Qwen3.6 "thinks" by default, emitting <think>...</think>. Strip it so the
# student only sees the final answer. Handles both the full pair and the case
# where only a trailing </think> is present.
import re
_THINK = re.compile(r"<think>.*?</think>", re.DOTALL)
def strip_think(text: str) -> str:
    if not text:
        return text
    text = _THINK.sub("", text)
    if "</think>" in text and "<think>" not in text:
        text = text.split("</think>")[-1]
    return text.strip()

# --------------------------------------------------------------------------- #
# Schemas
# --------------------------------------------------------------------------- #
class AssignIn(BaseModel):
    respondent_id: str

class ChatMsg(BaseModel):
    role: str
    content: str

class ChatIn(BaseModel):
    respondent_id: str
    condition: Optional[int] = None
    messages: List[ChatMsg]
    section: Optional[str] = None
    video_time_sec: Optional[float] = None

class PredictIn(BaseModel):
    respondent_id: str
    section_index: Optional[int] = None
    video_time_sec: Optional[float] = None
    events: List[Dict[str, Any]] = []

class LogIn(BaseModel):
    respondent_id: str
    events: List[Dict[str, Any]]

# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@app.get("/health")
def health():
    return {"ok": True, "qwen_configured": _client is not None, "model": QWEN_MODEL}


@app.post("/assign")
def assign(inp: AssignIn):
    """Permuted-block randomization across the 3 conditions (balanced every 3)."""
    path = DATA_DIR / "assignments.json"
    with _lock:
        state = json.loads(path.read_text()) if path.exists() else \
            {"respondents": {}, "block": [], "counts": {"1": 0, "2": 0, "3": 0}}

        if inp.respondent_id in state["respondents"]:          # idempotent
            return {"condition": state["respondents"][inp.respondent_id], "reused": True}

        if not state["block"]:                                  # refill a fresh block
            state["block"] = random.sample([1, 2, 3], 3)
        cond = state["block"].pop(0)

        state["respondents"][inp.respondent_id] = cond
        state["counts"][str(cond)] += 1
        path.write_text(json.dumps(state, indent=2))
    return {"condition": cond, "reused": False, "counts": state["counts"]}


@app.post("/chat")
def chat(inp: ChatIn):
    if _client is None:
        return {"reply": "(Server has no Qwen API key configured.)", "error": "no_key"}

    messages = [{"role": "system", "content": build_system_prompt()}]
    messages += [{"role": m.role, "content": m.content} for m in inp.messages]

    try:
        kwargs = dict(model=QWEN_MODEL, messages=messages, temperature=0.4, max_tokens=600)
        if QWEN_EXTRA_BODY:
            kwargs["extra_body"] = QWEN_EXTRA_BODY
        resp = _client.chat.completions.create(**kwargs)
        reply = strip_think(resp.choices[0].message.content)
        usage = getattr(resp, "usage", None)
        usage_d = {"prompt_tokens": usage.prompt_tokens,
                   "completion_tokens": usage.completion_tokens} if usage else None
    except Exception as e:
        return {"reply": "Sorry, I had trouble responding. Please try again.",
                "error": str(e)}

    # server-side log of the exact prompt/response pair
    append_jsonl(DATA_DIR / f"{inp.respondent_id}.jsonl", [{
        "respondent_id": inp.respondent_id, "condition": inp.condition,
        "type": "chat_exchange_server", "ts_iso": _now(),
        "section": inp.section, "video_time_sec": inp.video_time_sec,
        "user_message": inp.messages[-1].content if inp.messages else None,
        "assistant_reply": reply, "model": QWEN_MODEL, "usage": usage_d,
    }])
    return {"reply": reply, "model": QWEN_MODEL, "usage": usage_d}


@app.post("/predict")
def predict(inp: PredictIn):
    """Condition 3: predict whether the participant needs proactive help (1/0)."""
    features = feature_processing.extract_features(
        inp.events, video_time_sec=inp.video_time_sec, section_index=inp.section_index)
    prob, version = feature_processing.predict_help_probability(features, MODEL_PATH)
    prediction = int(prob >= 0.5)

    append_jsonl(DATA_DIR / f"{inp.respondent_id}.jsonl", [{
        "respondent_id": inp.respondent_id, "type": "survival_prediction_server",
        "ts_iso": _now(), "section_index": inp.section_index,
        "video_time_sec": inp.video_time_sec, "probability": prob,
        "prediction": prediction, "features": features, "model_version": version,
    }])
    return {"probability": prob, "prediction": prediction,
            "features": features, "model_version": version}


@app.post("/log")
def log(inp: LogIn):
    """Append the participant's interaction events. JSONL = crash-safe + tidy."""
    append_jsonl(DATA_DIR / f"{inp.respondent_id}.jsonl", inp.events)
    append_jsonl(DATA_DIR / "all_events.jsonl", inp.events)   # combined stream
    return {"ok": True, "received": len(inp.events)}
