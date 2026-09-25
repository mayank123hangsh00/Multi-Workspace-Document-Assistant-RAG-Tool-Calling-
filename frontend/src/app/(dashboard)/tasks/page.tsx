'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../../lib/context/WorkspaceContext';
import { api } from '../../../lib/api';
import { TaskItem } from '../../../lib/types';
import { TaskList } from '../../../components/TaskList';
import { CheckSquare } from 'lucide-react';

export default function TasksPage() {
  const { activeWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!activeWorkspace) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const list = await api.listTasks(activeWorkspace.id);
      setTasks(list);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckSquare style={{ color: 'var(--primary)' }} /> Workspace Tasks
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
          Action items saved into <strong style={{ color: 'var(--text-main)' }}>"{activeWorkspace?.name || 'None'}"</strong> via the AI assistant's <code style={{ color: 'var(--accent-cyan)' }}>save_task</code> tool.
        </p>
      </div>

      <TaskList tasks={tasks} loading={loading} />
    </div>
  );
}
