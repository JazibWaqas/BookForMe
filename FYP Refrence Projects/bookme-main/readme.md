# BookMe

## Quick Overview

BookMe is my little project – an AI-powered movie ticket booking system built with Node.js and a dash of LangChain magic. Imagine ditching the usual click-fest on a website: instead of manually hunting for shows, checking seats, and locking them down, you just chat with an intelligent agent. Tell it something like "Book two seats for _Samshayam_ on the 25th," and boom – it handles the rest, from querying availability to confirming your booking.

It's like having a personal cinema concierge in your code. Perfect for folks tinkering with AI agents, or anyone who hates form-filling as much as I do. Under the hood, it's a full-stack setup with a MySQL/PostgreSQL backend (via Sequelize), Express for the API, and LangChain for the smarts. Oh, and it's dockerized for easy spins.

Check out the flow diagram above: on the left, the old-school manual grind (5 tedious steps). On the right? One prompt to the agent, and you're done. Life's too short for bad UX!

## Features

- **AI Agent Booking**: Natural language queries via LangChain (powered by Ollama or OpenAI). The agent reasons step-by-step: checks movies/shows, seat availability, locks 'em, and books.
- **Manual Booking Flow**: Traditional API endpoints if you wanna go old-school (or integrate with a frontend).
- **Database-Driven**: Robust models for Users, Movies, Theaters, Screens, Seats, Shows, and Bookings – all tied together with foreign keys for that sweet relational vibe.
- **Auth & Security**: JWT tokens for protected routes, bcrypt for password hashing.
- **Scalable Setup**: Redis for caching and Docker for one-command deploys.
- **Tracing Ready**: LangSmith integration for debugging agent runs (env vars make it plug-and-play).

## Tech Stack

- **Backend**: Node.js, Express.js, Sequelize (ORM)
- **AI/ML**: LangChain.js, @langchain/ollama (local models), @langchain/openai, langsmith (monitoring).
- **Database**: MySQL2 or PostgreSQL (flexible via Sequelize)
- **Auth**: JWT, bcryptjs
- **Utils**: Moment.js for dates, Yup/Zod for validation, Multer for file uploads
- **Dev Tools**: Nodemon, Docker Compose, Sucrase (for TS-like syntax in JS)

## Project Setup

```bash
# 1. Clone the repo
git clone git@github.com:shaad82663/bookme.git
cd bookme

# 2. Start database + Redis with Docker
npm run docker
# This runs: docker compose up -d (MySQL + Redis)

# 3. Install dependencies
npm install

# 4. Copy env example and fill your keys (especially LLM + LangSmith)
cp .env.example .env
# Edit .env → add your OpenAI key or Ollama settings + LangSmith if you want tracing

# 5. Start the server (hot reload)
npm run dev
```

# Register a test user (or use your existing auth flow)

```
curl --location 'http://localhost:3001/query' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjoxLCJpYXQiOjE3NjM4NzQ2OTksImV4cCI6MTc2Mzg4NjY5OSwianRpIjoiMSJ9.T_b4C5l9purKDKm0zJlinvknR1bGuMywqp7Eq7xy6sI' \
--data '{
    "prompt": "Is there any show for Samshayam movie on 25th November?"
}'
```
