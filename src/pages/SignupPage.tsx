import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', '#f94144', '#f9c74f', '#43aa8b'];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      setError((error as Error).message || 'Failed to create account. Try a different email.');
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,178,178,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
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
          <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-sm text-white/40">Begin your emotional clarity journey today</p>
        </div>

        <div className="glass-heavy rounded-2xl p-8 shadow-glass-lg">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-xs text-error-400 animate-slide-down"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Your name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  required
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(level => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: level <= passwordStrength ? strengthColors[passwordStrength] : 'rgba(255,255,255,0.1)' }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px]" style={{ color: strengthColors[passwordStrength] }}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
              )}
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
                  Create account
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Benefits */}
          <div className="mt-5 pt-5 border-t border-subtle">
            <div className="grid grid-cols-1 gap-2 mb-4">
              {['Free to use', 'AI-powered insights', 'Private & encrypted'].map(benefit => (
                <div key={benefit} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(67,170,139,0.2)', border: '1px solid rgba(67,170,139,0.3)' }}>
                    <Check size={10} style={{ color: '#43aa8b' }} />
                  </div>
                  <span className="text-xs text-white/40">{benefit}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-white/40">
              Already have an account?{' '}
              <Link to="/login" className="font-medium transition-colors" style={{ color: '#4dcaca' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
