# Reciprocal Clarification: audit, scenarios, and build plan

Scope: the six personas (Kobi, Dana, Einav, Lauren, Sivan, Einat), the current prompt (`rules()`), the behavior engine (`behavior.js`), and the framework file `reciprocal_clarification_framework.md`.

---

## 1. What the code does today

| Area | Current state | Gap against the framework |
|---|---|---|
| Prompt rule | `rules()` says "ענה ישירות על מה שנשאל" (answer directly what was asked). | This instruction works against clarification. The model is told to answer, not ask. |
| Ambiguity detector | `f.unclear = (length < 10 or words <= 1) and no CUE`. | It only catches very short messages. The framework's own example, "כמה פעמים ביום את מעלה תכנים?", has 6 words and 29 characters, so it is not flagged. Today the character answers it directly. |
| Clarification instruction | One generic line: "השאלה קצרה או לא ברורה: מותר לשאול מה הכוונה". | No ambiguity type, no missing dimension, no persona phrasing. This is the "What do you mean?" pattern the framework tells us to avoid. |
| Context check | Only a repeat check (Jaccard over the last 3 questions). | No check whether an earlier turn already defined "תוכן", the platform, or the metric. Clarification would repeat itself. |
| Multi-part questions | Answers the strongest part, leaves the rest ("השאר לשאלה נפרדת"). | Acceptable. The framework prefers "where do you want to start?" in some cases. Both are fine. |
| Persona expertise | Not modeled. Every persona knows every term the student uses. | Kobi would answer "engagement" as if he knew it. Lauren would answer "אלגוריתם" fluently. |
| Interview state | Trust and defensiveness move on leading, pressure, boundary, and on-topic questions. Vague or clarifying turns do nothing. | A student who clarifies well should gain trust. A student who keeps asking vague questions should lose patience. Neither happens. |

**Bottom line:** the framework's core behavior is missing, and one prompt line actively blocks it. The fix needs three parts: a detector that catches material ambiguity, a prompt rule that allows one specific clarification, and state changes that reward or penalize the exchange.

---

## 2. When to clarify: the materiality test

A clarification is justified only when the missing information would change the answer. Use this order:

1. **Resolved by context?** Check the last 4 student messages and the last 2 creator answers. If the term, platform, or metric was already named, answer. No clarification.
2. **Minor ambiguity?** The likely meaning is obvious. Answer with a light qualification ("אם אתה מתכוון לאינסטגרם, ...").
3. **Moderate ambiguity?** Give a partial answer, then ask one specific follow-up.
4. **Material ambiguity?** Ask one concise question before answering.

### Ambiguity classes to detect

| Class | Trigger (heuristic) | Example | Action |
|---|---|---|---|
| Undefined content | "תוכן", "פוסטים", "מעלה" with no format named | "כמה פעמים ביום את מעלה תכנים?" | Partial answer + "מה נחשב אצלך תוכן? סטוריז, רילס, פוסטים?" |
| Missing metric | "עובד", "הצליח", "הכי טוב", "מצליח" with no metric | "מה הכי עובד לך?" | Partial answer + "עובד באיזה מובן? צפיות, שמירות, תגובות, מכירות?" |
| Missing platform | "עוקבים", "צפיות", "כמה" with no platform named and several platforms in the persona | "כמה עוקבים יש לך?" | Ask platform, or give the main one and ask about the rest |
| Missing scope or time | "כמה מרוויחה", "כמה בחודש", "כמה פעמים" with no object or period | "כמה את מרוויחה?" | Ask: campaign, month, or overall? |
| Reference | "זה", "הם", "אחרי זה", "ומה קרה" with two or more candidates in the last 2 turns | "איך הם הגיבו?" | Ask who "הם" is. Only if two candidates exist. |
| Jargon | "engagement", "reach", "retention", "אלגוריתם", "זהות דיגיטלית", "אותנטי" | "איך את מודדת engagement?" | Ask what the term means, only for personas who would not use it |
| Assumption | "למה הפסקת...", "האלגוריתם הכריח...", "כולם...", "בטח..." | "למה התחלת לעשות יותר תוכן משפחתי?" | Challenge the premise, do not accept it |
| Multi-part | Three or more question marks or clauses | "איך התחלת, למה בחרת בזה, ואיך ידעת שזה מצליח?" | Answer the strongest part, ask where to start |
| Sensitive scope | Money, team, partners (already in SENS) | "כמה כסף את עושה?" | Ask scope or model, do not give figures |

