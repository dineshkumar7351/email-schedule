# ReachInbox Email Scheduler

A production-grade full-stack Email Job Scheduler Dashboard, built without Docker.

## Architecture

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, React Hook Form
- **Backend**: Node.js, Express, Prisma ORM, BullMQ, Redis, Elasticsearch, Nodemailer (Ethereal SMTP), Passport.js (Google OAuth, Slack OAuth)

## Features

- **Google OAuth Login**: Real Google OAuth authentication with session management.
- **Slack Integration**: Connect Slack to receive rate-limit notifications.
- **Email Scheduling**: Upload a CSV or TXT file of emails, write a subject/body, and schedule them.
- **Delayed & Concurrent Execution**: Uses BullMQ delayed jobs with configurable delay and concurrency.
- **Hourly Rate Limiting**: Distributed, Redis-backed rate limiter. Jobs are rescheduled to the next hour if limits are hit.
- **Idempotency**: Prevents double-sending. Safe against worker crashes.
- **Persistence**: Survives backend restarts. BullMQ state is preserved in Redis, and configuration is preserved in PostgreSQL.
- **Elasticsearch Indexing**: Scheduled and sent emails are indexed and searchable.
- **Queue Dashboard**: Integrated Bull Board to monitor waiting, delayed, active, and completed jobs.

## Prerequisites (Local Installation without Docker)

1. **PostgreSQL**: Install PostgreSQL locally (default port `5432`). Create a database `email_scheduler`.
2. **Redis**: Install Redis locally (default port `6379`) and start the redis-server.
3. **Elasticsearch**: Install Elasticsearch locally (default port `9200`) and start it.

## Backend Setup

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your details:
   - `DATABASE_URL=postgresql://postgres:password@localhost:5432/email_scheduler`
   - Real Google OAuth credentials (add `http://localhost:5000/auth/google/callback` to authorized redirect URIs)
   - Real Slack OAuth credentials
4. `npx prisma generate`
5. `npx prisma db push` (or `npx prisma migrate dev`)
6. `npm run dev`

This will start the API server and the BullMQ worker concurrently.
The Bull Board dashboard will be available at `http://localhost:5000/admin/queues`.

## Frontend Setup

1. `cd frontend`
2. `npm install`
3. Copy `.env.example` to `.env` (it points to `http://localhost:5000`)
4. `npm run dev`
5. Open `http://localhost:5173`

## Demo Flow

1. Go to `http://localhost:5173` and click "Continue with Google".
2. You'll be redirected to the Dashboard.
3. (Optional) Click "Connect Slack" in the sidebar to authorize Slack notifications.
4. Use a REST client or Postgres directly to insert a dummy `Sender` in the database, with Ethereal SMTP credentials, since a UI for creating senders is skipped for brevity (though the API endpoint `POST /api/senders` exists).
5. Click "Compose New Email", upload a `.txt` file containing emails, and configure the rate limits.
6. Click "Schedule Emails".
7. Verify jobs appear in Bull Board and then transition to SENT.
8. Stop the backend, verify Redis keeps the jobs, and start the backend again to see jobs resume.
