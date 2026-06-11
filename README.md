# Mindframe

> AI-powered mood journaling with Gemini API · Built in 1 week

A full-stack emotional wellness platform that uses Google's Gemini API to analyse journal entries, classify mood, and generate personalised AI reflections. Features weekly, monthly, and all-time mood trend tracking.

---

## What It Does

Most journaling apps are passive — you write, nothing responds. Mindframe changes that.

When you write a journal entry, Gemini API reads it, identifies your emotional state, and generates a personalised reflection in 3–5 seconds. Over time, your mood history builds into visual trend data so you can see patterns in your emotional wellbeing.

---

## Features

- **AI mood analysis** — Gemini API classifies emotional tone from free-text journal entries
- **Personalised reflections** — AI-generated responses tailored to each entry's content
- **Mood trend dashboard** — weekly, monthly, and all-time visualisations
- **Persistent history** — all entries and mood data stored via Supabase
- **Responsive design** — consistent experience across devices

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| AI Integration | Gemini API (Google) |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| Build Tool | Bolt AI |

---

## How the AI Pipeline Works

```
User writes journal entry
        ↓
Entry sent to Gemini API with mood classification prompt
        ↓
Gemini returns: mood label + personalised reflection (3–5 sec)
        ↓
Mood label stored in Supabase with timestamp
        ↓
Dashboard aggregates mood history → weekly / monthly / all-time trends
```

---

## Screens

<img width="1843" height="748" alt="Screenshot 2026-06-10 231034" src="https://github.com/user-attachments/assets/29d247a2-cbc3-4144-806e-0e7192753145" />
<img width="1912" height="796" alt="Screenshot 2026-06-10 231319" src="https://github.com/user-attachments/assets/7e5949d7-d3aa-4b53-9f21-3997f153f448" />
<img width="945" height="667" alt="Screenshot 2026-06-10 231356" src="https://github.com/user-attachments/assets/de3643d7-ad27-4d40-81b0-0dc865fe00c7" />


---

## What I Learned

- Prompt engineering significantly affects the quality and tone of Gemini's responses — small changes in the system prompt change the entire feel of the reflection
- Supabase's row-level security makes it easy to keep each user's journal data private without complex backend logic
- Building with Bolt AI for speed means you spend 90% of your time on product decisions, not boilerplate

---

## Status

Actively being developed. Next planned features:
- Export mood history as PDF report
- Streak tracking for journaling consistency
- Mood-based music/activity suggestions

---

## Run Locally

```bash
git clone https://github.com/Architha1713/mindframe
cd mindframe
npm install
# Add your Gemini API key and Supabase credentials to .env
npm run dev
```

---

## Author

**Architha B C** · AI/ML Student · The Oxford College of Engineering, Bengaluru

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/architha-b-c)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/Architha1713)