### Do not clarify when

- The question is broad and opening. "איך התחלת ליצור תוכן?" gets an answer.
- The student named the platform, format, or metric in the last 4 messages.
- The student already clarified this term once. Answer.
- The ambiguity is about wording, not meaning. Do not correct grammar.
- It is the first real question of the interview (the opening is for rapport).
- The previous turn was already a clarification. Never ask two in a row.

---

## 3. Persona clarification styles

Each persona asks differently, and knows different words.

| Persona | Knows well | Does not know | How she or he asks back | Pattern |
|---|---|---|---|---|
| **Kobi** | Saves, comments like "הכנתי", recipes, TikTok, Instagram, YouTube | Analytics terms, engagement, reach | Story-first, short, slightly playful: "מה זה בעצם engagement? אני מבשל" | Asks what a word means |
| **Dana** | Analytics, product language, brands, Instagram, TikTok | Her own private numbers | Precise, two options: "מקמפיין בודד או באופן כללי? ומספר מדויק או את המודל?" | Gives a choice of two |
| **Einav** | Business, deals, agents, pricing, Instagram | Her team's internal details | Business-first, scope questions: "בחודש? אני סופרת רק עבודות שחתמתי עליהן. מה אתה מתכוון?" | Asks scope before money |
| **Lauren** | TikTok, personal content, what worked on a clip | Metrics, "אלגוריתם", terms like "קמפיין" | Hesitant, checks her own understanding: "אני לא בטוחה שאני יודעת לענות על 'כמה'. ליום או לשבוע?" | Asks, then doubts her own answer |
| **Sivan** | Live shows on Facebook, Hebrew and English, family and home stream | Dry dashboards, percentages | Fast, mixes languages: "רגע, תוכן? כולל לייב? כי הלייב זה כבר משהו אחר" | Asks which format counts |
| **Einat** | Metrics, reporting, scheduling, many accounts | Creator-side feelings | Asks the client or period first: "על איזה לקוח? זה מאוד משתנה" | Asks which account or period |

**Rule:** clarifying phrases must differ by persona. If two personas use the same sentence, one of them is wrong.

---

## 4. Scenarios per persona

Format: student question, the ambiguity, the mode (answer, partial plus one follow-up, or clarify only), a draft reply, a likely student answer, and the continuation.

### Kobi (food creator)

**K1. "כמה פעמים ביום את מעלה תכנים?"**
- Ambiguity: undefined content.
- Mode: partial plus follow-up.
- Reply: "אין לי מספר קבוע. לפעמים מתכון אחד ביום, לפעמים שבוע בלי כלום. מה אתה מחשיב תוכן?"
- Student: "הכול, גם סטוריז."
- Continuation: "אז סטוריז כמעט כל יום, תמונה מהמטבח כשיש משהו מוכן. רילס פחות, כי הם לוקחים זמן לצילום."

**K2. "מה הכי עובד לך?"**
- Ambiguity: missing metric.
- Mode: answer with his default, then one follow-up.
- Reply: "שמירות קודם. אם אתה מתכוון למה שעושה הכי הרבה רעש, זה משהו אחר. איזה מהם?"
- Student: "שמירות."
- Continuation: "אז זה מה שאני מסתכל עליו. שמירה אומרת שמישהו מתכנן לבשל."

**K3. "איך את מודד engagement?"**
- Ambiguity: jargon Kobi would not use.
- Mode: clarify only (material and persona-specific).
- Reply: "engagement? את המילה הזו אני לא באמת משתמש בה. אתה מתכוון לשמירות, תגובות, או משהו אחר?"
- Do not clarify: "איזה פלטפורמה הכי קשה לך?" is clear. Answer it.

### Dana (product-minded creator with brands)

