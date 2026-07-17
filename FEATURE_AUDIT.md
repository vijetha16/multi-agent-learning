# Lumio feature audit

Status legend: **Ready**, **Partial**, **Planned**

## AI

| Capability | Status | Evidence / next work |
|---|---|---|
| Quizzes from lesson content | Partial | Quizzes and lesson-linked questions are live; generation is currently seeded, not model-generated. |
| Chatbot with history | Ready | Tutor answers, visual explanations, follow-ups, and stored conversation activity exist. |
| Wrong-answer explanation | Ready | Every submitted quiz reveals the explanation for each question. |
| Study plans | Planned | Requires a study-plan table, scheduling engine, and learner UI. |
| Flashcards | Planned | Requires persisted decks and spaced-repetition scheduling. |

## Student experience

| Capability | Status |
|---|---|
| Daily streak | Ready |
| Lesson bookmarks | Planned |
| Lesson notes | Partial — lesson content notes exist; personal notes do not |
| Course reviews | Planned |
| Discussions/comments | Planned |
| Certificate PDF download | Planned |
| Resume from completed courses | Planned |

## Admin

| Capability | Status |
|---|---|
| Analytics endpoints | Ready |
| User listing | Ready |
| Course create/update/delete | Ready |
| Ban/delete users | Ready |
| Admin dashboard UI/charts | Planned |
| Video/PDF upload | Planned — URL fields exist, object storage does not |

## Gamification and dashboard

| Capability | Status |
|---|---|
| Credits/rewards | Ready |
| XP rewards | Partial — level XP exists, lifetime XP profile does not |
| Leaderboard | Partial — learner rank is live; full board UI is planned |
| Achievements | Ready |
| Daily reminders | Ready |
| Weekly challenges | Planned |
| Daily missions | Planned |
| Avatar customization | Partial — profile image URL is supported |
| Completion percentage | Ready |
| Time spent | Ready in database |
| Weekly statistics / heatmap / goals | Planned |

## Security and quality

| Capability | Status |
|---|---|
| Input validation | Ready — Zod validation across APIs |
| Security headers | Ready — Helmet |
| Email verification / reset / 2FA / CAPTCHA | Planned |
| Mobile responsiveness | Ready |
| Loading states / animations / empty states | Ready |
| Toasts / dark mode | Planned |
| Pagination / lazy loading / API caching | Partial |
| Image optimization | Partial |
| API docs | Ready at `/api/v1/docs` |
| Docker | Ready |
| GitHub Actions | Ready |
| Unit/integration tests | Partial — baseline API tests ready; coverage must grow |
| Logging | Ready — request IDs and structured logs |
| Error monitoring | Partial — structured errors are ready for a hosted provider |

This file is kept in the repository so future work can be verified instead of being represented as complete before it is production-ready.
