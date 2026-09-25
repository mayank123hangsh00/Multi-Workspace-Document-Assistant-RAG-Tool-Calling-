'use client';

import React, { useState } from 'react';
import { useWorkspace } from '../lib/context/WorkspaceContext';
import { ChevronDown, Plus, FolderCheck, Check, Trash2 } from 'lucide-react';

export const WorkspaceSwitcher: React.FC = () => {
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, deleteWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    try {
      setCreating(true);
      setError('');
      await createWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setShowModal(false);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete workspace "${name}" and all its documents?`)) {
      try {
        await deleteWorkspace(id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete workspace');
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          color: 'var(--text-main)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.85rem',
              flexShrink: 0,
            }}
          >
            {activeWorkspace ? activeWorkspace.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {activeWorkspace ? `${activeWorkspace.doc_count ?? 0} docs` : 'No workspace'}
            </div>
          </div>
        </div>
        <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            zIndex: 100,
            padding: '8px',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', padding: '6px 8px', textTransform: 'uppercase' }}>
            Workspaces
          </div>
          {workspaces.map((ws) => {
            const isSelected = activeWorkspace?.id === ws.id;
            return (
              <div
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isSelected ? '#a5b4fc' : 'var(--text-main)',
                  transition: 'all 0.15s ease',
                  marginBottom: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <FolderCheck size={16} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {ws.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSelected && <Check size={16} style={{ color: 'var(--primary)' }} />}
                  {workspaces.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(e, ws.id, ws.name)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-subtle)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Delete workspace"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              marginTop: '6px',
              borderTop: '1px solid var(--bg-glass-border)',
              background: 'transparent',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 600,
            }}
          >
            <Plus size={16} /> Create Workspace
          </button>
        </div>
      )}

      {/* Modal for creating workspace */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '420px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Create New Workspace</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Documents and chat history in this workspace will be isolated from others.
            </p>

            {error && (
              <div className="badge badge-danger" style={{ width: '100%', marginBottom: '14px', padding: '8px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <input
                type="text"
                className="glass-input"
                placeholder="Workspace name (e.g. Project Phoenix)"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                style={{ width: '100%', marginBottom: '20px' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-button"
                  disabled={creating || !newWorkspaceName.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
