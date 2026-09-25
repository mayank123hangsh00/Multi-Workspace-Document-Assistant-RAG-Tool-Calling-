<div align="center">

<h1>
  <br/>
  🧠 Abstrat
  <br/>
  <sub>Multi-Workspace Document Assistant · RAG & Tool Calling</sub>
</h1>

<p>
  <a href="https://github.com/mayank123hangsh00/Multi-Workspace-Document-Assistant-RAG-Tool-Calling-/actions">
    <img src="https://img.shields.io/badge/E2E_Tests-8%2F8_Passed-brightgreen?style=flat-square&logo=github-actions" alt="E2E Tests">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" alt="FastAPI">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/pgvector-768--dim-blue?style=flat-square&logo=postgresql" alt="pgvector">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Groq-LLM-orange?style=flat-square" alt="Groq">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/Gemini-Embeddings-4285F4?style=flat-square&logo=google" alt="Gemini">
  </a>
  <a href="#">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License">
  </a>
</p>

<p>
  <b>Abstrat</b> is a production-grade, multi-tenant AI document assistant that answers questions strictly grounded in workspace documents, calls autonomous tools, and enforces zero-leakage tenant isolation — all within a single shared vector store.
</p>

<p>
  <a href="#-quick-start"><strong>Quick Start</strong></a> ·
  <a href="#-architecture"><strong>Architecture</strong></a> ·
  <a href="#-features"><strong>Features</strong></a> ·
  <a href="#-api-reference"><strong>API Reference</strong></a> ·
  <a href="#-deployment"><strong>Deploy</strong></a>
</p>

---

</div>

## 📸 Overview

Abstrat lets teams create isolated **workspaces**, upload documents (PDF, TXT, DOCX, MD), and chat with an AI assistant that:

