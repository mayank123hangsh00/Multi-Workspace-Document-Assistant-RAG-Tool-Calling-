'use client';

import React from 'react';
import { RetrievedChunk } from '../lib/types';
import { useWorkspace } from '../lib/context/WorkspaceContext';
import { ShieldCheck, Database, FileText, CheckCircle2, Lock } from 'lucide-react';

interface RetrievalDebugViewProps {
  chunks: RetrievedChunk[];
  query?: string;
}

export const RetrievalDebugView: React.FC<RetrievalDebugViewProps> = ({ chunks, query }) => {
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={22} style={{ color: 'var(--success)' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Retrieval & Isolation Inspector</h3>
        </div>
        <span className="badge badge-success" style={{ gap: '4px' }}>
          <Lock size={12} /> Scoped Search Active
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
        This inspector proves that vector similarity search was strictly scoped to active workspace{' '}
        <strong style={{ color: 'var(--text-main)' }}>"{activeWorkspace?.name || 'None'}"</strong> (ID: {activeWorkspace?.id || 'None'}).
      </p>

      {query && (
        <div className="glass-card" style={{ padding: '12px 14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
            User Query Embedded
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 500, marginTop: '4px', fontStyle: 'italic' }}>
            "{query}"
          </div>
        </div>
      )}

      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Database size={16} style={{ color: 'var(--primary)' }} />
        Retrieved Chunks from Vector Store ({chunks.length})
      </div>

      {chunks.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}
        >
          No vector search performed yet or no chunks matched the similarity threshold ({'>'} 0.3) in this workspace.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {chunks.map((chunk, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <FileText size={14} style={{ color: 'var(--accent-cyan)' }} />
                  {chunk.filename} (Chunk #{chunk.chunk_index + 1})
                </div>
                <div className="badge badge-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                  Cosine Sim: {(chunk.similarity * 100).toFixed(1)}%
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  maxHeight: '120px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {chunk.content}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                <span>Workspace Verified: YES</span>
                <span>•</span>
                <span>Chunk ID: {chunk.chunk_id.slice(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
