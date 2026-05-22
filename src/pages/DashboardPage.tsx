import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, BarChart2, Flame, ArrowRight, Plus, Brain, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, MoodEntry, JournalEntry, AiInsight } from '../lib/supabase';
import { moodConfig } from '../components/MoodCompanion';

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string | number; sub: string; color: string; icon: React.FC<{ size?: number; className?: string }>;
}) {
  return (
    <div className="card group hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <TrendingUp size={12} className="text-white/20 group-hover:text-white/40 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs font-medium text-white/60 mt-0.5">{label}</p>
      <p className="text-[10px] text-white/30 mt-1">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [recentJournals, setRecentJournals] = useState<JournalEntry[]>([]);
  const [latestInsight, setLatestInsight] = useState<AiInsight | null>(null);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    async function load() {
      const [{ data: moods }, { data: journals }, { data: insights }, { data: todayMoodData }] = await Promise.all([
        supabase.from('mood_entries').select('*').order('created_at', { ascending: false }).limit(7),
        supabase.from('journal_entries').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('ai_insights').select('*').order('created_at', { ascending: false }).limit(1),
        supabase.from('mood_entries').select('*').eq('entry_date', today).maybeSingle(),
      ]);
      setRecentMoods(moods || []);
      setRecentJournals(journals || []);
      setLatestInsight(insights?.[0] || null);
      setTodayMood(todayMoodData || null);
      setLoading(false);
    }
    load();
  }, [today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
      </div>
    );
  }

  const weekMoods = recentMoods.slice(0, 7);
  const moodCounts = weekMoods.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="page-bg min-h-screen p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-white/40 mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span className="text-gradient">{profile?.display_name || 'friend'}</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">How are you feeling today?</p>
        </div>

        <Link to="/journal" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} />
          New entry
        </Link>
      </div>

      {/* Today's mood CTA or today mood display */}
      {!todayMood ? (
        <Link to="/journal" className="block mb-6">
          <div className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:scale-[1.01]"
            style={{
              background: 'linear-gradient(135deg, rgba(0,178,178,0.12), rgba(0,168,214,0.08))',
              border: '1px solid rgba(0,178,178,0.25)',
            }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center animate-breathe"
              style={{ background: 'rgba(0,178,178,0.15)', border: '1px solid rgba(0,178,178,0.3)' }}>
              <Brain size={22} style={{ color: '#4dcaca' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Check in with your emotions</p>
              <p className="text-xs text-white/40">You haven't logged today's mood yet — take a moment to reflect</p>
            </div>
            <ArrowRight size={16} className="text-white/30" />
          </div>
        </Link>
      ) : (
        <div className="mb-6 rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: `${moodConfig[todayMood.mood as keyof typeof moodConfig]?.color}12`,
            border: `1px solid ${moodConfig[todayMood.mood as keyof typeof moodConfig]?.color}25`,
          }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: `${moodConfig[todayMood.mood as keyof typeof moodConfig]?.color}20`,
              border: `1px solid ${moodConfig[todayMood.mood as keyof typeof moodConfig]?.color}35`,
            }}>
            <span className="text-sm font-bold capitalize" style={{ color: moodConfig[todayMood.mood as keyof typeof moodConfig]?.color }}>
              {todayMood.mood.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs text-white/40">Today's mood</p>
            <p className="text-sm font-semibold text-white capitalize">{todayMood.mood}</p>
            <p className="text-xs text-white/30">Intensity {todayMood.intensity}/10</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Day streak"
          value={profile?.current_streak || 0}
          sub="Keep it going!"
          color="#f9c74f"
          icon={Flame}
        />
        <StatCard
          label="Total entries"
          value={recentJournals.length}
          sub="All time"
          color="#00b2b2"
          icon={BookOpen}
        />
        <StatCard
          label="This week's mood"
          value={dominantMood ? dominantMood.charAt(0).toUpperCase() + dominantMood.slice(1) : '—'}
          sub="Dominant emotion"
          color="#43aa8b"
          icon={Brain}
        />
        <StatCard
          label="AI insights"
          value={latestInsight ? `${latestInsight.wellness_score}/10` : '—'}
          sub="Wellness score"
          color="#00ccff"
          icon={Sparkles}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent entries */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/80">Recent Journal Entries</h2>
            <Link to="/journal" className="text-xs transition-colors" style={{ color: '#4dcaca' }}>
              View all
            </Link>
          </div>

          {recentJournals.length === 0 ? (
            <div className="card flex flex-col items-center py-10 text-center">
              <BookOpen size={24} className="text-white/20 mb-3" />
              <p className="text-sm text-white/40">No journal entries yet</p>
              <p className="text-xs text-white/25 mt-1">Write your first entry to begin</p>
              <Link to="/journal" className="btn-primary mt-4 text-xs px-4 py-2">
                Start writing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJournals.slice(0, 4).map(entry => (
                <Link key={entry.id} to="/journal" className="block card-hover group">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(0,178,178,0.1)', border: '1px solid rgba(0,178,178,0.2)' }}>
                      <BookOpen size={12} style={{ color: '#4dcaca' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">
                        {entry.title || 'Untitled entry'}
                      </p>
                      <p className="text-xs text-white/35 line-clamp-2 mt-0.5 leading-relaxed">
                        {entry.content || 'No content yet...'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-white/25">
                        {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-white/20 mt-0.5">{entry.word_count} words</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Insight */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/80">Latest AI Insight</h2>
              <Link to="/insights" className="text-xs transition-colors" style={{ color: '#4dcaca' }}>
                View all
              </Link>
            </div>

            {latestInsight ? (
              <div className="card"
                style={{ background: 'rgba(0,178,178,0.06)', border: '1px solid rgba(0,178,178,0.15)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={12} style={{ color: '#4dcaca' }} />
                  <span className="text-xs font-medium capitalize" style={{ color: '#4dcaca' }}>
                    {latestInsight.insight_type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{latestInsight.insight_text}</p>
                {latestInsight.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-subtle">
                    <p className="text-[10px] text-white/30 mb-1.5">Recommendations</p>
                    <p className="text-xs text-white/50">{latestInsight.recommendations[0]}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card flex flex-col items-center py-8 text-center">
                <Sparkles size={22} className="mb-2" style={{ color: '#4dcaca' }} />
                <p className="text-xs text-white/40">No insights yet</p>
                <p className="text-[10px] text-white/25 mt-1">Write a journal entry to get AI analysis</p>
              </div>
            )}
          </div>

          {/* Mood week */}
          <div>
            <h2 className="text-sm font-semibold text-white/80 mb-4">Mood this week</h2>
            <div className="card">
              {weekMoods.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <BarChart2 size={22} className="text-white/20 mb-2" />
                  <p className="text-xs text-white/35">No mood data yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {weekMoods.slice(0, 5).map(mood => {
                    const cfg = moodConfig[mood.mood as keyof typeof moodConfig];
                    return (
                      <div key={mood.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg?.color }} />
                        <span className="text-xs text-white/50 capitalize w-20 flex-shrink-0">{mood.mood}</span>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${mood.intensity * 10}%`, background: cfg?.color }}
                          />
                        </div>
                        <span className="text-[10px] text-white/25 flex-shrink-0">{mood.intensity}/10</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/analytics', icon: BarChart2, label: 'Analytics', color: '#43aa8b' },
              { to: '/insights', icon: Sparkles, label: 'AI Insights', color: '#00ccff' },
            ].map(({ to, icon: Icon, label, color }) => (
              <Link key={to} to={to} className="card-hover flex flex-col items-center py-5 text-center">
                <Icon size={18} style={{ color }} className="mb-2" />
                <span className="text-xs text-white/55">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
