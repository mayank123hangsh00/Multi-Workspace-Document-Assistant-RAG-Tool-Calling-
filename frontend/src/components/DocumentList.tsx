'use client';

import React from 'react';
import { Document } from '../lib/types';
import { FileText, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: string) => void;
  loading?: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete, loading }) => {
  if (loading) {
    return <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ fontWeight: 500 }}>No documents uploaded in this workspace yet.</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
          Upload documents above to enable grounded RAG search.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {documents.map((doc) => {
        const sizeFormatted = doc.file_size_bytes
          ? (doc.file_size_bytes / 1024).toFixed(1) + ' KB'
          : 'N/A';
        const dateFormatted = new Date(doc.uploaded_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={doc.id}
            className="glass-card"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <FileText size={20} />
              </div>

              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {doc.filename}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                  <span>{sizeFormatted}</span>
                  <span>•</span>
                  <span>Uploaded {dateFormatted}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {doc.status === 'ready' && (
                <span className="badge badge-success" style={{ gap: '4px' }}>
                  <CheckCircle2 size={12} /> Indexed
                </span>
              )}
              {doc.status === 'processing' && (
                <span className="badge badge-warning" style={{ gap: '4px' }}>
                  <Clock size={12} /> Chunking
                </span>
              )}
              {doc.status === 'error' && (
                <span className="badge badge-danger" style={{ gap: '4px' }}>
                  <AlertTriangle size={12} /> Failed
                </span>
              )}

              <button
                onClick={() => onDelete(doc.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-subtle)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  transition: 'color 0.2s',
                }}
                title="Delete document"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
