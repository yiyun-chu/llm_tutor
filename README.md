# Video Learning + AI Tutor — Experiment Platform

A participant-facing study that runs as **separate, forward-only pages**:

```
index.html → pretest.html → study.html → posttest.html → end.html
 (intro)      (5 questions)   (video+AI)   (10 questions)   (done)
```

A respondent ID and condition are created on the first page and carried through
the rest. Once you click **Next**, you can't go back — the Back button is
blocked and any attempt to revisit an earlier page (or skip ahead) redirects to
the page you're supposed to be on.

---

## Why this is split into a frontend *and* a small backend

GitHub Pages can only serve static files — it can't run Python or write log
files. Three of your requirements genuinely need a server:

1. **The survival model** (`feature_processing.py` + weights) is Python — it
   can't run in the browser.
2. **The Qwen API key** must never sit in client-side code (your repo is
   public; anyone could read it). A backend keeps it secret.
3. **Reliable logging** needs somewhere to write. A browser can only download a
   file to the participant's own laptop, which is lost if they close the tab.

So the design is:

```
   Participant browser (GitHub Pages, static)
        │   /assign  /chat  /predict  /log
        ▼
   FastAPI backend  ──►  Qwen (DashScope / self-hosted vLLM / Ollama)
        │                survival model (your .pkl)
        ▼
   data/<respondent>.jsonl   ← all events, append-only
```

If you don't run the backend, the frontend still works in **offline mode**:
pages, video and logging-to-download all function; only the chatbot is
disabled.

---

## Logging: the better way you asked about

You used Google Apps Script before. Since you already need a backend for the
model and the Qwen key, the cleanest approach is to **route every event through
the backend and append it to JSONL** (one JSON object per line):

- Append-only and crash-safe — a dropped connection never corrupts the file.
- One file per participant (`data/R-XXXX.jsonl`) plus a combined
  `data/all_events.jsonl`.
- Trivial to analyze: `pandas.read_json("R-XXXX.jsonl", lines=True)`.
- No quotas, no Apps Script timeouts, no Sheets row limits.

The frontend buffers events and flushes every few seconds (and on tab close via
`navigator.sendBeacon`), so nothing is lost mid-session. As a belt-and-braces
backup it also auto-downloads a full `*_log.json` at the end.

**Alternatives**, depending on how you want to store data:

| Option | Good when | Trade-off |
|---|---|---|
| **Backend → JSONL** (default here) | you control a server anyway | you manage the box/files |
| **Supabase** (free Postgres + REST) | you want a managed DB + CSV export + dashboard, no file wrangling | extra service to set up |
| **Google Drive** | you want files in Drive | run the backend on a machine with Drive synced, or `rclone copy data/ gdrive:study/` on a cron |
| **Browser download only** | tiny pilot, no server | fragile — lost if a participant closes the tab |

To send to Supabase/Drive instead of (or in addition to) JSONL, edit the
`/log` route in `backend/app.py` — it's the single choke point all events pass
through.

---

## Quick start

### 1. Backend
```bash
cd backend
pip install -r requirements.txt

# Hugging Face Inference Providers (uses your HF token):
export QWEN_API_KEY=hf_your_token
export QWEN_BASE_URL=https://router.huggingface.co/v1
export QWEN_MODEL=Qwen/Qwen3.6-27B:featherless-ai     # or :auto / :cheapest
# Qwen3.6 "thinks" by default; the <think> block is stripped automatically.
# To also ask the provider not to think:
# export QWEN_EXTRA_BODY='{"chat_template_kwargs":{"enable_thinking":false}}'

uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
Put your real lecture transcript in `backend/data/transcript.txt`. (Optionally
add question wording — **never answers** — to `backend/data/quiz_stems.txt` so
the tutor recognizes and refuses test questions.)

**Model provider** — anything OpenAI-compatible works; change only these vars:
- **Hugging Face** (above): `Qwen/Qwen3.6-27B` is served via Inference
  Providers (Featherless AI). The `:provider` suffix is required on the HF
  router; `:auto` lets HF pick. Billing is pay-as-you-go after HF's monthly
  free credit. For guaranteed uptime in a live study, consider a dedicated HF
  Inference Endpoint or self-hosting (below) rather than serverless.
- **Alibaba DashScope** (managed Qwen): base
  `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`, model e.g.
  `qwen3.5-27b`.
- **Self-hosted open weights**: run vLLM/SGLang (the Qwen3.6 model card gives
  exact commands; needs GPUs) or Ollama, then point `QWEN_BASE_URL` at
  `http://your-host:8000/v1` with `QWEN_API_KEY=EMPTY`.

