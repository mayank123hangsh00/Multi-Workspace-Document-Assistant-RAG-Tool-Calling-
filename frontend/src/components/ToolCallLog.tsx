'use client';

import React from 'react';
import { ToolCall } from '../lib/types';
import { Wrench, CheckCircle2, AlertCircle, Clock, Send, PlusCircle } from 'lucide-react';

interface ToolCallLogProps {
  toolCalls: ToolCall[];
  loading?: boolean;
}

export const ToolCallLog: React.FC<ToolCallLogProps> = ({ toolCalls, loading }) => {
  if (loading) {
    return <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>Loading tool call log...</div>;
  }

  if (toolCalls.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Wrench size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ fontWeight: 500 }}>No tool calls executed in this workspace yet.</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
          Try asking the assistant: "Save a high priority task..." or "Send a summary to Discord".
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {toolCalls.map((tc) => {
        const timeFormatted = new Date(tc.created_at).toLocaleString();
        const isSaveTask = tc.tool_name === 'save_task';

        return (
          <div key={tc.id} className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isSaveTask ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                    color: isSaveTask ? 'var(--primary)' : 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSaveTask ? <PlusCircle size={18} /> : <Send size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tc.tool_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{timeFormatted}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {tc.duration_ms && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                    {tc.duration_ms}ms
                  </span>
                )}

                {tc.status === 'success' && (
                  <span className="badge badge-success" style={{ gap: '4px' }}>
                    <CheckCircle2 size={12} /> Success
                  </span>
                )}
                {tc.status === 'error' && (
                  <span className="badge badge-danger" style={{ gap: '4px' }}>
                    <AlertCircle size={12} /> Error
                  </span>
                )}
                {tc.status === 'pending' && (
                  <span className="badge badge-warning" style={{ gap: '4px' }}>
                    <Clock size={12} /> Running
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Arguments
                </div>
                <pre style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(tc.arguments, null, 2)}
                </pre>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Execution Result
                </div>
                <pre style={{ fontSize: '0.78rem', color: tc.status === 'error' ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap' }}>
                  {tc.result ? JSON.stringify(tc.result, null, 2) : tc.error_message || 'N/A'}
                </pre>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
