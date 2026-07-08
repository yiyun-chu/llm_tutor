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
    <p>Please do not refresh or close this tab until you reach the end screen so that your responses are saved.</p>
    <p>The whole session takes about <strong>30-40 minutes</strong>.</p>
  `,

  // -------------------------------------------------------------- PRETEST ---
  // 5 questions. type: "mc" (multiple choice) or "likert" or "text".

  PRETEST: [
    { id: "pre_1", type: "mc", prompt: "Among the elements Ge, Br, Sr, and Sb, which has the largest atomic radius?", options: ["Ge", "Br", "Sr", "Sb"], answer: 2 },
    { id: "pre_2", type: "mc", prompt: "The ions Na+, Mg2+, O2-, and F- are isoelectronic (all have 10 electrons). Order them from smallest to largest radius. Which sequence is correct (smallest -> largest)?", options: ["Mg2+ < Na+ < F- < O2-", "O2- < F- < Na+ < Mg2+", "Na+ < Mg2+ < O2- < F-", "Mg2+ < Na+ < O2- < F-"], answer: 0 },
    { id: "pre_3", type: "mc", prompt: "Copper emits blue light with a wavelength of 480 nm when heated in a flame. What is the frequency of this light? (c = 3.00 x 10^8 m/s)", options: ["4.80 x 10^14 Hz", "6.25 x 10^5 Hz", "6.25 x 10^14 Hz", "6.25 x 10^11 Hz"], answer: 2 },
    { id: "pre_4", type: "mc", prompt: "Light source A directed at a piece of calcium metal ejects no electrons, while light source B ejects electrons. Which statement correctly explains why light source A fails to eject electrons?", options: ["Light source A carries no energy at all.", "The calcium metal has too much energy to absorb light source A.", "Each photon of light source A has a longer wavelength (lower energy) than the metal's threshold, so it cannot eject electrons.", "Light source A has a higher frequency than B but is reflected by the metal surface."], answer: 2 },
    { id: "pre_5", type: "mc", prompt: "What is the maximum number of electrons that a 5f subshell can hold?", options: ["6", "10", "14", "18"], answer: 2 },
  ],

  // ------------------------------------------------------------- POSTTEST ---
  // 10 questions.

  POSTTEST: [
    { id: "post_1", type: "mc", prompt: "The first seven ionization energies (kJ/mol) for a neutral element are: IE1=1012, IE2=1907, IE3=2914, IE4=4964, IE5=6274, IE6=21267, IE7=25431. The large jump occurs after the 5th ionization. Identify the element.", options: ["Aluminum", "Silicon", "Phosphorus", "Sulfur"], answer: 2 },
    { id: "post_2", type: "mc", prompt: "Order the elements Ca, Cl, Ge, and S from lowest to highest first ionization energy. Which sequence is correct (lowest -> highest)?", options: ["Ca < Ge < S < Cl", "Ge < Ca < S < Cl", "Ca < Ge < Cl < S", "Cl < S < Ge < Ca"], answer: 0 },
    { id: "post_3", type: "mc", prompt: "Which of the following second-period elements has the highest first ionization energy?", options: ["Be", "C", "N", "F"], answer: 3 },
    { id: "post_4", type: "mc", prompt: "Which of the following pairs of elements would have the most similar chemical properties?", options: ["Magnesium and aluminum", "Phosphorus and sulfur", "Chlorine and bromine", "Antimony and tin"], answer: 2 },
    { id: "post_5", type: "mc", prompt: "A microwave oven produces electromagnetic waves with a frequency of 2.5 GHz. What is the wavelength of these microwaves? (c = 3.00 x 10^8 m/s)", options: ["0.12 m", "8.33 m", "1.2 m", "1.2 x 10^8 m"], answer: 0 },
    { id: "post_6", type: "mc", prompt: "A high-band 5G cell phone transmission consists of electromagnetic waves with a frequency of 25 GHz. What is the wavelength of this transmission? (c = 3.00 x 10^8 m/s)", options: ["0.012 m", "83.3 m", "0.12 m", "1.2 x 10^7 m"], answer: 0 },
    { id: "post_7", type: "mc", prompt: "Which of the following statements about the Bohr model of the atom is FALSE?", options: ["Bohr proposed that hydrogen's line spectra arise from electrons absorbing and emitting specific quantities of energy.", "When an electron transitions from a higher-energy orbit to a lower-energy orbit, it emits energy.", "The Bohr model accounted for the line spectra of hydrogen but not those of other elements.", "The Bohr model is the currently accepted theory of atomic structure."], answer: 3 },
    { id: "post_8", type: "mc", prompt: "Which of the following sets of quantum numbers (n, l, ml, ms) is NOT possible?", options: ["(5, 2, -2, +1/2)", "(3, 3, 2, +1/2)", "(4, 1, 0, -1/2)", "(7, 4, -3, -1/2)"], answer: 1 },
    { id: "post_9", type: "mc", prompt: "What is the ground-state electron configuration of chromium (Cr, Z = 24)?", options: ["1s^2 2s^2 2p^6 3s^2 3p^6 4s^2 3d^4", "1s^2 2s^2 2p^6 3s^2 3p^6 4s^1 3d^5", "1s^2 2s^2 2p^6 3s^2 3p^6 4s^2 3d^6", "1s^2 2s^2 2p^6 3s^2 3p^6 3d^6"], answer: 1 },
    { id: "post_10", type: "mc", prompt: "Which of the following statements about the rules governing electron configurations is TRUE?", options: ["The 4s subshell is higher in energy than the 3d subshell.", "Within a set of orbitals of equal energy, the lowest-energy configuration has the minimum number of unpaired electrons.", "Electrons fill orbitals of lower energy before filling orbitals of higher energy.", "At most two electrons in an atom can share the same set of all four quantum numbers."], answer: 2 },
  ],

  // -------------------------------------------------------- VIDEO TIMELINE ---
  // Boundaries that drive proactive bot behaviour (conditions 2 & 3).
  // endSec = the moment the bot is allowed to initiate for that section.
  VIDEO_SECTIONS: [
    { id: "s1", title: "Ionization Energy & Periodic Trends", startSec: 0, endSec: 310 },
    { id: "s2", title: "Electromagnetic Radiation & Light", startSec: 322, endSec: 589 },
    { id: "s3", title: "Atomic Spectra & Electron Transitions", startSec: 604, endSec: 827 },
    { id: "s4", title: "Bohr Model vs. Shell Model", startSec: 844, endSec: 934 },
    { id: "s5", title: "Quantum Numbers & Orbitals", startSec: 935, endSec: 1058 },
    { id: "s6", title: "Electron Configuration", startSec: 1059, endSec: 1111 },
  ],

  // What the bot says when it proactively opens at a boundary (conditions 2 & 3).
  // One per section index; {concept} -> section title. Never include answers.
  PROACTIVE_PROMPTS: [
    "We just finished “{concept}”. Want me to recap the key idea, or is anything unclear so far?",
    "That section on “{concept}” can be tricky. Would it help if I walked through the main idea differently?",
    "How are you finding the “{concept}” part? I can give you a worked-through intuition if useful.",
    "“{concept}” trips a lot of people up. Want me to highlight what to watch out for?",
    "We've reached the “{concept}”. Want a quick summary to tie it together before the test?",
  ],

  // First thing the bot says when the study view opens (all conditions).
  // For PASSIVE (condition 1) this is the ONLY unsolicited message.
  GREETING: "Hi! I'm your study assistant. Ask me anything about the video and I'll help you make sense of it.",

  // Survey
  // ------------------------------------------------------------ Survey ---
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
