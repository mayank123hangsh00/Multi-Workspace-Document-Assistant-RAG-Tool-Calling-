'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/context/AuthContext';
import { supabase } from '../lib/supabase';
import { Cpu, ShieldCheck, Sparkles, ArrowRight, Lock, Wrench, Layers } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, demoLogin } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to dashboard if logged in
  React.useEffect(() => {
    if (user) {
      router.push('/chat');
    }
  }, [user, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError('');
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Account created! Please check your email or proceed to sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await demoLogin();
      router.push('/chat');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
      }}
    >
      {/* Top Brand Tag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Cpu size={26} color="white" />
        </div>
        <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800 }}>
          Abstrat
        </h1>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: '40px',
          maxWidth: '1050px',
          width: '100%',
          alignItems: 'center',
        }}
      >
        {/* Hero Features Text */}
        <div>
          <div className="badge badge-primary" style={{ marginBottom: '16px', gap: '6px' }}>
            <Sparkles size={14} /> Multi-Tenant RAG & Tool Calling Assistant
          </div>

          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, marginBottom: '16px' }}>
            Document Answers Grounded in <span className="gradient-text-accent">Isolated Workspaces</span>
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '28px' }}>
            Upload team documents, ask questions with guaranteed zero cross-tenant leakage, and let the AI take actions like saving tasks and posting summaries to Discord.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="badge badge-success" style={{ padding: '8px' }}>
                <Lock size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Strict Single-Store Vector Isolation</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                  Workspace filtering is enforced inside pgvector cosine search, never after retrieval.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="badge badge-primary" style={{ padding: '8px' }}>
                <Wrench size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Autonomous Tool Execution</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                  Model proposes tool calls (`save_task`, `send_summary_to_discord`); your app validates and executes safely.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="badge badge-warning" style={{ padding: '8px' }}>
                <Layers size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Idempotency & Citations</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                  SHA-256 deduplication prevents duplicate chunking; answers cite exact document sections.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Box */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            {isSignUp ? 'Sign up to start building workspaces' : 'Sign in to access your workspaces'}
          </p>

          {/* Quick Demo Login Button */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="gradient-button"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              marginBottom: '16px',
            }}
          >
            <Sparkles size={18} /> Quick Demo Login (Instant Access)
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--bg-glass-border)' }} />
            <span>or email sign in</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--bg-glass-border)' }} />
          </div>

          {error && (
            <div className="badge badge-danger" style={{ width: '100%', marginBottom: '14px', padding: '10px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="email"
              className="glass-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="glass-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              className="secondary-button"
              disabled={loading}
              style={{ justifyContent: 'center', padding: '12px' }}
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
