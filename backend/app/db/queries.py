"""
SQL queries for database operations.
All workspace-scoped queries enforce isolation via workspace_id parameter.
"""

# ─── Schema Migration ─────────────────────────────────────────────────────────

MIGRATION_SQL = """
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(owner_id, name)
);

-- 2. Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    file_size_bytes INTEGER,
    mime_type TEXT,
    uploaded_by UUID,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'processing',
    UNIQUE(workspace_id, file_hash)
);

-- 3. Document Chunks (THE single shared vector store)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding vector(768) NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Index for workspace-scoped vector search
CREATE INDEX IF NOT EXISTS idx_chunks_workspace_id ON document_chunks(workspace_id);

-- 4. Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tool Call Log
CREATE TABLE IF NOT EXISTS tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL,
    message_id UUID REFERENCES chat_messages(id),
    tool_name TEXT NOT NULL,
    arguments JSONB NOT NULL,
    result JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error', 'rejected')),
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tasks (for save_task tool)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
    created_by_tool BOOLEAN DEFAULT true,
    session_id UUID REFERENCES chat_sessions(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

# ─── Workspace Queries ────────────────────────────────────────────────────────

CREATE_WORKSPACE = """
INSERT INTO workspaces (name, owner_id)
VALUES ($1, $2)
RETURNING id, name, owner_id, created_at
"""

GET_USER_WORKSPACES = """
SELECT id, name, owner_id, created_at
FROM workspaces
WHERE owner_id = $1
ORDER BY created_at
"""

GET_WORKSPACE = """
SELECT id, name, owner_id, created_at
FROM workspaces
WHERE id = $1 AND owner_id = $2
"""

DELETE_WORKSPACE = """
DELETE FROM workspaces
WHERE id = $1 AND owner_id = $2
RETURNING id
"""

# ─── Document Queries ─────────────────────────────────────────────────────────

INSERT_DOCUMENT = """
INSERT INTO documents (workspace_id, filename, file_hash, file_size_bytes, mime_type, uploaded_by)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (workspace_id, file_hash) DO NOTHING
RETURNING id, workspace_id, filename, file_hash, file_size_bytes, mime_type, uploaded_by, uploaded_at, status
"""

GET_WORKSPACE_DOCUMENTS = """
SELECT id, workspace_id, filename, file_hash, file_size_bytes, mime_type, uploaded_by, uploaded_at, status
FROM documents
WHERE workspace_id = $1
ORDER BY uploaded_at DESC
"""

UPDATE_DOCUMENT_STATUS = """
UPDATE documents SET status = $2 WHERE id = $1
"""

DELETE_DOCUMENT = """
DELETE FROM documents
WHERE id = $1 AND workspace_id = $2
RETURNING id
"""

CHECK_DOCUMENT_HASH = """
SELECT id FROM documents
WHERE workspace_id = $1 AND file_hash = $2
"""

# ─── Chunk Queries ────────────────────────────────────────────────────────────

INSERT_CHUNK = """
INSERT INTO document_chunks (document_id, workspace_id, chunk_index, content, token_count, embedding, metadata)
VALUES ($1, $2, $3, $4, $5, $6::vector, $7)
"""

# CRITICAL: Workspace isolation is enforced HERE, inside the vector query
VECTOR_SEARCH = """
SELECT
    dc.id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    dc.document_id,
    d.filename,
    1 - (dc.embedding <=> $1::vector) AS similarity
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id
WHERE dc.workspace_id = $2
ORDER BY dc.embedding <=> $1::vector
LIMIT $3
"""

# ─── Chat Queries ─────────────────────────────────────────────────────────────

CREATE_CHAT_SESSION = """
INSERT INTO chat_sessions (workspace_id, user_id, title)
VALUES ($1, $2, $3)
RETURNING id, workspace_id, user_id, title, created_at, updated_at
"""

GET_WORKSPACE_SESSIONS = """
SELECT id, workspace_id, user_id, title, created_at, updated_at
FROM chat_sessions
WHERE workspace_id = $1 AND user_id = $2
ORDER BY updated_at DESC
"""

GET_SESSION = """
SELECT id, workspace_id, user_id, title, created_at, updated_at
FROM chat_sessions
WHERE id = $1
"""

UPDATE_SESSION_TITLE = """
UPDATE chat_sessions SET title = $2, updated_at = now() WHERE id = $1
"""

UPDATE_SESSION_TIMESTAMP = """
UPDATE chat_sessions SET updated_at = now() WHERE id = $1
"""

INSERT_MESSAGE = """
INSERT INTO chat_messages (session_id, role, content, citations, metadata)
VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
RETURNING id, session_id, role, content, citations, metadata, created_at
"""

GET_SESSION_MESSAGES = """
SELECT id, session_id, role, content, citations, metadata, created_at
FROM chat_messages
WHERE session_id = $1
ORDER BY created_at ASC
"""

# ─── Tool Call Queries ────────────────────────────────────────────────────────

INSERT_TOOL_CALL = """
INSERT INTO tool_calls (session_id, workspace_id, message_id, tool_name, arguments, result, status, error_message, duration_ms)
VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9)
RETURNING id, tool_name, arguments, result, status, created_at
"""

GET_WORKSPACE_TOOL_CALLS = """
SELECT tc.id, tc.session_id, tc.tool_name, tc.arguments, tc.result, tc.status, tc.error_message, tc.duration_ms, tc.created_at
FROM tool_calls tc
WHERE tc.workspace_id = $1
ORDER BY tc.created_at DESC
LIMIT 50
"""

# ─── Task Queries ─────────────────────────────────────────────────────────────

INSERT_TASK = """
INSERT INTO tasks (workspace_id, title, description, priority, session_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, workspace_id, title, description, priority, status, created_at
"""

GET_WORKSPACE_TASKS = """
SELECT id, workspace_id, title, description, priority, status, created_at
FROM tasks
WHERE workspace_id = $1
ORDER BY created_at DESC
"""

UPDATE_TASK_STATUS = """
UPDATE tasks SET status = $2 WHERE id = $1 AND workspace_id = $3
RETURNING id, title, status
"""

# ─── Dashboard Queries ────────────────────────────────────────────────────────

GET_WORKSPACE_STATS = """
SELECT
    (SELECT COUNT(*) FROM documents WHERE workspace_id = $1) AS doc_count,
    (SELECT COUNT(*) FROM document_chunks WHERE workspace_id = $1) AS chunk_count,
    (SELECT COUNT(*) FROM chat_sessions WHERE workspace_id = $1) AS session_count,
    (SELECT COUNT(*) FROM chat_messages cm JOIN chat_sessions cs ON cm.session_id = cs.id WHERE cs.workspace_id = $1) AS message_count,
    (SELECT COUNT(*) FROM tool_calls WHERE workspace_id = $1) AS tool_call_count,
    (SELECT COUNT(*) FROM tasks WHERE workspace_id = $1) AS task_count
"""
