'use client';

import React from 'react';
import { TaskItem } from '../lib/types';
import { CheckSquare, AlertCircle, Clock, Tag } from 'lucide-react';

interface TaskListProps {
  tasks: TaskItem[];
  loading?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, loading }) => {
  if (loading) {
    return <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <CheckSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
        <p style={{ fontWeight: 500 }}>No tasks in this workspace yet.</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
          Ask the assistant: "Save a task to review the Q3 budget" to create one automatically via tool calling!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {tasks.map((task) => {
        const priorityBadge =
          task.priority === 'urgent'
            ? 'badge-danger'
            : task.priority === 'high'
            ? 'badge-warning'
            : task.priority === 'medium'
            ? 'badge-primary'
            : 'badge-success';

        return (
          <div key={task.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{task.title}</div>
                {task.description && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {task.description}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '6px', display: 'flex', gap: '8px' }}>
                  <span>Created by AI Tool: save_task</span>
                  <span>•</span>
                  <span>{new Date(task.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${priorityBadge}`} style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>
                {task.priority} priority
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
