# Lumio — Multi-Agent Personalized Learning Platform

Lumio turns a learning objective into a personalized learning experience and
tracks the learner through game-like roadmaps, quizzes, credits, badges, and
certification.

## Architecture

```text
frontend/  Next.js + React + TypeScript + Vinext
backend/   Express + TypeScript REST API
MySQL 8+   Durable application data and progress history
```

The public landing page remains at `/`. Account creation is available at
`/auth`, and the authenticated dashboard and vertical learning roadmap are
available at `/dashboard`.

Application routes:

- `/courses` — personalized course catalog and credit-based unlocking
- `/learn/:lessonId` — lesson content, focus timer, teach-back lab, and quiz
- `/certificates` — live eligibility progress and certificate generation
- `/achievements` — evidence-based badge gallery

## Quick start

### 1. Create the database

Run these files in order using MySQL 8 or newer:

```sql
SOURCE backend/database/schema.sql;
SOURCE backend/database/seed.sql;
```

### 2. Start the API

```bash
cd backend
cp .env.example .env
# Add your MySQL password and a long JWT secret to .env
pnpm install
pnpm dev
```

The API starts at `http://localhost:4000/api/v1`.

### 3. Start the website

```bash
cd frontend
pnpm install
pnpm dev
```

The website starts at `http://localhost:3000`.

## MySQL tables

| Area | Tables |
|---|---|
| Identity | `users`, `user_profiles`, `refresh_tokens` |
| Personalization | `interests`, `user_interests`, `skills`, `user_skills` |
| Learning content | `courses`, `course_levels`, `lessons`, `quizzes`, `quiz_questions`, `quiz_options` |
| Progress | `course_enrollments`, `user_level_progress`, `user_lesson_progress`, `quiz_attempts` |
| Rewards | `credit_transactions`, `badges`, `user_badges` |
| Outcomes | `certificates` |
| Audit history | `user_activities` |

All progress tables use unique user/content constraints to prevent duplicate
records. Foreign keys maintain referential integrity. Activity, credit, and
quiz history are append-only.

## REST API

All protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Create a learner and profile |
| `POST` | `/api/v1/auth/login` | Sign in and award daily credits safely |
| `POST` | `/api/v1/auth/logout` | Record logout activity |
| `GET` | `/api/v1/auth/me` | Get the signed-in user |
| `PATCH` | `/api/v1/profile` | Update profile and learning interests |
| `GET` | `/api/v1/courses` | List available and unlockable courses |
| `POST` | `/api/v1/courses/:courseId/enroll` | Unlock and enroll in a course |
| `GET` | `/api/v1/roadmap/:courseId` | Get saved roadmap state |
| `GET` | `/api/v1/lessons/:lessonId` | Get a lesson and user progress |
| `POST` | `/api/v1/lessons/:lessonId/start` | Start or resume a lesson |
| `POST` | `/api/v1/lessons/:lessonId/complete` | Complete lesson and update roadmap |
| `POST` | `/api/v1/quizzes/:quizId/attempts` | Save quiz result and rewards |
| `GET` | `/api/v1/credits` | Get balance and immutable history |
| `GET` | `/api/v1/activities` | Get learner activity history |
| `GET` | `/api/v1/certificates` | Get eligibility and issued certificates |
| `POST` | `/api/v1/certificates/:courseId/generate` | Issue eligible certificate |
| `GET` | `/api/v1/recommendations` | Recommend interest-matched courses |
| `GET` | `/api/v1/dashboard` | Get dashboard summary |
| `GET` | `/api/v1/admin/users` | View learners and progress |
| `GET` | `/api/v1/admin/analytics` | View platform analytics |
| `POST` | `/api/v1/admin/courses` | Create course |
| `PUT` | `/api/v1/admin/courses/:id` | Edit course |
| `DELETE` | `/api/v1/admin/courses/:id` | Delete course |
| `POST` | `/api/v1/admin/courses/:courseId/levels` | Add roadmap level |
| `POST` | `/api/v1/admin/credits/adjust` | Apply audited credit adjustment |

## Roadmap progression

1. Enrollment creates an unlocked progress record for level 1.
2. Starting and completing lessons updates `user_lesson_progress`.
3. The API recalculates the containing level inside one MySQL transaction.
4. When every lesson is complete, the level receives three stars and its
   credit reward is recorded.
5. The next level is automatically unlocked.
6. Completing the final level completes the enrollment and awards the
   course-completion bonus.

The unique progress keys make completion requests idempotent. Reloading or
logging in on another device restores the same roadmap state from MySQL.
Locked lessons are also rejected by the API, so a user cannot bypass the
roadmap sequence by calling an endpoint directly.

Roadmap nodes never complete content directly. An active node opens the lesson
player, and completion is available only after the required knowledge check.
The next roadmap level is created as `unlocked` only inside the same transaction
that completes the previous level.

## Learning guide

Lumi is the original AI learning-guide character used across account onboarding,
loading states, personalized tips, and the active roadmap mission. The dashboard
adapts from desktop navigation to a compact mobile layout while preserving clear
locked, active, and completed level states.

Distinctive learning features include:

- **Teach-back Lab:** learners explain the concept in plain language.
- **Focus Timer:** tracks an intentional learning session in the lesson player.
- **PathMatch:** recommendations adapt to interests and completed learning.
- **Mastery DNA:** achievements summarize evidence across lessons, quizzes,
  consistency, and complete courses.

## Credit rules

| Event | Default reward |
|---|---:|
| Daily login | 5 |
| Lesson completion | Set per lesson |
| Passed quiz | 15 |
| Perfect quiz | Set per quiz |
| Level completion | Set per level |
| Full course completion | 100 |

Every change is stored in `credit_transactions` with a unique idempotency key.
The cached balance in `user_profiles` is updated in the same database
transaction, so balance and history cannot drift.

## Certificate eligibility

A learner becomes eligible only after the course enrollment reaches
`completed`, which occurs when every roadmap level is complete. Generation
creates a unique certificate number and stores the company, certificate name,
status, and issue date in MySQL.

## Verification

Both production builds pass:

```bash
cd backend && pnpm build
cd frontend && pnpm build
```
