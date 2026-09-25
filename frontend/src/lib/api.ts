import { supabase } from './supabase';
import {
  Workspace,
  Document,
  ChatMessage,
  ChatSession,
  ToolCall,
  TaskItem,
  DashboardStats,
  RetrievedChunk,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader();
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network response error' }));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Workspaces
  async listWorkspaces(): Promise<Workspace[]> {
    const data = await request<{ workspaces: Workspace[] }>('/api/workspaces');
    return data.workspaces;
  },

  async createWorkspace(name: string): Promise<Workspace> {
    return request<Workspace>('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async deleteWorkspace(id: string): Promise<void> {
    return request<void>(`/api/workspaces/${id}`, { method: 'DELETE' });
  },

  // Documents
  async listDocuments(workspaceId: string): Promise<Document[]> {
    const data = await request<{ documents: Document[] }>(`/api/workspaces/${workspaceId}/documents`);
    return data.documents;
  },

  async uploadDocument(workspaceId: string, file: File): Promise<{ document?: Document; message: string; already_exists: boolean }> {
    const authHeaders = await getAuthHeader();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/documents`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload error' }));
      throw new Error(errorData.detail || 'Upload failed');
    }

    return response.json();
  },

  async deleteDocument(workspaceId: string, documentId: string): Promise<void> {
    return request<void>(`/api/workspaces/${workspaceId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  // Chat
  async sendMessage(
    workspaceId: string,
    message: string,
    sessionId?: string
  ): Promise<{
    message: ChatMessage;
    session_id: string;
    retrieved_chunks: RetrievedChunk[];
    tool_calls: any[];
  }> {
    return request(`/api/workspaces/${workspaceId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    });
  },

  async listChatSessions(workspaceId: string): Promise<ChatSession[]> {
    const data = await request<{ sessions: ChatSession[] }>(`/api/workspaces/${workspaceId}/chat/sessions`);
    return data.sessions;
  },

  async getSessionMessages(workspaceId: string, sessionId: string): Promise<ChatMessage[]> {
    const data = await request<{ messages: ChatMessage[] }>(
      `/api/workspaces/${workspaceId}/chat/sessions/${sessionId}/messages`
    );
    return data.messages;
  },

  // Dashboard & Tools
  async getDashboard(workspaceId: string): Promise<DashboardStats> {
    return request<DashboardStats>(`/api/workspaces/${workspaceId}/dashboard`);
  },

  async listToolCalls(workspaceId: string): Promise<ToolCall[]> {
    const data = await request<{ tool_calls: ToolCall[] }>(`/api/workspaces/${workspaceId}/tool-calls`);
    return data.tool_calls;
  },

  async listTasks(workspaceId: string): Promise<TaskItem[]> {
    const data = await request<{ tasks: TaskItem[] }>(`/api/workspaces/${workspaceId}/tasks`);
    return data.tasks;
  },
};
