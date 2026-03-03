# EstatePerks SquareYards-Style Web App (Next.js)

This folder contains a full web implementation using Next.js App Router with built-in backend APIs.

## Features

- SquareYards-style home page (hero search, city collections, featured projects)
- Listings page with city/type/BHK/budget filters
- Property detail page with inquiry form
- Backend APIs in Next.js:
  - `GET /api/properties`
  - `GET /api/properties/[id]`
  - `POST /api/leads`
  - `POST /api/newsletter`
  - `POST /api/ai-assistant`
  - `GET /api/health`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

4. Open: `http://localhost:3000`

## MongoDB (Required for Persistence)

Set in `.env.local`:

- `MONGODB_URI` (your MongoDB Atlas connection string)
- `MONGODB_DB` (default: `estateperks`)

You can also keep these in the parent project file `../.env` (your main `estateperks/.env`).

Collections used:

- `leads` (property inquiry form submissions)
- `newslettersubscribers` (newsletter emails)

## AI + Newsletter

Optional environment variables:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- `GEMINI_API_BASE` (default: `https://generativelanguage.googleapis.com/v1beta`)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `OPENAI_API_BASE` (default: `https://api.openai.com/v1`)
- `RESEND_API_KEY`
- `NEWSLETTER_FROM_EMAIL`
- `NEWSLETTER_FROM_NAME`
- `NEWSLETTER_SUBJECT`
