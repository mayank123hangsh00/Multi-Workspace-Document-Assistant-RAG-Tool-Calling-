'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../lib/context/WorkspaceContext';
import { api } from '../lib/api';
import { ChatMessage, RetrievedChunk } from '../lib/types';

interface ChatWindowProps {
  onRetrievalDebugUpdate?: (chunks: RetrievedChunk[], query: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onRetrievalDebugUpdate }) => {
  const { activeWorkspace } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [retrievedChunks, setRetrievedChunks] = useState<RetrievedChunk[]>([]);
  const [activeToolCalls, setActiveToolCalls] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, sending]);

  useEffect(() => {
    if (!activeWorkspace) return;
    setMessages([]);
    setSessionId(undefined);
    api.listChatSessions(activeWorkspace.id).then((sessions) => {
      if (sessions.length > 0) {
        const latest = sessions[0];
        setSessionId(latest.id);
        api.getSessionMessages(activeWorkspace.id, latest.id).then(setMessages);
      }
    });
  }, [activeWorkspace?.id]);

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const text = (overrideText || inputMessage).trim();
    if (!text || !activeWorkspace || sending) return;

    setInputMessage('');
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      session_id: sessionId || '',
      role: 'user',
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);
    setActiveToolCalls([]);

    try {
      const res = await api.sendMessage(activeWorkspace.id, text, sessionId);
      setSessionId(res.session_id);
      setMessages((prev) => [...prev, res.message]);
      setRetrievedChunks(res.retrieved_chunks || []);
      setActiveToolCalls(res.tool_calls || []);
      if (onRetrievalDebugUpdate) {
        onRetrievalDebugUpdate(res.retrieved_chunks || [], text);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        session_id: sessionId || '',
        role: 'assistant',
        content: `Error: ${err.message || 'Unknown error. Is the backend running?'}`,
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const samplePrompts = [
    'What are the key points in the uploaded documents?',
    'Save a high priority task: Review workspace Q3 goals',
    'Send a summary of the latest updates to Discord',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(99,102,241,0.4)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              RAG Assistant
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              {activeWorkspace ? activeWorkspace.name : 'Select a workspace to begin'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeWorkspace && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--emerald-400)', fontWeight: 600 }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--emerald-400)', boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
              Isolated
            </div>
          )}
          <div className="chip chip-brand" style={{ fontSize: '0.65rem' }}>Workspace Scoped</div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ margin: 'auto', maxWidth: '460px', textAlign: 'center', padding: '20px 0' }} className="animate-fade-up">
            {/* Icon */}
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-400)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.01em' }}>
              Ask anything about <span className="text-gradient">{activeWorkspace?.name || 'this workspace'}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Answers are strictly grounded in this workspace's documents with inline source citations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                Try asking
              </div>
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(undefined, prompt)}
                  className="prompt-chip"
                  disabled={!activeWorkspace || sending}
                >
                  <span>{prompt}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-disabled)' }}>
                    <polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{ animationDelay: `${i * 30}ms` }}
              className={`animate-fade-up ${isUser ? 'message-user' : 'message-assistant'}`}
            >
              {!isUser && (
                <div className="message-avatar avatar-bot">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
              )}
              <div>
                <div className={isUser ? 'message-bubble-user' : 'message-bubble-assistant'}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                  {/* Citations */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="citation-block">
                      <div className="citation-label">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Sources · {msg.citations.length}
                      </div>
                      {msg.citations.map((cite, idx) => (
                        <div key={idx} className="citation-item">
                          <div className="citation-filename">
                            {cite.filename} · Chunk #{(cite.chunk_index ?? 0) + 1}
                            {cite.similarity && (
                              <span style={{ marginLeft: '8px', fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                                {(cite.similarity * 100).toFixed(0)}% match
                              </span>
                            )}
                          </div>
                          {cite.snippet && <div className="citation-snippet">{cite.snippet}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tool calls badge */}
                {!isUser && activeToolCalls.length > 0 && i === messages.length - 1 && (
                  <div className="tool-banner" style={{ marginTop: '8px' }}>
                    <div className="tool-banner-label">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      Tools Executed
                    </div>
                    {activeToolCalls.map((tc, idx) => (
                      <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--emerald-400)' }}>{tc.tool_name}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}> · {tc.result?.status || 'executed'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isUser && (
                <div className="message-avatar avatar-user">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking indicator */}
        {sending && (
          <div className="message-assistant animate-fade-in">
            <div className="message-avatar avatar-bot">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="message-bubble-assistant" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-disabled)', marginTop: '6px', fontWeight: 500 }}>
                Searching documents &amp; reasoning...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', flex: 1, alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={activeWorkspace ? `Ask about "${activeWorkspace.name}" documents...` : 'Select a workspace to start chatting...'}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={!activeWorkspace || sending}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!activeWorkspace || sending || !inputMessage.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
