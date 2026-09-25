'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../../lib/context/WorkspaceContext';
import { api } from '../../../lib/api';
import { Document } from '../../../lib/types';
import { DocumentUploader } from '../../../components/DocumentUploader';
import { DocumentList } from '../../../components/DocumentList';

export default function DocumentsPage() {
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!activeWorkspace) { setDocuments([]); setLoading(false); return; }
    try {
      setLoading(true);
      const docs = await api.listDocuments(activeWorkspace.id);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!activeWorkspace) return;
    if (confirm('Delete this document and all its indexed chunks?')) {
      try { await api.deleteDocument(activeWorkspace.id, id); fetchDocuments(); }
      catch (err: any) { alert(err.message || 'Failed to delete document'); }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="page-header animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.1))',
                border: '1px solid rgba(6,182,212,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h1 className="page-title">Documents</h1>
            </div>
            <p className="page-subtitle">
              Corpus for <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>"{activeWorkspace?.name || 'No workspace selected'}"</span> · {documents.length} document{documents.length !== 1 ? 's' : ''} indexed
            </p>
          </div>
          <div className="chip chip-info">
            {documents.reduce((sum, d) => sum + (d.chunk_count ?? 0), 0)} chunks in pgvector
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="page-body" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
            <DocumentUploader onUploadSuccess={fetchDocuments} />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Indexed Corpus
              </div>
              {!loading && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {documents.filter(d => d.status === 'ready').length} ready · {documents.filter(d => d.status === 'error').length} failed
                </span>
              )}
            </div>
            <DocumentList documents={documents} onDelete={handleDelete} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
