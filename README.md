# SupportAI - Vercel Deployment & Setup Guide

SupportAI is a production-ready customer support platform featuring automated AI chat with grounded reference citations (RAG), ticket lifecycle management, and live analytics. It is powered by Next.js, Express, Supabase, Google Gemini 2.5 Flash, and Clerk.

---

## 1. Supabase Database & Storage Setup

### Database Schema
1. Go to your Supabase project's **SQL Editor**.
2. Copy and paste the contents of `schema.sql` (found in the root directory) and click **Run** to set up tables, relationships, and the `match_document_chunks` vector similarity match RPC function.

### Storage Bucket Setup
1. In Supabase, go to **Storage** and click **New Bucket**.
2. Name the bucket `documents` and make sure it is set to **Public**.
3. Set the maximum file size limit to **10MB**.
4. Set up the following **Row Level Security (RLS)** policies on the `storage.objects` table:
   - **SELECT**: Allow public reads if the bucket ID is `documents`.
   - **INSERT**: Allow authenticated/anonymous uploads to the `documents` bucket.
   - **DELETE**: Allow authenticated users to delete files from the `documents` bucket.

---

## 2. Clerk Authentication Setup

1. Create a project in [Clerk](https://clerk.com).
2. Retrieve your **Publishable Key** and **Secret Key**.
3. During local development, if you do not want to configure live Clerk projects immediately, the system uses a mock bypass wrapper automatically if live Clerk configuration keys are omitted.

---

## 3. Deployed Backend Configuration (Vercel Serverless)

The Express backend in `backend/` is configured to run as a Vercel Serverless Function via `backend/vercel.json`.

### Backend Environment Variables
Configure the following environment variables in your Vercel Project settings:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase API URL.
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase Service Role Key (used for vector searches and database bootstrapping).
- `GEMINI_API_KEY` - Your Google Gemini API Key (used for document chunk embeddings and grounded chat answers).

---

## 4. Deployed Frontend Configuration (Next.js App Router)

The Next.js App Router frontend in `frontend/` compiles with strict typechecking and linting, ready for Vercel deployment.

### Frontend Environment Variables
Configure the following environment variables in your Vercel Project settings:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk Publishable Key.
- `CLERK_SECRET_KEY` - Your Clerk Secret Key.
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase API URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase Anonymous Public Key.
- `NEXT_PUBLIC_API_URL` - The URL of your deployed backend Express server (e.g. `https://your-backend.vercel.app/api`).

---

## 5. Bootstrapping/Seeding the Database

Once both the frontend and backend projects are deployed, you need to populate the database with seed data (companies, users, tickets, and document chunk vector embeddings):
- Send a **POST** request to `https://your-backend.vercel.app/api/bootstrap`.
- The server will connect to your Supabase instance, seed the records, call Google Gemini to generate 768-dimensional embeddings for all knowledge base document chunks, and return a success message.
