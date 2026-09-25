'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../../lib/context/WorkspaceContext';
import { api } from '../../../lib/api';
import { Document } from '../../../lib/types';
import { DocumentUploader } from '../../../components/DocumentUploader';
import { DocumentList } from '../../../components/DocumentList';
import { FileText, Database } from 'lucide-react';

export default function DocumentsPage() {
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!activeWorkspace) {
      setDocuments([]);
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    if (!activeWorkspace) return;
    if (confirm('Delete this document and all its indexed chunks?')) {
      try {
        await api.deleteDocument(activeWorkspace.id, id);
        fetchDocuments();
      } catch (err: any) {
        alert(err.message || 'Failed to delete document');
      }
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText style={{ color: 'var(--primary)' }} /> Document Management
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
          Upload documents into active workspace <strong style={{ color: 'var(--text-main)' }}>"{activeWorkspace?.name || 'None'}"</strong>.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <DocumentUploader onUploadSuccess={fetchDocuments} />

        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} style={{ color: 'var(--accent-cyan)' }} /> Workspace Corpus ({documents.length})
          </h3>
          <DocumentList documents={documents} onDelete={handleDelete} loading={loading} />
        </div>
      </div>
    </div>
  );
}
