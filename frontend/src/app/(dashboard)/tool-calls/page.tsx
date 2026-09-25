'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../../lib/context/WorkspaceContext';
import { api } from '../../../lib/api';
import { ToolCall } from '../../../lib/types';
import { ToolCallLog } from '../../../components/ToolCallLog';
import { Wrench } from 'lucide-react';

export default function ToolCallsPage() {
  const { activeWorkspace } = useWorkspace();
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchToolCalls = useCallback(async () => {
    if (!activeWorkspace) {
      setToolCalls([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await api.listToolCalls(activeWorkspace.id);
      setToolCalls(list);
    } catch (err) {
      console.error('Failed to load tool calls:', err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    fetchToolCalls();
  }, [fetchToolCalls]);

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wrench style={{ color: 'var(--accent-cyan)' }} /> Tool Call Audit Logs
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
          Real-time execution log of function/tool calls proposed by the AI model in <strong style={{ color: 'var(--text-main)' }}>"{activeWorkspace?.name || 'None'}"</strong>.
        </p>
      </div>

      <ToolCallLog toolCalls={toolCalls} loading={loading} />
    </div>
  );
}
