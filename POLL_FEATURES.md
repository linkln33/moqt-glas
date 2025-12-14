# Poll Features - Multiple Questions Support

## Overview

The Моят Глас app fully supports polls with **multiple questions** per election. Each election can have one or more questions, and each question can have multiple options.

---

## Features

### ✅ Multiple Questions Per Election

- **Unlimited questions** - Add as many questions as needed
- **Question ordering** - Questions are displayed in order (using `order_index`)
- **Mixed question types** - Mix single-choice and multiple-choice questions
- **Individual voting** - Each question is voted on separately

### ✅ Progress Tracking

- **Progress bar** - Visual indicator showing completion (X of Y questions)
- **Percentage display** - Shows % of questions answered
- **Question status** - Each question shows if it's answered or not
- **Visual highlighting** - Unanswered questions are highlighted

### ✅ Question Types

1. **Single Choice** (`single-choice`)
   - User selects exactly one option
   - Radio button style interface
   - Example: "Who should be president?"

2. **Multiple Choice** (`multiple-choice`)
   - User can select multiple options
   - Checkbox style interface
   - Example: "Which topics interest you?" (select all that apply)

3. **Ranked Choice** (`ranked-choice`) - *Future feature*
   - Users rank options in order
   - More complex voting method

### ✅ User Experience

- **Question numbering** - "Въпрос 1:", "Въпрос 2:", etc.
- **Answer status badges** - Green "✓ Отговорено" badge for answered questions
- **Visual feedback** - Unanswered questions have yellow border
- **Summary view** - Review all answers before submission
- **Validation** - Must answer all questions before submitting

### ✅ Mobile-Optimized

- **Touch-friendly** - Large tap targets (44x44px minimum)
- **Scrollable** - All questions visible, scroll to navigate
- **Responsive** - Works on all screen sizes
- **Progress visible** - Always see how many questions remain

---

## Database Structure

### Elections Table
```sql
elections
  - id (UUID)
  - title_bg (Bulgarian title)
  - description_bg
  - start_date, end_date
  - status
```

### Questions Table
```sql
questions
  - id (UUID)
  - election_id (FK)
  - question_text_bg (Bulgarian question)
  - question_type ('single-choice', 'multiple-choice', 'ranked-choice')
  - order_index (for ordering)
```

### Options Table
```sql
options
  - id (UUID)
  - question_id (FK)
  - option_text_bg (Bulgarian option text)
  - order_index (for ordering)
```

### Votes Table
```sql
votes
  - id (UUID)
  - election_id (FK)
  - telegram_id (FK)
  - question_id (FK)
  - selected_options (JSONB array of option IDs)
  - UNIQUE(election_id, telegram_id, question_id)
```

---

## Example: Creating a Poll with Multiple Questions

### SQL Example

```sql
-- 1. Create election
INSERT INTO elections (title, title_bg, description, description_bg, status, start_date, end_date)
VALUES (
  'Student Council Election',
  'Избори за студентски съвет',
  'Vote for student council members',
  'Гласувайте за членове на студентския съвет',
  'active',
  NOW(),
  NOW() + INTERVAL '7 days'
) RETURNING id;

-- 2. Create Question 1: President
INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
VALUES (
  'election-id',
  'Who should be President?',
  'Кой трябва да бъде президент?',
  'single-choice',
  0
) RETURNING id;

-- 3. Add options for Question 1
INSERT INTO options (question_id, option_text, option_text_bg, order_index)
VALUES
  ('question-1-id', 'Candidate A', 'Кандидат А', 0),
  ('question-1-id', 'Candidate B', 'Кандидат Б', 1),
  ('question-1-id', 'Candidate C', 'Кандидат В', 2);

-- 4. Create Question 2: Vice President
INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
VALUES (
  'election-id',
  'Who should be Vice President?',
  'Кой трябва да бъде вицепрезидент?',
  'single-choice',
  1
) RETURNING id;

-- 5. Add options for Question 2
INSERT INTO options (question_id, option_text, option_text_bg, order_index)
VALUES
  ('question-2-id', 'Candidate X', 'Кандидат X', 0),
  ('question-2-id', 'Candidate Y', 'Кандидат Y', 1);

-- 6. Create Question 3: Topics (multiple choice)
INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
VALUES (
  'election-id',
  'Which topics should we focus on?',
  'Кои теми трябва да фокусираме?',
  'multiple-choice',
  2
) RETURNING id;

-- 7. Add options for Question 3
INSERT INTO options (question_id, option_text, option_text_bg, order_index)
VALUES
  ('question-3-id', 'Education', 'Образование', 0),
  ('question-3-id', 'Sports', 'Спорт', 1),
  ('question-3-id', 'Events', 'Събития', 2),
  ('question-3-id', 'Welfare', 'Социални грижи', 3);
```

