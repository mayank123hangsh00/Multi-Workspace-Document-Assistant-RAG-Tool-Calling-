'use client';

import React, { useState, useRef } from 'react';
import { useWorkspace } from '../lib/context/WorkspaceContext';
import { api } from '../lib/api';
import { UploadCloud, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentUploaderProps {
  onUploadSuccess?: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUploadSuccess }) => {
  const { activeWorkspace } = useWorkspace();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!activeWorkspace) {
      setStatusMessage({ type: 'error', text: 'No active workspace selected.' });
      return;
    }

    try {
      setUploading(true);
      setStatusMessage({ type: 'info', text: `Chunking & embedding "${file.name}"...` });

      const res = await api.uploadDocument(activeWorkspace.id, file);

      if (res.already_exists) {
        setStatusMessage({ type: 'info', text: res.message });
      } else {
        setStatusMessage({ type: 'success', text: res.message });
      }

      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '16px',
          padding: '32px 20px',
          textAlign: 'center',
          background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,.json,.csv,.log"
          style={{ display: 'none' }}
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleUpload(e.target.files[0]);
            }
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          {uploading ? (
            <Loader2 size={36} className="gradient-text" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <UploadCloud size={38} style={{ color: 'var(--primary)' }} />
          )}

          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
            {uploading ? 'Processing & Embedding Document...' : 'Drag & drop document or click to browse'}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Supports PDF, TXT, Markdown, and DOCX (Max 10MB)
          </div>

          <div className="badge badge-primary" style={{ marginTop: '4px' }}>
            Scoped to: {activeWorkspace ? activeWorkspace.name : 'No workspace'}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`animate-fade-in badge ${
            statusMessage.type === 'success'
              ? 'badge-success'
              : statusMessage.type === 'error'
              ? 'badge-danger'
              : 'badge-primary'
          }`}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {statusMessage.type === 'success' && <CheckCircle2 size={16} />}
          {statusMessage.type === 'error' && <AlertCircle size={16} />}
          {statusMessage.type === 'info' && <File size={16} />}
          {statusMessage.text}
        </div>
      )}
    </div>
  );
};
