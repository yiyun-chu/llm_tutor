/* ============================================================================
 * CONFIG
 * ==========================================================================*/

window.CONFIG = {

  // ---- Backend ------------------------------------------------------------
  // The address of YOUR FastAPI server (see /backend). It proxies the model,
  // runs the survival model, assigns conditions, and stores logs.
  //   - Local testing:  "http://localhost:8000"
  //   - Deployed:       your server's HTTPS URL, e.g.
  //                     "https://yourname-studybackend.hf.space"
  // NOTE: GitHub Pages is HTTPS, so a deployed backend MUST be HTTPS too.
  // Leave "" to run frontend-only (chat disabled; logs kept + downloadable).
  BACKEND_URL: "https://athenachu-llm-tutor.hf.space",

  // ---- Video (Dropbox) ----------------------------------------------------
  // Paste your Dropbox share link; "?dl=0" is auto-rewritten to a stream URL.
  VIDEO_DROPBOX_URL: "https://www.dropbox.com/scl/fi/7pl5m0pdgfk9cugiy3mk9/group_01_unit_3_02_05.mp4?rlkey=wxzr4g2f2dpg4bzaeptik75mh&st=c7zkmq2i&raw=1",

  // ---- Condition assignment ----------------------------------------------
  // 1 = passive | 2 = active-scheduled | 3 = active-survival
  // "balanced" asks the backend for the next permuted-block condition.
  // Force one while piloting via URL on the FIRST page: index.html?condition=2
  CONDITION_STRATEGY: "balanced",          // "balanced" | "random" | 1 | 2 | 3
  SURVIVAL_THRESHOLD: 0.5,                  // P(needs help) >= this => intervene (cond 3)

  // ---- Logging ------------------------------------------------------------
  LOG_FLUSH_INTERVAL_MS: 8000,
  LOG_DOWNLOAD_BACKUP: true,                // auto-download a full JSON at the end
  VIDEO_HEARTBEAT_SEC: 5,

  // ---- Chat ---------------------------------------------------------------
  CHAT_PLACEHOLDER: "Ask about anything in the video…",
  MAX_CHAT_CHARS: 1000,

  // ---- Study metadata -----------------------------------------------------
  STUDY_NAME: "Video Learning",
  IRB_LINE: "Participation is voluntary. Please take your time to complete the task.",
};

/* ----------------------------------------------------------------------------
 * MODEL PROVIDER  (set on the BACKEND, not here — shown for reference)
 *
 *  Hugging Face Inference Providers (your case):
 *    QWEN_BASE_URL = https://router.huggingface.co/v1
 *    QWEN_API_KEY  = hf_xxx                       (your HF token)
 *    QWEN_MODEL    = Qwen/Qwen3.6-27B:featherless-ai   (or :auto / :cheapest)
 *
 *  Alibaba DashScope (managed Qwen):
 *    QWEN_BASE_URL = https://dashscope-intl.aliyuncs.com/compatible-mode/v1
 *    QWEN_API_KEY  = sk-xxx
 *    QWEN_MODEL    = qwen3.5-27b
 *
 *  Self-hosted (vLLM / SGLang / Ollama) — OpenAI-compatible too:
 *    QWEN_BASE_URL = http://your-host:8000/v1
 *    QWEN_API_KEY  = EMPTY
 *    QWEN_MODEL    = Qwen/Qwen3.6-27B
 * --------------------------------------------------------------------------*/