---

## Voting Flow

1. **User views election** - Sees all questions
2. **Answers questions** - One by one or all at once
3. **Progress tracking** - Sees how many questions answered
4. **Review summary** - Can review all answers before submitting
5. **Submit votes** - All questions submitted together
6. **View results** - See results for all questions

---

## UI Features

### Progress Indicator
```
Прогрес: 2 от 3 въпроса
[████████████░░░░░░░░] 67%
```

### Question Display
```
┌─────────────────────────────────────┐
│ Въпрос 1: Кой трябва да бъде...    │ ✓ Отговорено
│ Изберете една опция                 │
│                                     │
│ ○ Кандидат А                        │
│ ● Кандидат Б  ← Selected            │
│ ○ Кандидат В                        │
└─────────────────────────────────────┘
```

### Summary View
```
┌─────────────────────────────────────┐
│ Преглед на вашите отговори         │
│                                     │
│ 1. Кой трябва да бъде президент?   │
│    • Кандидат Б                     │
│                                     │
│ 2. Кой трябва да бъде вице...      │
│    • Кандидат X                     │
│                                     │
│ 3. Кои теми трябва да фокусираме? │
│    • Образование                    │
│    • Спорт                          │
└─────────────────────────────────────┘
```

---

## Results Display

Results are shown per question:

```
Въпрос 1: Кой трябва да бъде президент?
Общо гласове: 150

Кандидат А:  45 гласа (30.0%)
[████████████░░░░░░░░░░░░░░░░]

Кандидат Б:  75 гласа (50.0%)
[████████████████████░░░░░░░░]

Кандидат В:  30 гласа (20.0%)
[████████░░░░░░░░░░░░░░░░░░░░]
```

---

## Validation

- ✅ All questions must be answered before submission
- ✅ Single-choice: Only one option allowed
- ✅ Multiple-choice: At least one option required
- ✅ Error messages point to unanswered questions
- ✅ Auto-scroll to first unanswered question

---

## Mobile Optimization

- **Large touch targets** - Easy to tap on mobile
- **Scrollable interface** - All questions accessible
- **Progress always visible** - Know how many questions left
- **Summary view** - Easy to review on small screens
- **Responsive layout** - Adapts to screen size

---

## Best Practices

1. **Question Ordering**
   - Use `order_index` to control display order
   - Start with 0, increment by 1

2. **Question Types**
   - Use single-choice for "who should win" questions
   - Use multiple-choice for "select all that apply" questions

3. **Option Ordering**
   - Use `order_index` for options too
   - Alphabetical or logical order

4. **Question Count**
   - Recommended: 3-10 questions per poll
   - Too many questions can reduce completion rate

5. **Question Length**
   - Keep questions concise
   - Clear and unambiguous

---

## Future Enhancements

- [ ] Ranked choice voting
- [ ] Conditional questions (show Q2 only if Q1 = X)
- [ ] Question categories/sections
- [ ] Save progress (draft votes)
- [ ] Question descriptions/help text
- [ ] Image options (candidate photos)

---

## Summary

✅ **Full support for polls with multiple questions**
✅ **Progress tracking and visual feedback**
✅ **Mobile-optimized interface**
✅ **Review before submission**
✅ **Results per question**
✅ **Bulgarian language throughout**

The app is ready to handle complex polls with various questions!
