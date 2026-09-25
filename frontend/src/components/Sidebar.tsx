'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useAuth } from '../lib/context/AuthContext';
import { MessageSquare, FileText, CheckSquare, Wrench, Shield, LogOut, Cpu } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    { href: '/chat', label: 'RAG Assistant', icon: MessageSquare },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/tasks', label: 'Workspace Tasks', icon: CheckSquare },
    { href: '/tool-calls', label: 'Tool Call Logs', icon: Wrench },
    { href: '/debug', label: 'Retrieval Debug', icon: Shield },
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        width: '260px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px',
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '4px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Cpu size={20} color="white" />
        </div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.1 }}>
            Abstrat
          </h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600, letterSpacing: '0.05em' }}>
            RAG & TOOL ASSISTANT
          </span>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div style={{ marginBottom: '24px' }}>
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-subtle)', paddingLeft: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? 'var(--gradient-accent)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div
        style={{
          borderTop: '1px solid var(--bg-glass-border)',
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email || 'User'}
          </div>
          <div className="badge badge-success" style={{ fontSize: '0.65rem', marginTop: '2px' }}>
            Authenticated
          </div>
        </div>
        <button
          onClick={signOut}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-subtle)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
          }}
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
