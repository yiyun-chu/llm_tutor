/* ============================================================================
 * CONTENT
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
      <li>Answer a short <strong>demographic survey</strong> followed by a <strong>pre-test</strong>.</li>
      <li>Watch a short <strong>lecture video</strong>. An <strong>AI study
          assistant</strong> sits beside the video — you can ask it questions
          about the material at any time.</li>
      <li>Answer a <strong>post-test</strong>.</li>
    </ol>
    <p>During the learning activity, an AI assistant will be available to explain concepts and 
    point you in the right direction, but it is up to you how much you choose to use it. Please
    do not refresh or close this tab until you reach the end screen so that your responses are saved.</p>
    <p>The whole session takes about <strong>30-40 minutes</strong>.</p>
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
  GREETING: "Hi! I'm your study assistant. Ask me anything about the video and I'll help you make sense of it.",

  // Survey
  // ------------------------------------------------------------ Surevy ---
  DEMOGRAPHICS: [
    {
      id: "demo_age",
      type: "mc",
      prompt: "Age",
      options: [
        "17 or younger",
        "18-20",
        "21-23",
        "24-26",
        "27-30",
        "31 or older",
        "Prefer not to say"
      ]
    },
    {
      id: "demo_gender",
      type: "mc",
      prompt: "Gender",
      options: [
        "Woman",
        "Man",
        "Non-binary",
        "Prefer not to say"
      ]
    },
    {
      id: "demo_race",
      type: "mc",
      prompt: "Race/Ethnicity",
      options: [
        "American Indian or Alaska Native",
        "Asian",
        "Black or African American",
        "Hispanic or Latino",
        "Native Hawaiian or Other Pacific Islander",
        "White",
        "Prefer not to say"
      ]
    },
    {
      id: "demo_firstgen",
      type: "mc",
      prompt: "First-Generation College Student: Are you the first person in your immediate family (parents/legal guardians) to attend a four-year college or university?",
      options: [
        "Yes",
        "No",
        "Prefer not to say"
      ]
    },
    {
      id: "demo_major",
      type: "mc",
      prompt: "Major / Field of Study (Select the category that best relates)",
      options: [
        "Physical Sciences (e.g., Chemistry, Physics, Earth Science)",
        "Life Sciences (e.g., Biology, Biochemistry, Health Sciences)",
        "Engineering",
        "Computer Science / Mathematics",
        "Social Sciences (e.g., Psychology, Sociology, Economics, Political Science)",
        "Humanities (e.g., History, English, Philosophy, Languages)",
        "Arts (e.g., Fine Arts, Music, Theater)",
        "Business / Management",
        "Prefer not to say"
      ]
    },
    {
      id: "demo_workexp",
      type: "mc",
      prompt: "Years of Work Experience",
      options: [
        "Less than 1 year",
        "1 to 3 years",
        "4 to 6 years",
        "7 to 10 years",
        "More than 10 years",
        "Prefer not to say"
      ]
    },
    {
      id: "demo_income",
      type: "mc",
      prompt: "Household Income: What is your estimated annual household income?",
      options: [
        "Less than $25,000",
        "$25,000 to $49,999",
        "$50,000 to $74,999",
        "$75,000 to $99,999",
        "$100,000 to $149,999",
        "$150,000 or more",
        "Prefer not to say"
      ]
    },
    {
      id: "demo_education",
      type: "mc",
      prompt: "Highest Level of Education Completed",
      options: [
        "Some high school, no diploma",
        "High school diploma or equivalent (e.g., GED)",
        "Some college credit, no degree",
        "Associate degree (e.g., AA, AS)",
        "Bachelor's degree (e.g., BA, BS)",
        "Master's degree (e.g., MA, MS, MEd)",
        "Professional degree (e.g., MD, DDS, DVM, JD)",
        "Doctorate (e.g., PhD, EdD)",
        "Prefer not to say"
      ]
    },
    {
      id: "demo_chemexp",
      type: "mc",
      prompt: "Previous Chemistry Course Experience (Select the highest level completed)",
      options: [
        "No previous formal chemistry courses",
        "High School Chemistry only",
        "Completed one semester/term of College General Chemistry",
        "Completed two semesters/terms (full year) of College General Chemistry",
        "Completed Organic Chemistry or higher level college chemistry courses",
        "Prefer not to say"
      ]
    },
    {
      id: "demo_difficulty",
      type: "mc",
      prompt: "Perception of Chemistry Difficulty: In general, how easy or difficult do you find chemistry to learn?",
      options: [
        "Very Easy",
        "Easy",
        "Neutral / Neither Easy nor Difficult",
        "Difficult",
        "Very Difficult",
        "Prefer not to say"
      ]
    }
  ],
};
