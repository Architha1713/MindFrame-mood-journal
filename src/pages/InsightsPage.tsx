import { useEffect, useState } from 'react';
import { Sparkles, Brain, TrendingUp, AlertTriangle, Heart, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, AiInsight } from '../lib/supabase';

const insightIcons: Record<string, React.FC<{ size?: number; style?: React.CSSProperties }>> = {
  reflection: Sparkles,
  pattern: TrendingUp,
  weekly_summary: Brain,
  burnout_warning: AlertTriangle,
  encouragement: Heart,
};

const insightColors: Record<string, string> = {
  reflection: '#00b2b2',
  pattern: '#00ccff',
  weekly_summary: '#4dcaca',
  burnout_warning: '#f8961e',
  encouragement: '#43aa8b',
};

function InsightCard({ insight }: { insight: AiInsight }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = insightIcons[insight.insight_type] || Sparkles;
  const color = insightColors[insight.insight_type] || '#00b2b2';

  return (
    <div className="card transition-all duration-300 hover:border-white/10"
      style={{ borderColor: `${color}20` }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={15} style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold capitalize" style={{ color }}>
              {insight.insight_type.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-2">
              {insight.wellness_score && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                  style={{ background: `${color}15`, border: `1px solid ${color}25`, color }}>
                  {insight.wellness_score}/10
                </div>
              )}
              <span className="text-[10px] text-white/25">
                {new Date(insight.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <p className={`text-sm text-white/65 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
            {insight.insight_text}
          </p>

          {insight.primary_emotions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {insight.primary_emotions.map(e => (
                <span key={e} className="px-2 py-0.5 rounded-full text-[10px] capitalize"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {e}
                </span>
              ))}
            </div>
          )}

          {insight.recommendations?.length > 0 && expanded && (
            <div className="mt-4 pt-4 border-t border-subtle">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Recommendations</p>
              <ul className="space-y-2">
                {insight.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/55">
                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(insight.insight_text.length > 200 || insight.recommendations?.length > 0) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-[10px] transition-colors"
              style={{ color: `${color}80` }}
            >
              {expanded ? <><ChevronUp size={11} /> Show less</> : <><ChevronDown size={11} /> Show more</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    if (!user) return;
    const { data } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setInsights(data || []);
    setLoading(false);
  }

  async function generateWeeklySummary() {
    if (!user) return;
    setGenerating(true);

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
          userId: user.id,
          insightType: 'weekly_summary',
        }),
      });

      if (response.ok) {
        await loadInsights();
      }
    } catch {
      // silently fail
    }
    setGenerating(false);
  }

  const filteredInsights = filter === 'all' ? insights : insights.filter(i => i.insight_type === filter);

  const avgWellness = insights.length
    ? (insights.reduce((s, i) => s + i.wellness_score, 0) / insights.length).toFixed(1)
    : null;

  const typeLabels: Record<string, string> = {
    reflection: 'Reflections',
    pattern: 'Patterns',
    weekly_summary: 'Summaries',
    burnout_warning: 'Warnings',
    encouragement: 'Encouragement',
  };

  return (
    <div className="page-bg min-h-screen p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">AI Insights</h1>
          <p className="text-xs text-white/40 mt-0.5">Your personalized emotional intelligence feed</p>
        </div>

        <button
          onClick={generateWeeklySummary}
          disabled={generating}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
        >
          {generating ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Generating...' : 'Weekly summary'}
        </button>
      </div>

      {/* Summary bar */}
      {insights.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gradient">{insights.length}</p>
            <p className="text-xs text-white/40 mt-0.5">Total insights</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-white">{avgWellness || '—'}</p>
            <p className="text-xs text-white/40 mt-0.5">Avg wellness score</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold" style={{ color: '#f8961e' }}>
              {insights.filter(i => i.insight_type === 'burnout_warning').length}
            </p>
            <p className="text-xs text-white/40 mt-0.5">Burnout alerts</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold" style={{ color: '#43aa8b' }}>
              {insights.filter(i => i.insight_type === 'encouragement').length}
            </p>
            <p className="text-xs text-white/40 mt-0.5">Encouragements</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={filter === 'all' ? { background: 'rgba(0,178,178,0.15)', border: '1px solid rgba(0,178,178,0.3)', color: '#4dcaca' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
        >
          All ({insights.length})
        </button>
        {Object.entries(typeLabels).map(([type, label]) => {
          const count = insights.filter(i => i.insight_type === type).length;
          if (count === 0) return null;
          const color = insightColors[type];
          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={filter === type
                ? { background: `${color}18`, border: `1px solid ${color}35`, color }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-breathe"
            style={{ background: 'rgba(0,178,178,0.08)', border: '1px solid rgba(0,178,178,0.15)' }}>
            <Brain size={28} style={{ color: '#4dcaca' }} />
          </div>
          <p className="text-white/50 font-medium mb-2">
            {filter === 'all' ? 'No insights yet' : `No ${typeLabels[filter]?.toLowerCase()} yet`}
          </p>
          <p className="text-xs text-white/30 max-w-sm leading-relaxed">
            Write journal entries and use the AI Analysis feature to generate personalized emotional insights.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInsights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
