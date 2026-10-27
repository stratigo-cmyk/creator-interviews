# ראיונות יוצרים · Creator Interviews

כלי מחקר איכותני לקורס אינטראקטיב א׳, אוניברסיטת חיפה, תשפ״ז. סטודנטים מראיינים יוצרי תוכן סינתטיים לפני שהם מתכננים דשבורד כללי ליוצרי תוכן (דסקטופ, עם התאמה קלה למובייל).

A qualitative research tool for the course Interactive A, University of Haifa. Students interview synthetic content creators before designing a general analytics dashboard for creators.

## חשוב לדעת

- **הכלי החי עובד רק בתוך Claude.** הריאיונות משתמשים ביכולת `sample` של Artifacts ב-Claude, והם רצים על החשבון של כל סטודנט. פתיחת `index.html` מ-GitHub או מהמחשב תציג את הממשק, אבל שאלות לא יקבלו תשובה. לסטודנטים שולחים את קישור ה-Artifact, לא את הריפו.
- **הדמויות סינתטיות.** חמשת היוצרים מבוססים על פרופילי מחקר שנבנו ממידע ציבורי, אבל התשובות בריאיון נוצרות על ידי AI ואינן דברים שהיוצרים אמרו. עינת לוי, מנהלת הערוצים, היא דמות בדיונית לגמרי.

## מבנה

| קובץ | תפקיד |
|---|---|
| `index.html` | הדף הבנוי, כפי שהוא מפורסם |
| `template.html` | מעטפת הדף, CSS, ניתוב, לוגיקת הריאיון וההנחיות לדמות (`rules()`) |
| `tools.js` | מאמן השאלות, דגלי שאלות לא מתאימות, השאלון ומסך ההשוואה |
| `behavior.js` | מנוע ההתנהגות: מצב רוח, אמון, הגנתיות, עומק נעול ושאלות הבהרה |
| `behavior_data.py` | נתוני ההתנהגות לכל דמות: אג'נדה, קול, פערי ידע, סגנון הבהרה |
| `personas.py` | הדמויות: רקע, אופי, יחס לטכנולוגיה, שאלות פתיחה |
| `canon.py` | העמדות הקבועות של כל דמות ב-22 נושאים |
| `export.js` | ייצוא ריאיון ל-Markdown, Word ו-PDF |
| `*_creator_profile_he.md`, `profiles_v2/` | פרופילי המחקר |
| `img/` | שער ותמונות הדמויות |
| `docs/` | ביקורת ריאליזם ותכנון שאלות ההבהרה |
| `tests/` | בדיקות למנוע ההתנהגות |

## בנייה ובדיקה

```bash
python3 build.py          # בונה index.html מכל הקבצים
node tests/bh_test.js     # מריצים מתיקיית השורש
node tests/bh_test2.js
node tests/bh_test3.js
```

אחרי בנייה, מפרסמים את `index.html` מחדש כ-Artifact ב-Claude עם היכולות `sample` ו-`downloads`.