**D1. "כמה את מרוויחה מקמפיין?"**
- Ambiguity: sensitive, missing scope (single campaign or overall).
- Mode: clarify only.
- Reply: "מקמפיין אחד או באופן כללי? ואתה מחפש מספר, או להבין איך זה עובד?"
- Student: "להבין איך זה עובד."
- Continuation: "בגדול, זה תלוי בסוג השותפות: פוסט, שגרירות או קולקציה משותפת. מספרים לא אפרט."

**D2. "איך את יודעת מה נמכר מהקולקציה?"**
- Ambiguity: reference. "הקולקציה" could be her brand or a brand she works with.
- Mode: clarify only, because the answer differs (her own sales data versus brand reports).
- Reply: "מהקולקציה שלי, או של מותג שעובד איתי? אלה שני דברים שונים לגמרי."

**D3. "מה אתם בודקים בנתונים?"**
- Ambiguity: "אתם" could mean her team or creators in general.
- Mode: partial plus one follow-up.
- Reply: "אני והצוות שלי בודקים שמירות, שיתופים וזמן צפייה. אתה מתכוון לצוות שלי או ליוצרים בכלל?"

### Einav (business-first creator)

**E1. "כמה שיתופי פעולה יש לך בחודש?"**
- Ambiguity: scope and time. Her deals are private.
- Mode: partial plus one follow-up.
- Reply: "זה משתנה מחודש לחודש. אני סופרת רק עבודות שחתמתי עליהן. אתה שואל על התקופה האחרונה או בכלל?"

**E2. "מה הקשר שלך עם המותג?"**
- Ambiguity: vague evaluative. Her answer depends on which brand.
- Mode: clarify only, short.
- Reply: "עם איזה מותג? יש כאלה שאני עובדת איתם שנים ויש כאלה שזה פרויקט אחד."

### Lauren (solo, unsure creator)

**L1. "כמה תוכן את מעלה?"**
- Ambiguity: undefined content.
- Mode: clarify, hesitant.
- Reply: "אני לא בטוחה שאני סופרת. מה נחשב אצלך תוכן? רילס, סטוריז, או גם פוסטים?"
- Student: "רילס."
- Continuation: "רילס בערך פעם בשבוע, לפעמים פעמיים. לא יותר מזה, כי אני צריכה לחשוב על כל אחד."

**L2. "למה התחלת לעשות יותר תוכן משפחתי?"**
- Ambiguity: assumption.
- Mode: challenge the premise.
- Reply: "אני לא בטוחה שזה מה שקרה. יש משהו מסוים שראית?"
- Student: "בפרופיל שלך זה נראה ככה."
- Continuation: "אה. אולי זה פשוט מה שעבד לאחרונה, לא החלטה מסודרת. מה ראית?"

**L3. "איך את מודדת הצלחה?"**
- Ambiguity: missing metric and abstract. Lauren does not measure in a formal way.
- Mode: partial plus follow-up, hesitant.
- Reply: "אני לא בטוחה שאני מודדת. אם אתה מתכוון למה שעובד, אני מסתכלת על מה שאנשים שומרים. אתה מתכוון לזה?"

### Sivan (live-show creator, Hebrew and English)

**S1. "כמה פעמים את מעלה?"**
- Ambiguity: undefined content and format (live versus clips).
- Mode: partial plus follow-up.
- Reply: "לייב כמעט כל יום, והסרטונים זה משהו אחר. אתה מתכוון ללייב או לכל מה שאני מעלה?"

**S2. "מי מטפל בתגובות?"**
- Ambiguity: reference. "מי" could mean her, her husband, or a team.
- Mode: clarify only, because the answer is different for each.
- Reply: "מי זה? אני, או מי שעוזר לי? כי בלייב זה כבר משפחה."

### Einat (channel manager, many clients)

**N1. "כמה פעמים ביום את מעלה תכנים?"**
- Ambiguity: undefined content plus missing account (which client).
- Mode: clarify only.
- Reply: "על איזה לקוח? זה מאוד משתנה. ואתה מתכוון לתוכן מתוזמן או למה שעלה בפועל?"

**N2. "איך את מדווחת?"**
- Ambiguity: missing recipient and period.
- Mode: partial plus follow-up.
- Reply: "זה תלוי למי. ליוצר, למותג, או לשניהם? ולאיזו תקופה?"

---

## 5. Cross-cutting classes

