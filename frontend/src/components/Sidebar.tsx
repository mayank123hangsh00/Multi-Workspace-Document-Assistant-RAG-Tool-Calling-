'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useAuth } from '../lib/context/AuthContext';

const NAV_ITEMS = [
  {
    href: '/chat',
    label: 'RAG Assistant',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    href: '/tool-calls',
    label: 'Tool Logs',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    href: '/debug',
    label: 'Retrieval Inspector',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';

  return (
    <aside className="sidebar animate-slide-in">
      {/* Brand */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-logo-name text-gradient">Abstrat</div>
          <div className="sidebar-logo-sub">Document Intelligence</div>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div style={{ padding: '0' }}>
        <WorkspaceSwitcher />
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }} />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <div className="sidebar-section-label" style={{ padding: '0 20px', marginBottom: '6px' }}>Workspace</div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <span style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--indigo-400)', boxShadow: '0 0 6px rgba(99,102,241,0.8)' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '12px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        {/* Avatar */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.78rem', fontWeight: 700, color: 'white',
        }}>
          {userInitial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email || 'User'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--emerald-400)', boxShadow: '0 0 5px rgba(52,211,153,0.6)' }} />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Authenticated</span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="btn-icon"
          title="Sign out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
};
