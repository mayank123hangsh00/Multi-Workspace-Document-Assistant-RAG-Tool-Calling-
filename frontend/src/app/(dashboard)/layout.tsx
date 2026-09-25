'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import { useAuth } from '../../lib/context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
        background: 'var(--bg-base)',
      }}>
        {/* Spinner */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.15)',
          borderTopColor: 'var(--indigo-500)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          Loading your workspaces...
        </span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
      }}>
        {children}
      </main>
    </div>
  );
}