| Student question | Why it is interesting | Mode |
|---|---|---|
| "ומה קרה אחרי זה?" after two events | Reference with two candidates | Clarify: "אחרי שהקמפיין עלה, או אחרי שהמותג ביקש שינוי?" |
| "ספרי לי על הקריירה שלך." | Broad opening | Answer. Do not clarify. |
| "אמרת שרילס עובדים יותר טוב. כמה את מעלה ביום?" | Context already resolves the format | Answer about Reels. Do not clarify again. |
| "את מכירה את זה?" when the student means a trend | Reference to a topic the persona has not heard of | Ask what it is. Lauren and Kobi do this. |
| "האם זה נכון ש...?" | Leading question | Already handled by the leading flag |
| "תגיד לי הכול" | Too broad | Answer one thing, then offer to go on |

---

## 6. Changes required

### 6.1 Prompt (`rules()` in `template.html`)

Replace the line "ענה ישירות על מה שנשאל, ותן דוגמה..." with:

> "אם השאלה חסרה מידע שמשנה את התשובה (איזה תוכן, איזה מדד, איזה לקוח, איזו תקופה), ענה על החלק הברור ושאל שאלה אחת ספציפית על החלק החסר, בלשון שלך. אם המידע לא משנה את התשובה, ענה ישירות. אל תשאל 'למה אתה מתכוון' בלי לציין מה לא ברור."

Add: "אל תשאל שתי שאלות הבהרה ברצף. אל תשאל על מה שכבר נאמר בשיחה."

### 6.2 Behavior engine (`behavior.js`)

1. **Replace the `unclear` flag** with a classifier that returns `{type, material}` for each class in section 2.
2. **Context check:** keep the last 4 student messages and the last 2 creator answers. If the term is present, mark the ambiguity resolved.
3. **Mode selection** in `note()`:
   - Resolved: no note.
   - Minor: "ענה ישירות, אפשר להוסיף הסתייגות קלה."
   - Moderate: "ענה על החלק הברור, ושאל שאלה אחת על החלק החסר."
   - Material: "שאל שאלה אחת לפני התשובה, ספציפית לסוג הבלבול."
4. **Cap:** no clarification on turn 1 of the interview, none on two consecutive turns, and not more than one in every three turns.
5. **State:**
   - A clarifying answer by the student (short, or directly answers the last question) raises trust by 1.
   - Repeated vague questions of the same class lower patience by 1.
   - Do not change openness on clarification. Openness stays as it is.

### 6.3 Persona data (`behavior_data.py`)

Add to each persona:
- `clarify_style`: one sentence describing how she or he asks back (from section 3).
- `knows`: a short list of terms she or he uses without clarifying.
- `not_knows`: a short list of terms that trigger a meaning check.

Kobi: `not_knows` includes engagement, reach, retention. Lauren: `not_knows` includes אלגוריתם, קמפיין. Einat: `knows` includes all metrics.

### 6.4 Tests

- Add classifier tests to `bh_test2.js`: 12 cases from section 4 plus 3 no-clarify cases.
- Add a browser test that a clarification message does not appear on turn 1.
- Live test (the only real check): run K1, D2, L1, N1 on the real AI. Check that the model asks one question, does not ask two, and does not repeat.

---

## 7. Risks

1. **Over-clarification.** This is the first anti-pattern in the framework. The materiality test is a heuristic, so false positives will happen. Start with three strong classes only (undefined content, missing metric, missing scope on money). Add the rest after the live test.
2. **The model may ignore the note.** A note at the end of the prompt is weaker than a rule. Check on the live model before adding more.
3. **Cost.** Each clarification takes a turn from the interview budget. Keep the cap in 6.2.4.
4. **Persona drift.** If every persona asks in the same style, the framework's persona rule fails. The `clarify_style` field is the control.

---

## 8. Build order

1. Prompt rule (6.1). Smallest change, biggest effect, and it removes the conflict.
2. Classifier for three classes: undefined content, missing metric, sensitive scope. Tests.
3. Persona fields (6.3) for Kobi, Lauren, Dana, Einat first.
4. Live test with four scenarios (K1, D2, L1, N1).
5. State changes (6.2.5) and the remaining classes.
