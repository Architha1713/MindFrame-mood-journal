import { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Sparkles, ChevronDown, ChevronUp, Plus, BookOpen, Loader, X, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, MoodType, CharacterStyle, JournalEntry } from '../lib/supabase';
import MoodCompanion, { moodConfig } from '../components/MoodCompanion';

const moods: MoodType[] = ['happy', 'calm', 'anxious', 'stressed', 'tired', 'excited', 'sad', 'overwhelmed'];

function MoodCheckIn({ onComplete, characterStyle }: {
  onComplete: (moodEntryId: string, mood: MoodType) => void;
  characterStyle: CharacterStyle;
}) {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveMood() {
    if (!selectedMood || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('mood_entries')
      .insert({
        user_id: user.id,
        mood: selectedMood,
        intensity,
        note,
        character_style: characterStyle,
        entry_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();
    setSaving(false);
    if (!error && data) onComplete(data.id, selectedMood);
  }

  return (
    <div className="animate-scale-in">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-white mb-1">How are you feeling right now?</h2>
        <p className="text-xs text-white/40">Select the companion that resonates with your current emotional state</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-8">
        {moods.map(mood => (
          <MoodCompanion
            key={mood}
            mood={mood}
            style={characterStyle}
            size="sm"
            selected={selectedMood === mood}
            onClick={() => setSelectedMood(mood)}
          />
        ))}
      </div>

      {selectedMood && (
        <div className="animate-slide-up space-y-5">
          <div className="rounded-2xl p-4"
            style={{ background: `${moodConfig[selectedMood].color}0d`, border: `1px solid ${moodConfig[selectedMood].color}22` }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-white/60">Intensity</label>
              <span className="text-xs font-bold" style={{ color: moodConfig[selectedMood].color }}>{intensity}/10</span>
            </div>
            <input
              type="range"
              min={1} max={10}
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              className="w-full accent-teal-400 h-1.5"
              style={{ accentColor: moodConfig[selectedMood].color }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">A brief note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What triggered this feeling?"
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <button
            onClick={saveMood}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save mood & continue to journal'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [characterStyle, setCharacterStyle] = useState<CharacterStyle>(profile?.character_style || 'neutral');
  const [step, setStep] = useState<'mood' | 'write'>('mood');
  const [moodEntryId, setMoodEntryId] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [todayMoods, setTodayMoods] = useState<{ mood: MoodType; intensity: number; created_at: string }[]>([]);
  const [dailyAnalysis, setDailyAnalysis] = useState<string | null>(null);
  const [dailyAnalysisLoading, setDailyAnalysisLoading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (profile?.character_style) setCharacterStyle(profile.character_style);
  }, [profile?.character_style]);

  useEffect(() => {
    loadEntries();
    loadTodayMoods();
    loadDailyAnalysis();
  }, []);

  async function loadTodayMoods() {
    if (!user) return;
    const { data } = await supabase
      .from('mood_entries')
      .select('mood, intensity, created_at')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .order('created_at', { ascending: true });
    setTodayMoods(data || []);
  }

  async function loadDailyAnalysis() {
    if (!user) return;
    const { data } = await supabase
      .from('ai_insights')
      .select('insight_text')
      .eq('user_id', user.id)
      .eq('insight_type', 'daily_summary')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setDailyAnalysis(data.insight_text);
  }

  async function loadEntries() {
    if (!user) return;
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setEntries(data || []);
  }

  async function persistCharacterStyle(style: CharacterStyle) {
    if (!user) return;
    setCharacterStyle(style);
    await supabase
      .from('profiles')
      .update({ character_style: style, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    await refreshProfile();
  }

  function handleMoodComplete(id: string, mood: MoodType) {
    setMoodEntryId(id);
    setCurrentMood(mood);
    setStep('write');
    loadTodayMoods();
  }

  const autoSave = useCallback(async (t: string, c: string, entryId?: string) => {
    if (!user) return;
    const wordCount = c.trim().split(/\s+/).filter(Boolean).length;
    const payload = {
      user_id: user.id,
      mood_entry_id: moodEntryId,
      title: t,
      content: c,
      word_count: wordCount,
      entry_date: today,
      is_draft: true,
    };

    if (entryId) {
      await supabase.from('journal_entries').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', entryId);
    } else {
      const { data } = await supabase.from('journal_entries').insert(payload).select().single();
      if (data) {
        setActiveEntry(data);
        loadEntries();
      }
    }
  }, [user, moodEntryId, today]);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autoSave(val, content, activeEntry?.id), 1500);
  }

  function handleContentChange(val: string) {
    setContent(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autoSave(title, val, activeEntry?.id), 1500);
  }

  async function saveEntry() {
    if (!content.trim()) return;
    setSaving(true);
    await autoSave(title, content, activeEntry?.id);
    setSaving(false);
    await loadEntries();
    await triggerDailyAnalysis();
  }

  async function triggerDailyAnalysis() {
    if (!user || dailyAnalysisLoading) return;
    setDailyAnalysisLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-journal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          mood: currentMood,
          userId: user.id,
          journalEntryId: activeEntry?.id,
          moodEntryId,
          insightType: 'daily_summary',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.insight_text || 'Analysis complete.';
        setDailyAnalysis(text);
        setAnalysisResult(text);
        setShowAnalysis(true);
      }
    } catch {
      // silently handle
    }
    setDailyAnalysisLoading(false);
  }

  async function analyzeEntry() {
    if (!content.trim() || !user) return;
    setAnalyzing(true);
    setShowAnalysis(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-journal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          mood: currentMood,
          userId: user.id,
          journalEntryId: activeEntry?.id,
          moodEntryId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data.insight_text || 'Analysis complete.');
      } else {
        setAnalysisResult('Unable to analyze at this time. Please try again later.');
      }
    } catch {
      setAnalysisResult('Your entry has been saved. AI analysis will be available shortly.');
    }
    setAnalyzing(false);
  }

  function newEntry() {
    setActiveEntry(null);
    setTitle('');
    setContent('');
    setAnalysisResult(null);
    setShowAnalysis(false);
    setStep('mood');
    setCurrentMood(null);
    setMoodEntryId(null);
  }

  function loadEntry(entry: JournalEntry) {
    setActiveEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setStep('write');
    setShowEntries(false);
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="page-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Journal</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={newEntry}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-colors"
              style={{ background: 'rgba(0,178,178,0.1)', border: '1px solid rgba(0,178,178,0.2)', color: '#4dcaca' }}>
              <Plus size={12} /> New entry
            </button>
            <button
              onClick={() => setShowEntries(!showEntries)}
              className="btn-ghost flex items-center gap-2 text-xs py-2"
            >
              <BookOpen size={13} />
              Past entries
              {showEntries ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Today's mood timeline */}
        {todayMoods.length > 0 && (
          <div className="mb-6 card">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={12} style={{ color: '#4dcaca' }} />
              <span className="text-xs font-medium" style={{ color: '#4dcaca' }}>Today's emotional journey</span>
              <span className="text-[10px] text-white/30 ml-auto">{todayMoods.length} mood{todayMoods.length !== 1 ? 's' : ''} logged</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {todayMoods.map((m, i) => {
                const cfg = moodConfig[m.mood];
                const time = new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                  <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                    {i > 0 && <div className="w-4 h-px bg-white/10" />}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}25` }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                      <span className="text-[10px] font-medium capitalize" style={{ color: cfg.color }}>{m.mood}</span>
                      <span className="text-[10px] text-white/25">{m.intensity}</span>
                      <span className="text-[9px] text-white/20">{time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily analysis banner */}
        {dailyAnalysis && step === 'write' && (
          <div className="mb-6 card relative"
            style={{ background: 'rgba(0,178,178,0.05)', border: '1px solid rgba(0,178,178,0.15)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} style={{ color: '#4dcaca' }} />
              <span className="text-xs font-medium" style={{ color: '#4dcaca' }}>Today's AI Reflection</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{dailyAnalysis}</p>
          </div>
        )}

        {/* Past entries */}
        {showEntries && (
          <div className="mb-6 card animate-slide-down">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-white/60">Recent entries</p>
              <button onClick={newEntry} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(0,178,178,0.1)', color: '#4dcaca', border: '1px solid rgba(0,178,178,0.2)' }}>
                <Plus size={11} /> New entry
              </button>
            </div>
            {entries.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">No entries yet</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {entries.map(e => (
                  <button key={e.id} onClick={() => loadEntry(e)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 ${activeEntry?.id === e.id ? 'bg-white/5 border border-white/10' : ''}`}>
                    <div className="w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: '#4dcaca' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/70 truncate">{e.title || 'Untitled'}</p>
                      <p className="text-[10px] text-white/30 truncate">{e.content.substring(0, 50)}...</p>
                    </div>
                    <p className="text-[10px] text-white/25 flex-shrink-0">
                      {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Character style selector - persisted */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs text-white/40">Companion style:</span>
          {(['feminine', 'masculine', 'neutral'] as CharacterStyle[]).map(value => (
            <button
              key={value}
              onClick={() => persistCharacterStyle(value)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${characterStyle === value ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              style={characterStyle === value ? { background: 'rgba(0,178,178,0.15)', border: '1px solid rgba(0,178,178,0.3)', color: '#4dcaca' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>

        {/* Mood check-in step */}
        {step === 'mood' && (
          <div className="card">
            <MoodCheckIn onComplete={handleMoodComplete} characterStyle={characterStyle} />
          </div>
        )}

        {/* Journal writing step */}
        {step === 'write' && (
          <div className="space-y-4 animate-fade-in">
            {currentMood && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: `${moodConfig[currentMood].color}10`,
                  border: `1px solid ${moodConfig[currentMood].color}20`,
                }}>
                <div className="w-2 h-2 rounded-full" style={{ background: moodConfig[currentMood].color }} />
                <span className="text-xs font-medium capitalize" style={{ color: moodConfig[currentMood].color }}>
                  {moodConfig[currentMood].label}
                </span>
                <span className="text-[10px] text-white/25">Current mood</span>
              </div>
            )}

            <div className="card">
              <input
                type="text"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Give this entry a title..."
                className="w-full text-lg font-semibold bg-transparent border-none outline-none text-white placeholder-white/25"
              />
            </div>

            <div className="card relative">
              <textarea
                value={content}
                onChange={e => handleContentChange(e.target.value)}
                placeholder="Begin writing your thoughts... Let yourself flow without judgment. This space is entirely yours."
                rows={12}
                className="w-full bg-transparent border-none outline-none text-sm text-white/80 placeholder-white/20 resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-subtle">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/25">{wordCount} words</span>
                  {saving && (
                    <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                      <Loader size={10} className="animate-spin" />
                      Saving...
                    </div>
                  )}
                  {!saving && content && (
                    <span className="text-[10px] text-white/25">Auto-saved</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={analyzeEntry}
                    disabled={!content.trim() || analyzing}
                    className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-40"
                    style={{ background: 'rgba(0,178,178,0.1)', border: '1px solid rgba(0,178,178,0.2)', color: '#4dcaca' }}
                  >
                    {analyzing ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {analyzing ? 'Analyzing...' : 'AI Analysis'}
                  </button>

                  <button
                    onClick={saveEntry}
                    disabled={!content.trim() || saving}
                    className="btn-primary flex items-center gap-1.5 text-xs py-2 disabled:opacity-40"
                  >
                    <Save size={12} />
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* AI Analysis result */}
            {showAnalysis && (
              <div className="card animate-slide-up relative"
                style={{ background: 'rgba(0,178,178,0.05)', border: '1px solid rgba(0,178,178,0.18)' }}>
                <button onClick={() => setShowAnalysis(false)} className="absolute top-4 right-4 text-white/30 hover:text-white/60">
                  <X size={14} />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={13} style={{ color: '#4dcaca' }} />
                  <span className="text-xs font-medium" style={{ color: '#4dcaca' }}>AI Reflection</span>
                </div>
                {analyzing ? (
                  <div className="flex flex-col items-center py-6">
                    <div className="w-8 h-8 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin mb-3" />
                    <p className="text-xs text-white/40">Analyzing your entry with emotional intelligence...</p>
                  </div>
                ) : (
                  <p className="text-sm text-white/70 leading-relaxed">{analysisResult}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
