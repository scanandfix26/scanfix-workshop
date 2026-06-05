import { useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => void;
  onReset: (email: string) => Promise<string>;
  error: string;
}

export default function Login({ onLogin, onReset, error }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [resetMsg, setResetMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    await onLogin(email.trim(), password);
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const msg = await onReset(email.trim());
    setResetMsg(msg);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 bg-yellow/10 flex items-center justify-center">
          <img src="/logo.png" alt="Scan & Fix" className="w-full h-full object-contain p-1" />
        </div>
        <h1 className="text-white text-3xl font-bold">
          Scan<span className="text-yellow">&</span>Fix
        </h1>
        <p className="text-gray-400 text-sm mt-1">Workshop Management System</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        {mode === 'login' ? (
          <>
            <h2 className="text-dark font-bold text-xl mb-1">Welcome Back</h2>
            <p className="text-gray-400 text-sm mb-5">Sign in to your workshop</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5 font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark text-base outline-none focus:border-yellow focus:ring-2 focus:ring-yellow/20 transition-all"
                  placeholder="you@workshop.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5 font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark text-base outline-none focus:border-yellow focus:ring-2 focus:ring-yellow/20 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow text-dark font-bold py-3.5 rounded-xl text-base disabled:opacity-60 active:scale-98 transition-all"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => setMode('reset')}
              className="mt-4 w-full text-center text-sm text-gray-400 underline"
            >
              Forgot password?
            </button>

            {/* Demo credentials hint */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-2 font-semibold uppercase tracking-wide">Demo Access</p>
              <div className="space-y-1.5 text-xs text-gray-500">
                {[
                  { role: 'Admin', email: 'admin@workshop.com' },
                  { role: 'Mechanic', email: 'mechanic@workshop.com' },
                  { role: 'Worker', email: 'worker@workshop.com' },
                ].map(d => (
                  <button
                    key={d.email}
                    onClick={() => { setEmail(d.email); setPassword('workshop123'); }}
                    className="w-full flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 active:bg-yellow/10 transition-colors"
                  >
                    <span className="font-semibold text-dark">{d.role}</span>
                    <span className="text-gray-400">{d.email}</span>
                  </button>
                ))}
                <p className="text-center text-gray-400 pt-1">Password: <strong>workshop123</strong></p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-dark font-bold text-xl mb-1">Reset Password</h2>
            <p className="text-gray-400 text-sm mb-5">We'll send you a reset link</p>
            {resetMsg ? (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm mb-4">{resetMsg}</div>
            ) : null}
            <form onSubmit={handleReset} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-dark text-base outline-none focus:border-yellow transition-all"
                placeholder="your@email.com"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow text-dark font-bold py-3.5 rounded-xl text-base disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
            <button
              onClick={() => setMode('login')}
              className="mt-4 w-full text-center text-sm text-gray-400 underline"
            >
              Back to login
            </button>
          </>
        )}
      </div>

      <p className="text-gray-600 text-xs mt-6">Works offline · Data saved locally</p>
    </div>
  );
}
