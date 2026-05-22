import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Calendar, Flame, Target, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, MoodEntry } from '../lib/supabase';
import { moodConfig } from '../components/MoodCompanion';

type MoodType = keyof typeof moodConfig;

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${(value / max) * 100}%`, background: color }}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, profile } = useAuth();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadMoods();
  }, [period]);

  async function loadMoods() {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false });

    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('entry_date', weekAgo.toISOString().split('T')[0]);
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      query = query.gte('entry_date', monthAgo.toISOString().split('T')[0]);
    }

    const { data } = await query.limit(100);
    setMoods(data || []);
    setLoading(false);
  }

  // Process data
  const moodCounts = moods.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodIntensityAvg = moods.reduce((acc, m) => {
    if (!acc[m.mood]) acc[m.mood] = { sum: 0, count: 0 };
    acc[m.mood].sum += m.intensity;
    acc[m.mood].count += 1;
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = sortedMoods[0]?.[1] || 1;

  const avgIntensity = moods.length ? (moods.reduce((s, m) => s + m.intensity, 0) / moods.length).toFixed(1) : '—';
  const dominantMood = sortedMoods[0]?.[0] as MoodType;

  // 7-day chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayMoods = moods.filter(m => m.entry_date === dateStr);
    const avgInt = dayMoods.length ? dayMoods.reduce((s, m) => s + m.intensity, 0) / dayMoods.length : 0;
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateStr,
      avgIntensity: avgInt,
      mood: dayMoods[0]?.mood as MoodType | undefined,
      hasData: dayMoods.length > 0,
    };
  });

  // Calendar for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  function getMoodForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return moods.find(m => m.entry_date === dateStr);
  }

  return (
    <div className="page-bg min-h-screen p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Mood Analytics</h1>
          <p className="text-xs text-white/40 mt-0.5">Your emotional patterns and trends</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['week', 'month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              style={period === p ? { background: 'rgba(0,178,178,0.2)', color: '#4dcaca' } : {}}
            >
              {p === 'week' ? '7 days' : p === 'month' ? '30 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
        </div>
      ) : moods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BarChart2 size={36} className="text-white/15 mb-4" />
          <p className="text-white/40 font-medium">No mood data yet</p>
          <p className="text-xs text-white/25 mt-1">Log your daily mood to start seeing analytics</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Entries logged', value: moods.length, icon: Calendar, color: '#00b2b2' },
              { label: 'Avg intensity', value: avgIntensity, icon: TrendingUp, color: '#00ccff' },
              { label: 'Current streak', value: `${profile?.current_streak || 0}d`, icon: Flame, color: '#f9c74f' },
              {
                label: 'Dominant mood',
                value: dominantMood ? dominantMood.charAt(0).toUpperCase() + dominantMood.slice(1) : '—',
                icon: Brain,
                color: dominantMood ? moodConfig[dominantMood]?.color : '#43aa8b',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card group hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* 7-day bar chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white/80">Emotional Intensity — 7 Days</h2>
              <Target size={14} className="text-white/25" />
            </div>
            <div className="flex items-end gap-2 h-28">
              {last7Days.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex flex-col justify-end" style={{ height: '90px' }}>
                    {day.hasData ? (
                      <div
                        className="w-full rounded-t-lg transition-all duration-700 relative group cursor-pointer"
                        style={{
                          height: `${(day.avgIntensity / 10) * 90}px`,
                          background: day.mood ? `linear-gradient(180deg, ${moodConfig[day.mood]?.color || '#00b2b2'}, ${moodConfig[day.mood]?.color || '#00b2b2'}88)` : 'rgba(0,178,178,0.4)',
                          minHeight: '8px',
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-[9px] text-white/80 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-10"
                          style={{ background: 'rgba(0,0,0,0.8)' }}>
                          {day.avgIntensity.toFixed(1)}/10
                        </div>
                      </div>
                    ) : (
                      <div className="w-full rounded-t-lg" style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }} />
                    )}
                  </div>
                  <span className="text-[9px] text-white/30">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood distribution */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white/80 mb-5">Mood Distribution</h2>
              {sortedMoods.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-6">No data</p>
              ) : (
                <div className="space-y-3">
                  {sortedMoods.map(([mood, count]) => {
                    const cfg = moodConfig[mood as MoodType];
                    const avg = moodIntensityAvg[mood];
                    const avgI = avg ? (avg.sum / avg.count).toFixed(1) : '—';
                    return (
                      <div key={mood}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: cfg?.color }} />
                            <span className="text-xs text-white/60 capitalize">{mood}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-white/30">avg {avgI}/10</span>
                            <span className="text-xs font-medium text-white/60">{count}x</span>
                          </div>
                        </div>
                        <MiniBar value={count} max={maxCount} color={cfg?.color || '#00b2b2'} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calendar heatmap */}
            <div className="card">
              <h2 className="text-sm font-semibold text-white/80 mb-4">
                {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Mood Calendar
              </h2>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-[9px] text-white/25 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={i} />;
                  const moodEntry = getMoodForDay(day);
                  const isToday = day === now.getDate();
                  const cfg = moodEntry ? moodConfig[moodEntry.mood as MoodType] : null;

                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-lg flex items-center justify-center text-[9px] transition-all relative"
                      style={{
                        background: cfg ? `${cfg.color}22` : 'rgba(255,255,255,0.04)',
                        border: isToday ? '1px solid rgba(0,178,178,0.4)' : cfg ? `1px solid ${cfg.color}35` : '1px solid transparent',
                        color: isToday ? '#4dcaca' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {day}
                      {cfg && (
                        <div className="absolute inset-0 rounded-lg opacity-40" style={{ background: cfg.color, mixBlendMode: 'overlay' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-subtle flex flex-wrap gap-2">
                {Object.entries(moodCounts).slice(0, 4).map(([mood]) => {
                  const cfg = moodConfig[mood as MoodType];
                  return (
                    <div key={mood} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: cfg?.color }} />
                      <span className="text-[9px] text-white/35 capitalize">{mood}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mood timeline */}
          <div className="card">
            <h2 className="text-sm font-semibold text-white/80 mb-5">Recent Mood Timeline</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {moods.slice(0, 20).map(entry => {
                const cfg = moodConfig[entry.mood as MoodType];
                return (
                  <div key={entry.id} className="flex items-center gap-4 py-2.5 px-3 rounded-xl transition-colors hover:bg-white/[0.03]">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg?.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white/70 capitalize">{entry.mood}</span>
                        {entry.note && (
                          <span className="text-xs text-white/35 truncate">&mdash; {entry.note}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{ width: `${entry.intensity * 10}%`, background: cfg?.color }} />
                      </div>
                      <span className="text-[10px] text-white/30 w-6">{entry.intensity}</span>
                      <span className="text-[10px] text-white/25 w-12 text-right">
                        {new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
