import { useState, FormEvent } from 'react';
import { User, Save, Loader, Check, Flame, BookOpen, Sparkles, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, CharacterStyle } from '../lib/supabase';

const characterStyles: { value: CharacterStyle; label: string; description: string }[] = [
  { value: 'feminine', label: 'Feminine', description: 'Softer, flowing character style' },
  { value: 'masculine', label: 'Masculine', description: 'Bold, structured character style' },
  { value: 'neutral', label: 'Neutral', description: 'Balanced, universal character style' },
];

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [characterStyle, setCharacterStyle] = useState<CharacterStyle>(profile?.character_style || 'neutral');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ display_name: displayName, character_style: characterStyle, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const stats = [
    { icon: Flame, label: 'Current streak', value: `${profile?.current_streak || 0} days`, color: '#f9c74f' },
    { icon: BookOpen, label: 'Total entries', value: profile?.total_entries || 0, color: '#00b2b2' },
    { icon: Sparkles, label: 'Longest streak', value: `${profile?.longest_streak || 0} days`, color: '#43aa8b' },
    { icon: Brain, label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', color: '#00ccff' },
  ];

  return (
    <div className="page-bg min-h-screen p-6 md:p-8 lg:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Profile & Settings</h1>
          <p className="text-xs text-white/40 mt-0.5">Personalize your MindFrame experience</p>
        </div>

        {/* Profile card */}
        <div className="card mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,178,178,0.2), rgba(0,168,214,0.15))',
              border: '1px solid rgba(0,178,178,0.25)',
              color: '#4dcaca',
            }}>
            {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{profile?.display_name || 'Anonymous'}</h2>
            <p className="text-xs text-white/40 mt-0.5">MindFrame member</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
              <span className="text-[10px] text-white/35">Active</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card text-center py-4">
              <Icon size={16} style={{ color }} className="mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-[10px] text-white/35 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Settings form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-white/80 mb-5 flex items-center gap-2">
              <User size={14} className="text-white/40" />
              Personal Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/55 mb-2">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
              <Brain size={14} className="text-white/40" />
              Companion Style
            </h3>
            <p className="text-xs text-white/35 mb-5">Choose the visual style for your emotional companions</p>

            <div className="grid grid-cols-3 gap-3">
              {characterStyles.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCharacterStyle(value)}
                  className={`flex flex-col items-center p-4 rounded-xl text-center transition-all duration-200 ${characterStyle === value ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                  style={characterStyle === value
                    ? { background: 'rgba(0,178,178,0.12)', border: '1px solid rgba(0,178,178,0.3)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="w-10 h-10 rounded-xl mb-2.5 flex items-center justify-center"
                    style={characterStyle === value
                      ? { background: 'rgba(0,178,178,0.2)', border: '1px solid rgba(0,178,178,0.3)' }
                      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Brain size={16} style={{ color: characterStyle === value ? '#4dcaca' : 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <p className={`text-xs font-semibold mb-0.5 ${characterStyle === value ? '' : 'text-white/60'}`}
                    style={characterStyle === value ? { color: '#4dcaca' } : {}}>
                    {label}
                  </p>
                  <p className="text-[9px] text-white/30">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Wellness preferences */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-white/40" />
              Wellness Preferences
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Daily mood reminders', description: 'Get notified to check in each day', enabled: true },
                { label: 'AI insight notifications', description: 'Receive new emotional insights', enabled: true },
                { label: 'Weekly email summaries', description: 'Get a weekly wellness report', enabled: false },
              ].map(pref => (
                <div key={pref.label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-medium text-white/65">{pref.label}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{pref.description}</p>
                  </div>
                  <div
                    className="w-10 h-5 rounded-full relative cursor-pointer transition-all"
                    style={{ background: pref.enabled ? 'rgba(0,178,178,0.3)' : 'rgba(255,255,255,0.1)' }}>
                    <div className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all"
                      style={{ left: pref.enabled ? '22px' : '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
          >
            {saving ? (
              <Loader size={15} className="animate-spin" />
            ) : saved ? (
              <><Check size={15} /> Saved successfully</>
            ) : (
              <><Save size={15} /> Save changes</>
            )}
          </button>
        </form>

        {/* Danger zone */}
        <div className="mt-8 card" style={{ border: '1px solid rgba(249,65,68,0.15)', background: 'rgba(249,65,68,0.03)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#f94144' }}>Data & Privacy</h3>
          <p className="text-xs text-white/40 mb-4 leading-relaxed">
            Your journal entries and mood data are private and encrypted. Only you can access your emotional data.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-white/25">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#43aa8b' }} />
            All data encrypted at rest and in transit
          </div>
        </div>
      </div>
    </div>
  );
}