### 2. Frontend
Edit `js/config.js`:
- `BACKEND_URL` → **where your backend runs** (this is "the backend URL"):
  - local testing: `http://localhost:8000`
  - deployed: your server's **HTTPS** URL, e.g. `https://yourname-studybackend.hf.space`
  - GitHub Pages is HTTPS, so a deployed backend must be HTTPS too — a browser
    blocks an HTTPS page from calling `http://`.
- `VIDEO_DROPBOX_URL` → your Dropbox share link (the `?dl=0` is auto-rewritten
  to a direct stream).

Serve locally to test (use a server, not file://, so the pages can navigate):
```bash
python3 -m http.server 5500   # from the repo root, then open http://localhost:5500
```

### 3. Deploy
- **Frontend → GitHub Pages.** Push to `main`; either enable Pages → *Deploy
  from a branch → root*, or use the included workflow. All five `.html` files
  sit at the repo root.
- **Backend → anywhere that runs Python and gives HTTPS.** A Hugging Face Space
  (Docker/FastAPI) is convenient since you already have an HF account and can
  store your HF token as a Space secret — its URL is
  `https://<user>-<space>.hf.space`. Render and Railway also work. Set the env
  vars there, and set `CORS_ORIGINS` to your Pages URL (e.g.
  `https://you.github.io`).

## Pages & navigation (forward-only)

Each step is its own page. Shared state (respondent ID, condition, progress, and
the full event archive for the backup file) is kept in `sessionStorage`, so it
survives page-to-page navigation within the tab. `js/flow.js` enforces
forward-only movement: it blocks the Back button and redirects any out-of-order
visit to the correct page. (Opening the study in a new tab starts a new session,
so instruct participants to stay in one tab.)

---

## The three conditions

Assigned at session start by **permuted-block randomization** (`/assign` keeps
the three arms balanced every 3 participants). Force one while piloting with
`?condition=2` in the URL.

1. **Passive** — the tutor answers when asked, never initiates.
2. **Active (scheduled)** — at each video **section boundary** (the `endSec`
   times in `content.js → VIDEO_SECTIONS`) the tutor opens with a
   concept-focused message.
3. **Active (survival-gated)** — at each boundary the backend runs the survival
   model on the interaction log; the tutor opens **only if** it predicts the
   learner needs help. Same timing as condition 2, so the two are comparable.

Boundaries crossed by *seeking* are logged but don't trigger the bot, so a
fast-forward won't spam proactive messages.

## Plugging in your survival model

Drop your trained model at `backend/model/survival_model.pkl` (or set
`SURVIVAL_MODEL_PATH`) and edit `predict_help_probability()` in
`feature_processing.py` — it has worked examples for scikit-survival, lifelines,
and plain sklearn. Keep `FEATURE_ORDER` matched to your training columns. Until
a model is present, a transparent heuristic runs so you can test the whole flow.

## The tutor never gives test answers

The answer keys live only in the frontend (`content.js`) for client-side
scoring and are **never** sent to the model. The backend builds the system
prompt from the transcript plus hard rules forbidding it from answering or
confirming assessment questions; the optional `quiz_stems.txt` (stems only)
helps it recognize them.

---

## What gets logged

Every event is one JSON line: `respondent_id`, `condition`, `stage` (which
page), `ts_iso`, `t_ms` (ms since that page loaded), `type`, plus type-specific
fields. Types include: `session_start`, `condition_assigned`, `page_enter`,
`question_answer`, `phase_score`, video events (`play/pause/seek/progress/ended`),
`section_enter`, `section_boundary`, `chat_user_message`, `chat_bot_response`,
`chat_bot_initiation` (with `trigger`: `scheduled` | `survival`),
`survival_prediction` (probability + features), and `survey_end`.

Analyze with:
```python
import pandas as pd
df = pd.read_json("backend/data/all_events.jsonl", lines=True)
```

## Notes
- **Dropbox for video** is fine for small studies; for many participants its
  bandwidth limits can throttle. If seeking is choppy, try the
  `dl.dropboxusercontent.com` host, or host the video on a CDN / institutional
  server / Cloudflare R2.
- Qwen calls cost per token (or are free if self-hosted). Each chat sends the
  transcript as context, so a shorter transcript = cheaper calls.
- Make the repo **private** during data collection if your answer keys or
  transcript are sensitive.
