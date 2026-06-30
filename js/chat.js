/* ============================================================================
 * CHAT  —  the AI study assistant (Qwen via the backend) and the three
 * experimental conditions that govern when it speaks first.
 *
 *  1 passive          : only responds when the participant writes.
 *  2 active-scheduled : opens at each video section boundary.
 *  3 active-survival  : at each boundary, asks the backend's survival model
 *                       whether help is needed; opens only if predicted help=1.
 *
 * Used only on study.html, which provides window.Study (videoTime/currentSection).
 * ==========================================================================*/
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

window.Chat = (function () {
  const C = window.CONFIG;
  const CT = window.CONTENT;

  let history = [];
  let messagesEl, inputEl, sendBtn, busy = false;

  function mount(els) {
    messagesEl = els.messages; inputEl = els.input; sendBtn = els.send;
    sendBtn.addEventListener("click", onSend);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    });
    addMessage("assistant", CT.GREETING, { kind: "greeting" });
  }

  function addMessage(role, text) {
    const wrap = document.createElement("div");
    wrap.className = `msg msg-${role}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    bubble.innerHTML = marked.parse(text);

    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    history.push({ role, content: text });
    return bubble;
  }

  function showTyping() {
    const wrap = document.createElement("div");
    wrap.className = "msg msg-assistant typing";
    wrap.innerHTML = `<div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  async function onSend() {
    const text = (inputEl.value || "").trim();
    if (!text || busy || text.length > C.MAX_CHAT_CHARS) return;
    inputEl.value = "";
    addMessage("user", text);
    Logger.log("chat_user_message", {
      text, trigger: "user", section: Study.currentSection(), video_time_sec: Study.videoTime(),
    });
    await getReply("user");
  }

  function proactiveOpen(sectionIndex, trigger, extra = {}) {
    const section = CT.VIDEO_SECTIONS[sectionIndex];
    const tmpl = CT.PROACTIVE_PROMPTS[sectionIndex] || CT.PROACTIVE_PROMPTS[0];
    const text = tmpl.replace("{concept}", section ? section.title : "this part");
    addMessage("assistant", text);
    Logger.log("chat_bot_initiation", {
      text, trigger, section_index: sectionIndex,
      section_id: section ? section.id : null, section_title: section ? section.title : null,
      video_time_sec: Study.videoTime(), ...extra,
    });
  }

  async function getReply(trigger) {
    busy = true; sendBtn.disabled = true;
    const typing = showTyping();
    const t0 = performance.now();

    if (!C.BACKEND_URL) {
      typing.remove();
      addMessage("assistant", "(Offline mode: the assistant needs the backend running. See the README.)");
      busy = false; sendBtn.disabled = false; return;
    }

    try {
      const res = await fetch(`${C.BACKEND_URL}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respondent_id: Logger.id, condition: Logger.condition,
          messages: history, section: Study.currentSection(), video_time_sec: Study.videoTime(),
        }),
      });
      if (!res.ok) throw new Error(`chat HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.reply || "(no reply)";
      typing.remove();
      addMessage("assistant", reply);
      Logger.log("chat_bot_response", {
        text: reply, trigger, latency_ms: Math.round(performance.now() - t0),
        prompt_tokens: data.usage ? data.usage.prompt_tokens : null,
        completion_tokens: data.usage ? data.usage.completion_tokens : null,
        model: data.model || null, section: Study.currentSection(), video_time_sec: Study.videoTime(),
      });
    } catch (err) {
      typing.remove();
      addMessage("assistant", "Sorry — I couldn't reach the assistant just now. Please try again.");
      Logger.log("chat_error", { message: err.message, trigger });
    } finally {
      busy = false; sendBtn.disabled = false; inputEl.focus();
    }
  }

  // called by Study at each section boundary
  async function onSectionBoundary(sectionIndex) {
    const c = Logger.condition;
    const section = CT.VIDEO_SECTIONS[sectionIndex];
    Logger.log("section_boundary", {
      section_index: sectionIndex, section_id: section ? section.id : null,
      section_title: section ? section.title : null, video_time_sec: Study.videoTime(),
    });

    if (c === 1) return;                                     // passive
    if (c === 2) { proactiveOpen(sectionIndex, "scheduled"); return; }

    if (c === 3) {                                           // survival-gated
      try {
        const res = await fetch(`${C.BACKEND_URL}/predict`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            respondent_id: Logger.id, section_index: sectionIndex,
            video_time_sec: Study.videoTime(), events: Logger.getAll(),
          }),
        });
        const data = await res.json();
        const prob = typeof data.probability === "number" ? data.probability : 0;
        const intervene = data.prediction === 1 || prob >= C.SURVIVAL_THRESHOLD;
        Logger.log("survival_prediction", {
          section_index: sectionIndex, probability: prob, prediction: intervene ? 1 : 0,
          threshold: C.SURVIVAL_THRESHOLD, features: data.features || null,
          model_version: data.model_version || null,
        });
        if (intervene) proactiveOpen(sectionIndex, "survival", { probability: prob });
      } catch (err) {
        Logger.log("survival_error", { section_index: sectionIndex, message: err.message });
      }
    }
  }

  return { mount, onSectionBoundary, proactiveOpen };
})();