- **Only answers from documents in the active workspace** — never leaks data from other workspaces.
- **Cites its sources** — every answer links back to the exact document chunk it used.
- **Calls tools autonomously** — saves tasks to a database, sends summaries to Discord.
- **Shows its work** — a real-time Retrieval Inspector panel exposes every retrieved chunk, cosine similarity score, and tenant scope proof.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏢 **Multi-Tenant Isolation** | Single pgvector store with `WHERE workspace_id = $1` enforced **inside** the vector similarity query. Zero post-filter leakage risk. |
| 📄 **Document Ingestion** | Parses PDF, TXT, MD, DOCX. Recursive overlap chunking with SHA-256 idempotency — re-uploading the same file is a no-op. |
| 🤖 **Grounded RAG + Citations** | Every answer is anchored to retrieved document chunks. Honest `"I don't have enough information"` when the corpus is empty. |
| 🔧 **Autonomous Tool Calling** | Multi-step function calling loop: `save_task` persists to DB; `send_summary_to_discord` posts to webhook. |
| 🛡️ **Prompt Injection Defense** | Document text wrapped in `<documents>` tags and declared as non-executable data in system prompt. |
| 🔍 **Retrieval Inspector** | Live debug panel: retrieved chunks, similarity scores, workspace scope verification per query. |
| 📊 **Audit Dashboard** | Full audit log for tool calls and task lifecycle — all queryable per workspace. |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│                    Next.js 16 · App Router · TypeScript             │
│           Glassmorphic UI · Workspace Switcher · Chat · Debug       │
└────────────────────────────┬────────────────────────────────────────┘
                             │  REST API (JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                             │
│                                                                     │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────────┐ │
│  │  Ingestion  │   │  RAG Engine  │   │    Tool Calling Loop     │ │
│  │  Pipeline   │   │              │   │                          │ │
│  │ ─────────── │   │  Vector      │   │  save_task  →  Postgres  │ │
│  │  PDF/DOCX   │   │  Retrieval   │   │  discord    →  Webhook   │ │
│  │  Chunking   │   │  +Citations  │   │                          │ │
│  │  SHA-256    │   │  +Isolation  │   │  Schema validated args   │ │
│  │  Idempotent │   │  Check       │   │  Server-injected IDs     │ │
│  └──────┬──────┘   └──────┬───────┘   └──────────────────────────┘ │
│         │                 │                                          │
│         └────────┬────────┘                                         │
│                  │                                                   │
│  ┌───────────────▼────────────────────────────────────────────────┐ │
│  │              Embedding & LLM Clients                           │ │
│  │   Google Gemini (models/gemini-embedding-001 · 768-dim)        │ │
│  │   Groq Chat Completions  (openai/gpt-oss-120b)                 │ │
│  └───────────────────────────────────────────────────────────────-┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  asyncpg (pooler)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Supabase Postgres + pgvector                     │
│                                                                     │
│   workspaces │ documents │ document_chunks (vector 768)            │
│   chat_sessions │ chat_messages │ tool_calls │ tasks               │
│                                                                     │
│   Vector Search:  ORDER BY embedding <=> $1                        │
│   Isolation:      WHERE document_chunks.workspace_id = $2  ◄──────┤│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
abstrat/
├── backend/                        # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py                 # App entry, lifespan, CORS, migrations
│   │   ├── config.py               # Settings (Pydantic BaseSettings)
│   │   ├── dependencies.py         # Supabase JWT auth middleware
│   │   ├── db/
│   │   │   ├── client.py           # Asyncpg pool (pooler-compatible)
│   │   │   └── queries.py          # SQL migrations & VECTOR_SEARCH query
│   │   ├── routers/
│   │   │   ├── workspaces.py       # CRUD: workspaces
│   │   │   ├── documents.py        # POST /upload → ingest pipeline
│   │   │   ├── chat.py             # POST /chat → RAG + tool loop
│   │   │   └── dashboard.py        # GET /dashboard → stats
│   │   ├── services/
│   │   │   ├── ingestion.py        # Parse → chunk → embed → store
│   │   │   ├── embeddings.py       # Gemini embed API wrapper
│   │   │   ├── retrieval.py        # Scoped vector retrieval
│   │   │   ├── llm.py              # Groq chat + tool calling loop
│   │   │   └── tools/
│   │   │       ├── registry.py     # Tool registration + dispatch
│   │   │       ├── save_task.py    # Persists task to DB
│   │   │       └── send_discord.py # Posts embed to Discord webhook
│   │   └── models/                 # Pydantic request/response schemas
│   ├── .env.example
│   ├── Dockerfile
│   ├── render.yaml
│   └── requirements.txt
│
├── frontend/                       # Next.js 16 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── chat/           # RAG Chat with inline citations
│   │   │   │   ├── documents/      # Upload + document list
│   │   │   │   ├── tasks/          # Task management board
│   │   │   │   ├── tool-calls/     # Audit log viewer
│   │   │   │   └── debug/          # Retrieval inspector panel
│   │   │   └── globals.css         # Glassmorphic design system
│   │   ├── components/             # Sidebar, ChatWindow, WorkspaceSwitcher...
│   │   └── lib/
│   │       ├── api.ts              # Backend API client
│   │       ├── supabase.ts         # Supabase Auth client
│   │       ├── types.ts            # Shared TypeScript types
│   │       └── context/            # AuthContext, WorkspaceContext
│   └── vercel.json
│
├── test_e2e.py                     # Automated E2E verification (8 tests)
├── AI_NOTES.md                     # Architecture decisions & design notes
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Where to Get |
|---|---|---|
| Python | 3.12+ | [python.org](https://python.org) |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Supabase Project | Free tier | [supabase.com](https://supabase.com) |
| Groq API Key | Free tier | [console.groq.com](https://console.groq.com) |
| Google AI Studio Key | Free tier | [aistudio.google.com](https://aistudio.google.com) |

---

### 1. Clone the Repository

```bash
git clone https://github.com/mayank123hangsh00/Multi-Workspace-Document-Assistant-RAG-Tool-Calling-.git
cd Multi-Workspace-Document-Assistant-RAG-Tool-Calling-
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section below)

# Start the server
uvicorn app.main:app --reload --port 8000
```

> The backend runs at **`http://localhost:8000`**  
> Interactive Swagger UI available at **`http://localhost:8000/docs`**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

> The frontend runs at **`http://localhost:3000`**

---

## 🔐 Environment Variables

### Backend — `backend/.env`

```env
# Supabase (required)
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Postgres via Transaction Pooler (recommended for serverless/Render)
DATABASE_URL=postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres

# LLM & Embeddings (required)
GROQ_API_KEY=<your-groq-api-key>
GOOGLE_API_KEY=<your-google-ai-studio-key>

# Optional
DISCORD_WEBHOOK_URL=<your-discord-webhook-url>
FRONTEND_URL=http://localhost:3000
SECRET_KEY=change-me-to-a-random-secret
```

> **⚠️ Security Note**: Never commit your `.env` file. It is excluded by `.gitignore`. Only commit `.env.example`.

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 Running Tests

The automated E2E suite validates all 8 system requirements end-to-end with real API calls:

```bash
# From the project root (with backend running)
python test_e2e.py
```

**Expected output:**
```
==========================================================
[+] E2E AUTOMATED VERIFICATION FOR ABSTRAT ASSISTANT
==========================================================
[1] Health Check Endpoint ................................. [PASSED]
[2] Supabase Auth .......................................... [PASSED]
[3] Multi-Workspace Creation ............................... [PASSED]
[4] Document Ingestion & Vector Embeddings ................. [PASSED]
[5] Strict Tenant Isolation (Zero Cross-Leakage) ........... [PASSED]
[6] Grounded RAG Chat with Citations ....................... [PASSED]
[7] Autonomous Tool Calling (save_task) .................... [PASSED]
[8] Dashboard Stats & Audit Logging ........................ [PASSED]
==========================================================
[SUCCESS] ALL 8 E2E VERIFICATION TESTS PASSED SUCCESSFULLY!
==========================================================
```

---

## 🔬 How Tenant Isolation Works

The critical security property of Abstrat is that **workspace data never leaks**, even in a shared vector store. This is enforced at the database query level, not post-fetch in Python.

**Standard (Insecure) Approach:**
```sql
-- ❌ Fetches global top-10. If Workspace A has 10 highly similar
-- chunks to a Workspace B query, Workspace B gets no results,
-- and Workspace A's data could appear in results.
SELECT * FROM document_chunks
ORDER BY embedding <=> $1
LIMIT 10;
-- Then filter by workspace_id in Python — TOO LATE.
```

**Abstrat's Approach:**
```sql
-- ✅ Workspace scope is enforced INSIDE the vector index scan.
-- The similarity search only considers chunks belonging to
-- the active workspace. Zero cross-tenant data ever surfaces.
SELECT dc.content, dc.chunk_index, dc.metadata,
       d.filename, d.id as document_id,
       1 - (dc.embedding <=> $1::vector) AS similarity
FROM   document_chunks dc
JOIN   documents d ON dc.document_id = d.id
WHERE  dc.workspace_id = $2          -- ← tenant gate enforced here
ORDER  BY dc.embedding <=> $1
LIMIT  $3;
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + DB connectivity + tool registry |
| `POST` | `/api/workspaces` | Create a new workspace |
| `GET` | `/api/workspaces` | List all workspaces for the authenticated user |
| `POST` | `/api/workspaces/{id}/documents` | Upload & ingest a document |
| `GET` | `/api/workspaces/{id}/documents` | List documents in a workspace |
| `POST` | `/api/workspaces/{id}/chat` | Send a message (RAG + tool calling) |
| `GET` | `/api/workspaces/{id}/tasks` | List saved tasks |
| `GET` | `/api/workspaces/{id}/tool-calls` | List tool call audit log entries |
| `GET` | `/api/workspaces/{id}/dashboard` | Workspace stats & recent activity |

Full interactive API docs available at `http://localhost:8000/docs` (Swagger UI).

---

## ☁️ Deployment

### Backend → Render

1. Push this repo to GitHub.
2. Go to [Render](https://render.com) → **New Web Service** → connect your repository.
3. Set **Root Directory** to `backend`.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables from `backend/.env`.

> A `render.yaml` is provided in `backend/` for one-click Blueprint deployments.

### Frontend → Vercel

1. Go to [Vercel](https://vercel.com) → **New Project** → import your repository.
2. Set **Root Directory** to `frontend`.
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` → Your Render backend URL
4. Click **Deploy**.

---

## 🧠 Design Decisions

See [`AI_NOTES.md`](./AI_NOTES.md) for a full breakdown of:

- Why **single-store multi-tenant** was chosen over per-workspace tables.
- Why `workspace_id` is **server-injected** during tool execution (prevents prompt injection attacks from hijacking cross-workspace writes).
- The **Prompt Injection Defense** strategy using `<documents>` data tags.
- The hardest bug fixed: **Unbound Vector Search Post-Filtering Leakage**.

---

## 🛣️ Roadmap

- [ ] **Hybrid Search**: BM25 keyword search fused with dense vector retrieval via Reciprocal Rank Fusion (RRF).
- [ ] **Streaming Responses**: Server-Sent Events (SSE) for token-by-token streaming to the frontend.
- [ ] **Role-Based Access**: Admin / Member / Viewer roles per workspace.
- [ ] **Cross-Workspace Reference Documents**: Opt-in global knowledge base shared across all workspaces.
- [ ] **Re-ranking**: Cohere or BGE cross-encoder re-ranking for improved retrieval precision.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

Built with ❤️ using FastAPI · Next.js · Supabase · Groq · Google Gemini

</div>
