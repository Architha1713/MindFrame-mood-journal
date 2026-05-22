import { Link } from 'react-router-dom';
import { Brain, Sparkles, BarChart2, BookOpen, ArrowRight, Shield, Zap, Heart } from 'lucide-react';

function FloatingOrb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={style}
    />
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen page-bg relative overflow-hidden">
      {/* Background orbs */}
      <FloatingOrb
        className="w-[600px] h-[600px] animate-pulse-glow"
        style={{ top: '-200px', left: '-200px', background: 'radial-gradient(circle, rgba(0,178,178,0.08) 0%, transparent 70%)' }}
      />
      <FloatingOrb
        className="w-[500px] h-[500px] animate-pulse-glow"
        style={{ top: '200px', right: '-150px', background: 'radial-gradient(circle, rgba(0,168,214,0.06) 0%, transparent 70%)', animationDelay: '1.5s' }}
      />
      <FloatingOrb
        className="w-[400px] h-[400px]"
        style={{ bottom: '0', left: '30%', background: 'radial-gradient(circle, rgba(0,140,140,0.05) 0%, transparent 70%)' }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-20 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00b2b2, #00a8d6)', boxShadow: '0 4px 20px rgba(0,178,178,0.4)' }}>
            <Brain size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-wide">MindFrame</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {['Features', 'How it works', 'About'].map(item => (
            <a key={item} href="#" className="text-sm text-white/50 hover:text-white/90 transition-colors duration-200">{item}</a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm px-4 py-2">Sign in</Link>
          <Link to="/signup" className="btn-primary text-sm px-4 py-2">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-medium animate-fade-in"
          style={{ background: 'rgba(0,178,178,0.1)', border: '1px solid rgba(0,178,178,0.25)', color: '#4dcaca' }}>
          <Sparkles size={12} />
          AI-Powered Emotional Wellness Platform
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] max-w-4xl mb-6 animate-slide-up">
          Understand your mind,{' '}
          <span className="text-gradient">one entry at a time</span>
        </h1>

        <p className="text-base md:text-lg text-white/50 max-w-xl mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
          MindFrame blends artificial intelligence with emotional intelligence — helping you track moods, journal thoughts, and uncover the patterns that shape your inner world.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/signup" className="btn-primary flex items-center gap-2 px-8 py-3.5 text-base">
            Begin your journey
            <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn-ghost flex items-center gap-2 px-6 py-3.5 text-base">
            I have an account
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 mt-14 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {[
            { value: '10K+', label: 'Daily entries' },
            { value: '94%', label: 'Feel supported' },
            { value: '21+', label: 'Mood patterns tracked' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-gradient">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature preview card */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="card-hover rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Mock UI preview */}
            <div className="p-6 md:p-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-error-500/60" />
                <div className="w-3 h-3 rounded-full bg-warning-500/60" />
                <div className="w-3 h-3 rounded-full bg-success-500/60" />
                <div className="flex-1 mx-4 h-6 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mood card */}
                <div className="glass rounded-2xl p-5">
                  <p className="text-xs text-white/40 mb-3">Today's mood</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(67,170,139,0.15)', border: '1px solid rgba(67,170,139,0.3)' }}>
                      <div className="w-7 h-7 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(67,170,139,0.8), rgba(67,170,139,0.4))' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Calm</p>
                      <p className="text-xs text-white/40">Intensity 7/10</p>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full w-[70%] rounded-full" style={{ background: 'linear-gradient(90deg, #43aa8b, #00b2b2)' }} />
                  </div>
                </div>

                {/* AI Insight card */}
                <div className="glass rounded-2xl p-5 md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={12} style={{ color: '#4dcaca' }} />
                    <p className="text-xs" style={{ color: '#4dcaca' }}>AI Reflection</p>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">
                    "You've maintained remarkable emotional stability this week. Your journal entries show a consistent pattern of mindful reflection — this is a strong indicator of emotional resilience..."
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full w-[82%] rounded-full" style={{ background: 'linear-gradient(90deg, #00b2b2, #00ccff)' }} />
                    </div>
                    <span className="text-xs text-white/40">82% wellness</span>
                  </div>
                </div>

                {/* Streak card */}
                <div className="glass rounded-2xl p-5">
                  <p className="text-xs text-white/40 mb-2">Journal streak</p>
                  <p className="text-3xl font-bold text-gradient">14</p>
                  <p className="text-xs text-white/40">days in a row</p>
                </div>

                {/* Mini chart */}
                <div className="glass rounded-2xl p-5 md:col-span-2">
                  <p className="text-xs text-white/40 mb-3">7-day emotional trend</p>
                  <div className="flex items-end gap-1.5 h-12">
                    {[6, 7, 5, 8, 7, 9, 8].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md transition-all"
                        style={{
                          height: `${h * 10}%`,
                          background: i === 6
                            ? 'linear-gradient(180deg, #00b2b2, #00a8d6)'
                            : 'rgba(0,178,178,0.2)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <span key={i} className="text-[9px] text-white/25 flex-1 text-center">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: '#4dcaca' }}>Core features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Everything you need to thrive</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BookOpen,
                title: 'Mindful Journaling',
                description: 'A distraction-free writing space with auto-save, timestamping, and a calming atmosphere designed for deep reflection.',
                color: '#00b2b2',
              },
              {
                icon: Brain,
                title: 'AI Mood Analysis',
                description: 'Advanced AI analyzes your entries to detect emotional tone, identify patterns, and provide personalized wellness insights.',
                color: '#00ccff',
              },
              {
                icon: BarChart2,
                title: 'Emotional Analytics',
                description: 'Visualize your emotional journey with elegant charts, weekly summaries, streak tracking, and trend analysis.',
                color: '#43aa8b',
              },
              {
                icon: Sparkles,
                title: 'Smart Insights',
                description: 'Receive burnout warnings, productivity insights, and emotional pattern recognition from your AI wellness companion.',
                color: '#f9c74f',
              },
              {
                icon: Shield,
                title: 'Private & Secure',
                description: 'Your emotional data is encrypted and protected. Only you can access your journal entries and mood history.',
                color: '#f8961e',
              },
              {
                icon: Zap,
                title: 'Companion System',
                description: 'Expressive animated companions reflect your emotional state, making check-ins feel personal and emotionally resonant.',
                color: '#f72585',
              },
            ].map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="card-hover group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card rounded-3xl py-14 px-8 relative overflow-hidden">
            <FloatingOrb
              className="w-96 h-96"
              style={{ top: '-100px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(0,178,178,0.08) 0%, transparent 70%)' }}
            />
            <Heart size={28} className="mx-auto mb-5" style={{ color: '#00b2b2' }} />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Begin your emotional clarity journey</h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Join thousands who've transformed their relationship with their emotions through AI-guided self-reflection.
            </p>
            <Link to="/signup" className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-base">
              Start for free
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 lg:px-20 py-8 border-t border-subtle">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain size={14} style={{ color: '#4dcaca' }} />
            <span className="text-xs text-white/40">MindFrame &copy; 2026</span>
          </div>
          <p className="text-xs text-white/30">Built with care for emotional wellness</p>
        </div>
      </footer>
    </div>
  );
}
