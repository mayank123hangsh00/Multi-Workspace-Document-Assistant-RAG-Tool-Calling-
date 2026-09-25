'use client';

import React from 'react';
import { RetrievalDebugView } from '../../../components/RetrievalDebugView';
import { ShieldCheck, Info } from 'lucide-react';

export default function DebugPage() {
  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck style={{ color: 'var(--success)' }} /> Retrieval Isolation Inspector
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
          Audit workspace scoping and verify that chunks from other tenants are strictly excluded during vector search.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', marginBottom: '8px' }}>
          <Info size={18} /> How to Test Workspace Isolation:
        </div>
        <ol style={{ fontSize: '0.88rem', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: 1.6 }}>
          <li>Create <strong>Workspace A</strong> and upload a document containing a secret fact (e.g., "The secret code is PHOENIX").</li>
          <li>Switch to <strong>Workspace B</strong> and upload a document with a different fact.</li>
          <li>In <strong>Workspace B</strong>, ask the assistant: "What is the secret code?".</li>
          <li>Notice that the assistant responds: <em>"I don't have enough information in this workspace's documents..."</em> and 0 chunks from Workspace A are retrieved.</li>
        </ol>
      </div>

      <div style={{ height: '500px' }}>
        <RetrievalDebugView chunks={[]} />
      </div>
    </div>
  );
}
