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

---