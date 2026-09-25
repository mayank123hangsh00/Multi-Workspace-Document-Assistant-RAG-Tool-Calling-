'use client';

import React, { useState } from 'react';
import { useWorkspace } from '../lib/context/WorkspaceContext';

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
    if (confirm(`Delete workspace "${name}" and all its documents?`)) {
      try { await deleteWorkspace(id); }
      catch (err: any) { alert(err.message || 'Failed to delete workspace'); }
    }
  };

  const wsInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="workspace-btn"
        style={{ width: '100%' }}
      >
        <div className="workspace-avatar">
          {activeWorkspace ? wsInitial(activeWorkspace.name) : '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
            {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {activeWorkspace ? `${activeWorkspace.doc_count ?? 0} documents` : 'No workspace selected'}
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-disabled)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Click away overlay */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setIsOpen(false)} />
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: '8px', right: '8px',
              background: 'var(--bg-overlay)', border: '1px solid var(--glass-border-md)',
              borderRadius: '12px', zIndex: 100, overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
            }}
            className="animate-fade-up"
          >
            {/* Header */}
            <div style={{
              padding: '8px 12px', fontSize: '0.65rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-disabled)',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Workspaces</span>
              <span style={{ color: 'var(--text-disabled)', fontWeight: 500 }}>{workspaces.length}</span>
            </div>

            {/* Workspace list */}
            <div style={{ padding: '6px', maxHeight: '220px', overflowY: 'auto' }}>
              {workspaces.length === 0 && (
                <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  No workspaces yet
                </div>
              )}
              {workspaces.map((ws) => {
                const isSelected = activeWorkspace?.id === ws.id;
                return (
                  <div
                    key={ws.id}
                    onClick={() => { setActiveWorkspace(ws); setIsOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                      background: isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                      marginBottom: '2px', transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                      background: isSelected ? 'var(--brand-gradient)' : 'var(--bg-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700,
                      color: isSelected ? 'white' : 'var(--text-tertiary)',
                    }}>
                      {wsInitial(ws.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: isSelected ? 600 : 500, color: isSelected ? 'var(--indigo-400)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ws.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-disabled)' }}>
                        {ws.doc_count ?? 0} docs
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-400)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {workspaces.length > 1 && (
                        <button
                          onClick={(e) => handleDelete(e, ws.id, ws.name)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-disabled)', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                          title="Delete workspace"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create new */}
            <div style={{ borderTop: '1px solid var(--glass-border)', padding: '6px' }}>
              <button
                onClick={() => { setShowModal(true); setIsOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '9px 10px', background: 'none', border: '1px dashed var(--glass-border-md)',
                  borderRadius: '8px', cursor: 'pointer', color: 'var(--indigo-400)',
                  fontSize: '0.82rem', fontWeight: 600, transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Workspace
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Workspace Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="animate-fade-up"
            style={{
              width: '100%', maxWidth: '420px',
              background: 'var(--bg-elevated)', border: '1px solid var(--glass-border-md)',
              borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px', background: 'var(--brand-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--glow-brand)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em' }}>New Workspace</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                  Documents and chats will be isolated here
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--rose-400)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Workspace Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Project Phoenix, Q4 Planning..."
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                style={{ marginBottom: '20px', borderRadius: '10px' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating || !newWorkspaceName.trim()}
                >
                  {creating ? (
                    <div className="spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  )}
                  {creating ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
