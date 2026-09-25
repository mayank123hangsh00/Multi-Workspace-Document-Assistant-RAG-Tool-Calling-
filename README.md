# Abstrat — Multi-Workspace Document Assistant (RAG & Tool Calling)

A production-grade, multi-tenant AI assistant web application that answers questions grounded strictly in documents uploaded to the active workspace, calls autonomous tools (`save_task`, `send_summary_to_discord`), and enforces strict tenant isolation within a single shared vector store.

---

## 🌟 Key Features

1. **Strict Multi-Tenant Isolation**: Single shared pgvector store with workspace filtering enforced inside the vector query (`WHERE workspace_id = $1`). Zero cross-tenant leakage.
2. **Grounded RAG with Citations**: Answers cite exact document names and chunk indices. Honest *"I don't have enough information"* when the corpus doesn't contain the answer.
3. **Autonomous Tool Calling**: Supports multi-step function calling (`save_task` to database, `send_summary_to_discord` to Discord webhooks).
4. **Idempotent Ingestion Pipeline**: SHA-256 content deduplication prevents redundant chunking. Parses PDF, TXT, MD, and DOCX files.
5. **Prompt Injection Defense**: Treats document text strictly as data, preventing embedded instructions from hijacking the assistant.
6. **Retrieval & Isolation Inspector**: Real-time debug panel displaying retrieved chunks, cosine similarity scores, and workspace verification proof.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Python 3.12, FastAPI, Asyncpg, Pydantic v2
- **Frontend**: Next.js 16 (App Router), TypeScript, Vanilla CSS Glassmorphism
- **Database / Vector Store**: Supabase Postgres + `pgvector` extension (768-dim embeddings)
- **LLM Engine**: Groq (`llama-3.3-70b-versatile`) for Chat & Function Calling
- **Embeddings**: Google Gemini (`text-embedding-004`) via AI Studio
- **Notifications**: Discord Webhooks

---

## 🚀 Running Locally

### 1. Prerequisites
- Python 3.12+
- Node.js 20+
- Free Supabase Project (Postgres + pgvector enabled)
- Free Groq API Key
- Free Google Gemini API Key (AI Studio)

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your keys:
# SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL, GROQ_API_KEY, GOOGLE_API_KEY

# Run server
uvicorn app.main:app --reload --port 8000
```
Backend will run at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# Run development server
npm run dev
```
Frontend will run at `http://localhost:3000`.

---

## 🌍 Environment Variables Guide

### Backend `.env`
```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATABASE_URL=postgresql://postgres:<password>@db.<your-project>.supabase.co:5432/postgres
GROQ_API_KEY=<your-groq-api-key>
GOOGLE_API_KEY=<your-gemini-api-key>
DISCORD_WEBHOOK_URL=<optional-discord-webhook-url>
FRONTEND_URL=http://localhost:3000
SECRET_KEY=super-secret-key-change-me
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 Testing Workspace Isolation (Step-by-Step)

To verify strict multi-tenant vector store isolation:

1. Click **"Quick Demo Login"** on the landing page.
2. Click **Workspace Switcher** in the sidebar → **"Create Workspace"** → Name it `Project Alpha`.
3. Go to **Documents** → Upload a text file containing:
   > *"Project Alpha secret codename is PHOENIX-99."*
4. Click **Workspace Switcher** → **"Create Workspace"** → Name it `Project Beta`.
5. Go to **Documents** → Upload a text file containing:
   > *"Project Beta target release date is October 15."*
6. In **Project Beta**, open **RAG Assistant** and ask:
   > *"What is the secret codename?"*
   - ✅ **Expected Result**: Assistant answers: *"I don't have enough information in this workspace's documents..."*
   - Check **Retrieval Inspector** on the right side: 0 chunks from `Project Alpha` were fetched.
7. Switch back to **Project Alpha** and ask the same question:
   - ✅ **Expected Result**: Assistant answers: *"The secret codename is PHOENIX-99. [Source: document.txt, Chunk #1]"*

---

## 🔧 Testing Tool Execution

1. In any workspace chat, type:
   > *"Save a high priority task to review security audit logs by tomorrow."*
   - ✅ Model calls `save_task(title="...", priority="high")`
   - View created task in **Workspace Tasks** tab!
2. Type:
   > *"Send a summary of our progress to Discord."*
   - ✅ Model calls `send_summary_to_discord(message="...")`
   - Audit the call in **Tool Call Logs** tab!

---

## ☁️ Deployment Instructions

### Backend (Render / Docker)
1. Push repo to GitHub.
2. Connect repository to [Render](https://render.com).
3. Select **Web Service** → Use environment `Python 3` or Docker.
4. Set Build Command: `pip install -r requirements.txt`
5. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from `render.yaml`.

### Frontend (Vercel)
1. Connect repository to [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`.
4. Deploy!
