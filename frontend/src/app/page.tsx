'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/context/AuthContext';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const { user, demoLogin } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user) router.push('/chat');
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
        alert('Account created! You can now sign in.');
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient Grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 0%, transparent 100%)',
      }} />

      {/* Top Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(8,12,20,0.8)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #06b6d4 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.35)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">Abstrat</span>
        </div>
        <div className="chip chip-brand">Multi-Tenant RAG · Tool Calling</div>
      </nav>

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 440px',
          gap: '64px', maxWidth: '1100px', width: '100%', alignItems: 'center',
        }}>

          {/* ── Left hero ── */}
          <div className="animate-fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.8)',
                animation: 'orb-pulse-a 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Live · Ready to Use
              </span>
            </div>

            <h1 style={{ fontSize: '3.4rem', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: '20px' }}>
              Document Answers,<br />
              <span className="shimmer-text">Strictly Grounded</span><br />
              in Your Workspace.
            </h1>

            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '480px', marginBottom: '36px' }}>
              Upload documents, ask questions with zero cross-tenant data leakage, and let the AI autonomously execute actions — all isolated per workspace.
            </p>

            {/* Feature list */}
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  icon: '🔒',
                  title: 'Single-Store Vector Isolation',
                  desc: 'Workspace filter enforced inside pgvector cosine search — never post-retrieval.',
                  color: '#10b981',
                },
                {
                  icon: '⚡',
                  title: 'Autonomous Tool Calling',
                  desc: 'AI invokes save_task and send_summary_to_discord with server-validated args.',
                  color: '#6366f1',
                },
                {
                  icon: '📎',
                  title: 'Grounded Citations',
                  desc: 'Every answer links to exact document chunks with cosine similarity scores.',
                  color: '#06b6d4',
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="animate-fade-up"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{feat.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{feat.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right auth card ── */}
          <div
            className="animate-fade-up"
            style={{ animationDelay: '100ms' }}
          >
            <div style={{
              background: 'rgba(13,17,23,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '36px',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
            }}>
              {/* Card header */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  {isSignUp ? 'Get Started' : 'Welcome Back'}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {isSignUp ? 'Create your account' : 'Sign in to Abstrat'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  {isSignUp ? 'Start building isolated document workspaces' : 'Access your workspaces and documents'}
                </p>
              </div>

              {/* Demo Button */}
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: '0.9rem', marginBottom: '20px', borderRadius: '12px' }}
              >
                {loading ? (
                  <div className="spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                )}
                {loading ? 'Signing in...' : 'Quick Demo Login — Instant Access'}
              </button>

              <div className="divider">or continue with email</div>

              {/* Error */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                  borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
                  fontSize: '0.82rem', color: 'var(--rose-400)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Email form */}
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ borderRadius: '10px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ borderRadius: '10px' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={loading}
                  style={{ justifyContent: 'center', padding: '12px', borderRadius: '10px', marginTop: '4px' }}
                >
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </form>

              {/* Toggle */}
              <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  style={{ background: 'none', border: 'none', color: 'var(--indigo-400)', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
              {['Supabase Auth', 'pgvector', 'Groq LLM'].map((label) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-disabled)', fontWeight: 500 }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-disabled)' }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
