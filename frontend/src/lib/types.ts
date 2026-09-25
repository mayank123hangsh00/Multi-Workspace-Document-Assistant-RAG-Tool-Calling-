export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  doc_count?: number;
}

export interface Document {
  id: string;
  workspace_id: string;
  filename: string;
  file_hash: string;
  file_size_bytes?: number;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_at: string;
  status: 'processing' | 'ready' | 'error';
}

export interface Citation {
  document_id: string;
  chunk_id: string;
  filename: string;
  snippet: string;
  similarity: number;
  chunk_index: number;
}

export interface RetrievedChunk {
  chunk_id: string;
  document_id: string;
  filename: string;
  content: string;
  similarity: number;
  chunk_index: number;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  citations: Citation[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  workspace_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface ToolCall {
  id: string;
  session_id: string;
  tool_name: string;
  arguments: Record<string, any>;
  result?: Record<string, any>;
  status: 'pending' | 'success' | 'error' | 'rejected';
  error_message?: string;
  duration_ms?: number;
  created_at: string;
}

export interface TaskItem {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'done';
  created_at: string;
}

export interface DashboardStats {
  doc_count: number;
  chunk_count: number;
  session_count: number;
  message_count: number;
  tool_call_count: number;
  task_count: number;
  recent_documents: any[];
  recent_tool_calls: any[];
  recent_tasks: any[];
}
