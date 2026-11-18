import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Brain, ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      setError("We couldn't send a reset link. Please check the email address and try again.");
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,178,178,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,168,214,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00b2b2, #00a8d6)', boxShadow: '0 4px 20px rgba(0,178,178,0.4)' }}>
              <Brain size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">MindFrame</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
          <p className="text-sm text-white/40">We&apos;ll email you a secure link to set a new one</p>
        </div>

        <div className="glass-heavy rounded-2xl p-8 shadow-glass-lg">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(67,170,139,0.15)', border: '1px solid rgba(67,170,139,0.3)' }}>
                <CheckCircle2 size={26} style={{ color: '#43aa8b' }} />
              </div>
              <p className="text-sm text-white/80 font-medium mb-2">Check your inbox</p>
              <p className="text-xs text-white/40 leading-relaxed">
                We sent a password reset link to <span className="text-white/70">{email}</span>.
                It expires in a few minutes — if you don&apos;t see it, check your spam folder.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 mt-6 text-xs font-medium transition-colors hover:underline"
                style={{ color: '#4dcaca' }}>
                Back to sign in
                <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl text-xs text-error-400 animate-slide-down"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-2">Email address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="input-field pl-10"
                    />
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-subtle text-center">
                <p className="text-xs text-white/40">
                  Remembered it?{' '}
                  <Link to="/login" className="font-medium transition-colors" style={{ color: '#4dcaca' }}>
                    Back to sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
