# gx-pd

AI-powered professional development tracker. Part of the gx.tools suite.

Track competencies, log evidence, receive AI-driven gap analysis and action plans to accelerate promotion readiness.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Neon (Postgres)
- **ORM:** Drizzle ORM
- **Auth:** NextAuth v5 (Auth.js)
- **AI:** Vercel AI SDK v6 + OpenAI
- **Validation:** Zod v4

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | NextAuth secret (generate with `npx auth secret`) |
| `AUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `OPENAI_API_KEY` | OpenAI API key for AI features |

### 3. Database setup

Create a Neon project at [neon.tech](https://neon.tech) and copy the connection string.

Push the schema to your database:

```bash
npm run db:push
```

Or generate and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features (v0.1)

### Onboarding
- Create org + user profile (current level, target level, aspirations, constraints)
- Paste competency framework (markdown table or structured text) - auto-parsed into DB records

### Dashboard
- Focus competencies from latest AI analysis
- This week's action items
- Missing info questions
- Weekly check-in + evidence logging buttons

### Weekly Check-in (AI)
- Analyzes profile, competencies, recent evidence, and current action items
- Generates: focus competencies, 3-5 action items, missing info questions, reasoning
- Action items include: title, description, competency link, due date, expected artifact, priority

### Action Items
- List view with status management (todo/in_progress/done)
- Expandable rows with notes
- Priority and due date tracking

### Evidence Logging
- Submit title, description, optional link
- AI extracts: summary, impact, competency mapping, claimed level, confidence, follow-up questions

### Competencies
- Browse all competencies with levels and indicators
- View linked evidence and action items per competency

## Project Structure

```
src/
  app/
    (app)/              # Authenticated pages with nav
      dashboard/
      action-items/
      evidence/
      competencies/
    onboarding/         # Sign-in + profile setup
    api/
      ai/              # AI endpoints
      action-items/    # CRUD
      evidence/        # CRUD
      competencies/    # Read-only
      auth/            # NextAuth
  lib/
    ai/                # AI integration (Vercel AI SDK v6)
    auth/              # NextAuth config + session helpers
    db/                # Drizzle schema, queries, framework parser
  components/
    ui/                # shadcn/ui components
    app/               # App-specific components (nav)
```

## Database Schema

Tables: `users`, `accounts`, `sessions`, `verification_tokens`, `orgs`, `org_members`, `user_profiles`, `frameworks`, `competencies`, `levels`, `indicators`, `action_items`, `evidence_items`, `evidence_competency_map`, `ai_runs`

## AI Integration

All AI calls use Vercel AI SDK v6 `generateText` with `Output.object()` for structured outputs. Zod schemas enforce output types.

Two main AI functions:
- `runWeeklyCheckin()` - Gap analysis + action plan generation
- `extractEvidence()` - Evidence analysis + competency mapping
