import { useState } from 'react';
import { ArrowRight, BookOpen, LoaderCircle } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export default function AuthPage({ initialError = '', onBackToPortfolio }) {
  const [mode, setMode] = useState('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'sign-up';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin
          }
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage('Account created. Check your email to confirm your address, then sign in.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (signInError) throw signInError;
      }
    } catch (authError) {
      setError(authError.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        {onBackToPortfolio && (
          <button
            type="button"
            onClick={onBackToPortfolio}
            className="mb-5 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            ← Back to portfolio
          </button>
        )}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-white">Study Companion</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to continue to your study dashboard</p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-white p-6 sm:p-8 shadow-2xl">
          {!isSupabaseConfigured ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Connect Supabase to enable login</h2>
              <p className="text-sm leading-6 text-slate-600">
                Set <code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_SUPABASE_URL</code> and
                {' '}<code className="rounded bg-slate-100 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code>
                {' '}in the frontend environment, then rebuild and redeploy.
              </p>
              <p className="text-xs text-slate-500">Use the Supabase publishable/anon key, never the service-role key.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 mb-6">
                <button
                  type="button"
                  onClick={() => { setMode('sign-in'); setError(''); setMessage(''); }}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${!isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('sign-up'); setError(''); setMessage(''); }}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Name</span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
                  <input
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                {(error || initialError) && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                    {error || initialError}
                  </p>
                )}
                {message && (
                  <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
                </button>
              </form>
            </>
          )}
        </section>
        <p className="mt-5 text-center text-xs text-slate-500">Your account is managed securely by Supabase.</p>
      </div>
    </main>
  );
}
