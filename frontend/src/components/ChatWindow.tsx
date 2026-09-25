'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../lib/context/WorkspaceContext';
import { api } from '../lib/api';
import { ChatMessage, RetrievedChunk } from '../lib/types';
import { Send, Bot, User, Wrench, Shield, CheckCircle2, AlertCircle, FileText, Sparkles, CornerDownLeft } from 'lucide-react';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Reset or load chat session on workspace change
  useEffect(() => {
    if (!activeWorkspace) return;
    api.listChatSessions(activeWorkspace.id).then((sessions) => {
      if (sessions.length > 0) {
        const latest = sessions[0];
        setSessionId(latest.id);
        api.getSessionMessages(activeWorkspace.id, latest.id).then(setMessages);
      } else {
        setSessionId(undefined);
        setMessages([]);
      }
    });
  }, [activeWorkspace?.id]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeWorkspace || sending) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Optimistic user message update
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      session_id: sessionId || '',
      role: 'user',
      content: userText,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await api.sendMessage(activeWorkspace.id, userText, sessionId);
      setSessionId(res.session_id);
      setMessages((prev) => [...prev, res.message]);
      setRetrievedChunks(res.retrieved_chunks || []);
      setActiveToolCalls(res.tool_calls || []);

      if (onRetrievalDebugUpdate) {
        onRetrievalDebugUpdate(res.retrieved_chunks || [], userText);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        session_id: sessionId || '',
        role: 'assistant',
        content: `Sorry, an error occurred: ${err.message || 'Unknown error'}`,
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  // Sample prompt chips for quick testing
  const samplePrompts = [
    "What are the key points in the uploaded documents?",
    "Save a high priority task: Review workspace Q3 goals",
    "Send a summary of the latest updates to Discord",
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Workspace Indicator Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--bg-glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            RAG Assistant — {activeWorkspace ? activeWorkspace.name : 'No workspace'}
          </span>
        </div>
        <div className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
          Enforced Workspace Isolation
        </div>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              margin: 'auto',
              maxWidth: '480px',
              textAlign: 'center',
              padding: '30px 20px',
            }}
          >
            <Bot size={48} style={{ margin: '0 auto 16px', color: 'var(--primary)', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
              Ask anything about documents in {activeWorkspace?.name || 'this workspace'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.5 }}>
              The assistant will answer using only this workspace's uploaded documents with precise source citations.
              It can also run tools like saving tasks or posting to Discord.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', textAlign: 'left' }}>
                Try asking:
              </div>
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputMessage(prompt)}
                  className="glass-card"
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{prompt}</span>
                  <CornerDownLeft size={14} style={{ color: 'var(--text-subtle)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '80%' : '85%',
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={18} />
                </div>
              )}

              <div
                style={{
                  background: isUser ? 'var(--gradient-accent)' : 'rgba(15, 23, 42, 0.75)',
                  border: isUser ? 'none' : '1px solid var(--bg-glass-border)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  color: isUser ? '#ffffff' : 'var(--text-main)',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  boxShadow: isUser ? 'var(--shadow-glow)' : 'none',
                }}
              >
                {msg.content}

                {/* Citations section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={14} /> Citations:
                    </div>
                    {msg.citations.map((cite, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#a5b4fc' }}>
                          [{cite.filename}, Chunk #{cite.chunk_index + 1}]
                        </span>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>- {cite.snippet}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {/* Tool Call Activity Banner */}
        {activeToolCalls.length > 0 && (
          <div className="glass-card" style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={14} /> Tools executed in response:
            </div>
            {activeToolCalls.map((tc, idx) => (
              <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tc.tool_name}</span>: {JSON.stringify(tc.arguments)}
              </div>
            ))}
          </div>
        )}

        {sending && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Bot size={18} />
            </div>
            <div className="glass-card" style={{ padding: '12px 16px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Searching workspace documents & reasoning...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '16px',
          borderTop: '1px solid var(--bg-glass-border)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          gap: '10px',
        }}
      >
        <input
          type="text"
          className="glass-input"
          placeholder={
            activeWorkspace
              ? `Ask about documents in "${activeWorkspace.name}"...`
              : 'Select a workspace first...'
          }
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={!activeWorkspace || sending}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className="gradient-button"
          disabled={!activeWorkspace || sending || !inputMessage.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
