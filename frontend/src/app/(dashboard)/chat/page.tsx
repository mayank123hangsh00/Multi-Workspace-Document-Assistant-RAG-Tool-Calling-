'use client';

import React, { useState } from 'react';
import { ChatWindow } from '../../../components/ChatWindow';
import { RetrievalDebugView } from '../../../components/RetrievalDebugView';
import { RetrievedChunk } from '../../../lib/types';

export default function ChatPage() {
  const [retrievedChunks, setRetrievedChunks] = useState<RetrievedChunk[]>([]);
  const [lastQuery, setLastQuery] = useState<string>('');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: '100vh', width: '100%' }}>
      <ChatWindow
        onRetrievalDebugUpdate={(chunks, query) => {
          setRetrievedChunks(chunks);
          setLastQuery(query);
        }}
      />
      <div style={{
        borderLeft: '1px solid var(--glass-border)',
        height: '100vh',
        overflowY: 'auto',
        background: 'var(--bg-surface)',
      }}>
        <RetrievalDebugView chunks={retrievedChunks} query={lastQuery} />
      </div>
    </div>
  );
}
