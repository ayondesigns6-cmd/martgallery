'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Lock, Loader2, AlertCircle, Terminal, Copy, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sqlFix, setSqlFix] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    const errorType = searchParams.get('error');
    const paramEmail = searchParams.get('email');
    const paramUid = searchParams.get('uid');

    if (errorType === 'missing_env') {
      setError(
        'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing in this deployment. Please set them in your environment settings.'
      );
    } else if (errorType === 'missing_service_key') {
      setError(
        'SUPABASE_SERVICE_ROLE_KEY is missing on the server. Please add it to your server environment variables.'
      );
    } else if (errorType === 'not_in_admin_users' && paramEmail) {
      setError(
        `Authenticated as "${paramEmail}", but this account is not registered in the "admin_users" table in Supabase.`
      );
      if (paramUid) {
        setSqlFix(
          `INSERT INTO public.admin_users (id, email)\nVALUES ('${paramUid}', '${paramEmail}')\nON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id;`
        );
      }
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSqlFix(null);

    if (!isSupabaseConfigured()) {
      setError(
        'Supabase is not configured. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be added to your environment variables.'
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        // Display the actual Supabase Auth error directly
        setError(
          authError.message ||
            'Authentication failed. Please verify that this email and password are registered in Supabase Authentication.'
        );
        return;
      }

      if (!data.user) {
        setError('Login failed: user session could not be established.');
        return;
      }

      // Authoritative server-side admin check via /api/admin/auth/verify
      try {
        const verifyRes = await fetch('/api/admin/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.isAdmin) {
          setError(
            verifyData.error ||
              `User "${data.user.email}" is authenticated in Supabase Auth, but does not have admin permissions in the "admin_users" table.`
          );
          if (verifyData.sqlFix) {
            setSqlFix(verifyData.sqlFix);
          } else {
            setSqlFix(
              `INSERT INTO public.admin_users (id, email)\nVALUES ('${data.user.id}', '${data.user.email}')\nON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id;`
            );
          }
          await supabase.auth.signOut();
          return;
        }
      } catch {
        // If verify endpoint is temporarily unreachable, fallback to standard navigation
      }

      // Successful admin login -> Full page navigation to flush cookies into middleware
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const copySql = () => {
    if (!sqlFix) return;
    navigator.clipboard.writeText(sqlFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
      <div className="flex items-center gap-2 mb-2 text-slate-300">
        <Lock className="w-4 h-4 text-brand-gold-400" />
        <span className="text-xs font-semibold uppercase tracking-wider">Secure Admin Sign In</span>
      </div>

      {!isConfigured && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-amber-200 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Missing Supabase Environment Variables</span>
          </div>
          <p className="text-[11px] text-amber-300/80 leading-relaxed">
            Please add <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your deployment environment variables (Vercel Project Settings &gt; Environment Variables).
          </p>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-200 text-xs space-y-1">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        </div>
      )}

      {sqlFix && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5 text-amber-200 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-amber-300">
              <Terminal className="w-4 h-4" />
              Supabase SQL Fix Required
            </span>
            <button
              type="button"
              onClick={copySql}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded text-[11px] font-semibold text-amber-200 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>
          </div>
          <p className="text-[11px] text-amber-300/80">
            Run this in your Supabase SQL Editor to authorize this admin account:
          </p>
          <pre className="p-2.5 bg-black/40 rounded border border-white/10 text-[11px] font-mono text-amber-200 overflow-x-auto whitespace-pre">
            {sqlFix}
          </pre>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full px-3 py-2.5 text-xs bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Admin Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2.5 text-xs bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-gold-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isConfigured}
          className="w-full py-3 rounded-xl bg-brand-gold-600 hover:bg-brand-gold-500 text-brand-dark font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Sign In to Admin Dashboard</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-brand-navy border border-brand-gold-500/30 flex items-center justify-center text-brand-gold-400 font-bold text-2xl mx-auto mb-4 shadow-lg">
            M
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight uppercase">
            Mart <span className="text-brand-gold-400">Gallery</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Admin Control Panel</p>
        </div>

        {/* Wrap in Suspense — required for useSearchParams in Next.js 14 */}
        <Suspense
          fallback={
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-slate-400 text-xs">
              Loading...
            </div>
          }
        >
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
