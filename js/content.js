/* ============================================================================
 * CONTENT  —  your study material. Edit freely.
 *
 *  - PRETEST / POSTTEST: question objects. `answer` is the index of the correct
 *    option and is used ONLY for client-side scoring in the logs. It is NEVER
 *    sent to the chatbot. (The transcript the LLM sees lives on the backend.)
 *  - VIDEO_SECTIONS: the timeline boundaries that drive proactive chatbot
 *    behaviour in conditions 2 and 3. `endSec` is when the bot may initiate.
 *  - PROACTIVE_PROMPTS: what the bot opens with at a boundary. {concept} is
 *    replaced by the section title. Keep these concept-focused, never answers.
 * ==========================================================================*/

window.CONTENT = {

  // ---------------------------------------------------------------- INTRO ---
  INTRO_HTML: `
    <p>Thanks for taking part. In this session you will:</p>
    <ol>
      <li>Answer a few short <strong>pre-test</strong> questions.</li>
      <li>Watch a short <strong>lecture video</strong>. An <strong>AI study
          assistant</strong> sits beside the video — you can ask it questions
          about the material at any time.</li>
      <li>Answer a <strong>post-test</strong>.</li>
    </ol>
    <p>The assistant can explain concepts and point you in the right direction,
       but it will not give you answers to the test questions — that part is
       up to you. Please do not refresh or close the tab until you reach the
       end screen, so your responses are saved.</p>
    <p>The whole session takes about <strong>20–30 minutes</strong>.</p>
  `,

  // -------------------------------------------------------------- PRETEST ---
  // 5 questions. type: "mc" (multiple choice) or "likert" or "text".
  PRETEST: [
    { id: "pre_1", type: "mc", prompt: "Q1 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 0 },
    { id: "pre_2", type: "mc", prompt: "Q2 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 1 },
    { id: "pre_3", type: "mc", prompt: "Q3 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 2 },
    { id: "pre_4", type: "likert", prompt: "Q4 — How confident are you with this topic?",
      options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"] },
    { id: "pre_5", type: "text", prompt: "Q5 — In a sentence, what do you already know about this topic?" },
  ],

  // ------------------------------------------------------------- POSTTEST ---
  // 10 questions.
  POSTTEST: [
    { id: "post_1",  type: "mc", prompt: "Q1 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 0 },
    { id: "post_2",  type: "mc", prompt: "Q2 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 1 },
    { id: "post_3",  type: "mc", prompt: "Q3 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 2 },
    { id: "post_4",  type: "mc", prompt: "Q4 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 3 },
    { id: "post_5",  type: "mc", prompt: "Q5 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 0 },
    { id: "post_6",  type: "mc", prompt: "Q6 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 1 },
    { id: "post_7",  type: "mc", prompt: "Q7 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 2 },
    { id: "post_8",  type: "mc", prompt: "Q8 — replace with your question.",
      options: ["Option A", "Option B", "Option C", "Option D"], answer: 3 },
    { id: "post_9",  type: "likert", prompt: "Q9 — How helpful was the AI assistant?",
      options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"] },
    { id: "post_10", type: "text", prompt: "Q10 — Any comments about your experience?" },
  ],

  // -------------------------------------------------------- VIDEO TIMELINE ---
  // Boundaries that drive proactive bot behaviour (conditions 2 & 3).
  // endSec = the moment the bot is allowed to initiate for that section.
  VIDEO_SECTIONS: [
    { id: "s1", title: "Introduction",        startSec: 0,   endSec: 120 },
    { id: "s2", title: "Core concept",        startSec: 120, endSec: 300 },
    { id: "s3", title: "Worked example",      startSec: 300, endSec: 480 },
    { id: "s4", title: "Common mistakes",     startSec: 480, endSec: 660 },
    { id: "s5", title: "Summary",             startSec: 660, endSec: 840 },
  ],

  // What the bot says when it proactively opens at a boundary (conditions 2 & 3).
  // One per section index; {concept} -> section title. Never include answers.
  PROACTIVE_PROMPTS: [
    "We just finished “{concept}”. Want me to recap the key idea, or is anything unclear so far?",
    "That section on “{concept}” can be tricky. Would it help if I walked through the main idea differently?",
    "How are you finding the “{concept}” part? I can give you a worked-through intuition if useful.",
    "“{concept}” trips a lot of people up. Want me to highlight what to watch out for?",
    "We've reached the “{concept}”. Want a quick mental summary to tie it together before the test?",
  ],

  // First thing the bot says when the study view opens (all conditions).
  // For PASSIVE (condition 1) this is the ONLY unsolicited message.
  GREETING: "Hi! I'm your study assistant. Ask me anything about the video and I'll help you make sense of it. I won't give away test answers, but I'm happy to explain the ideas.",
};
