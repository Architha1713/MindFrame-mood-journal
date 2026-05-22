import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  content?: string;
  mood?: string;
  userId: string;
  journalEntryId?: string;
  moodEntryId?: string;
  insightType?: string;
}

interface MoodRecord {
  mood: string;
  intensity: number;
  note: string;
  created_at: string;
}

function detectEmotions(text: string): string[] {
  const emotionKeywords: Record<string, string[]> = {
    joy: ['happy', 'excited', 'grateful', 'great', 'wonderful', 'amazing', 'love', 'joyful', 'thrilled', 'content', 'pleased', 'delighted'],
    sadness: ['sad', 'crying', 'depressed', 'lonely', 'miss', 'lost', 'grief', 'heartbroken', 'down', 'blue', 'unhappy', 'disappointed'],
    anxiety: ['anxious', 'worried', 'nervous', 'scared', 'fear', 'panic', 'stress', 'overwhelm', 'dread', 'tense', 'uneasy', 'apprehensive'],
    anger: ['angry', 'frustrated', 'mad', 'upset', 'annoyed', 'irritated', 'furious', 'rage', 'resentful', 'agitated'],
    calm: ['peaceful', 'calm', 'serene', 'relaxed', 'tranquil', 'centered', 'grounded', 'still', 'balanced', 'at ease'],
    fatigue: ['tired', 'exhausted', 'drained', 'weary', 'sleepy', 'burned out', 'depleted', 'fatigued', 'worn out'],
    hope: ['hopeful', 'optimistic', 'better', 'improve', 'forward', 'growth', 'progress', 'possibility', 'future', 'looking forward'],
    resilience: ['strong', 'resilient', 'overcome', 'cope', 'manage', 'handle', 'power through', 'determined', 'persist', 'despite'],
  };

  const lowerText = text.toLowerCase();
  const detected: string[] = [];

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      detected.push(emotion);
    }
  }

  return detected.length > 0 ? detected.slice(0, 4) : ['reflective'];
}

function calculateWellnessScore(text: string, mood?: string, emotions?: string[], moodHistory?: MoodRecord[]): number {
  let score = 5;

  const positiveIndicators = ['grateful', 'happy', 'excited', 'calm', 'peaceful', 'better', 'progress', 'growth', 'joy', 'love', 'content', 'hopeful', 'optimistic', 'resilient', 'strong'];
  const negativeIndicators = ['stressed', 'anxious', 'sad', 'depressed', 'overwhelmed', 'tired', 'exhausted', 'panic', 'fear', 'hopeless', 'burned out', 'struggling'];

  const lowerText = text.toLowerCase();
  let positiveCount = positiveIndicators.filter(w => lowerText.includes(w)).length;
  let negativeCount = negativeIndicators.filter(w => lowerText.includes(w)).length;

  if (mood === 'happy' || mood === 'excited' || mood === 'calm') score += 2;
  if (mood === 'stressed' || mood === 'overwhelmed' || mood === 'anxious') score -= 2;
  if (mood === 'sad') score -= 1;
  if (mood === 'tired') score -= 1;

  score += Math.min(positiveCount, 3);
  score -= Math.min(negativeCount, 3);

  if (emotions?.includes('resilience') || emotions?.includes('hope')) score += 1;
  if (emotions?.includes('joy') || emotions?.includes('calm')) score += 1;

  // Factor in mood history for daily summary
  if (moodHistory && moodHistory.length > 0) {
    const avgIntensity = moodHistory.reduce((sum, m) => sum + m.intensity, 0) / moodHistory.length;
    const positiveMoods = moodHistory.filter(m => ['happy', 'calm', 'excited'].includes(m.mood)).length;
    const negativeMoods = moodHistory.filter(m => ['stressed', 'anxious', 'sad', 'overwhelmed'].includes(m.mood)).length;
    const ratio = positiveMoods / moodHistory.length;
    score = score * 0.6 + (ratio * 8 + 1) * 0.4;
  }

  return Math.max(1, Math.min(10, Math.round(score)));
}

function aggregateMoodInsight(moodHistory: MoodRecord[]): {
  dominantMood: string;
  moodShifts: string[];
  averageIntensity: number;
  moodSummary: string;
} {
  if (moodHistory.length === 0) {
    return { dominantMood: 'reflective', moodShifts: [], averageIntensity: 5, moodSummary: '' };
  }

  // Count mood occurrences
  const moodCounts: Record<string, number> = {};
  moodHistory.forEach(m => {
    moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
  });
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Detect mood shifts
  const moodShifts: string[] = [];
  for (let i = 1; i < moodHistory.length; i++) {
    if (moodHistory[i].mood !== moodHistory[i - 1].mood) {
      moodShifts.push(`${moodHistory[i - 1].mood} to ${moodHistory[i].mood}`);
    }
  }

  const averageIntensity = Math.round(moodHistory.reduce((sum, m) => sum + m.intensity, 0) / moodHistory.length * 10) / 10;

  // Build summary
  const uniqueMoods = [...new Set(moodHistory.map(m => m.mood))];
  const moodSummary = uniqueMoods.length === 1
    ? `You felt ${uniqueMoods[0]} consistently throughout the day.`
    : `Your emotional landscape shifted through ${uniqueMoods.length} states today: ${uniqueMoods.join(', ')}.`;

  return { dominantMood, moodShifts, averageIntensity, moodSummary };
}

function generateInsight(content: string, mood: string | undefined, emotions: string[], insightType: string, moodHistory?: MoodRecord[]): {
  insight_text: string;
  recommendations: string[];
  emotional_tone: string;
} {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const hasReflection = emotions.includes('reflective') || emotions.includes('resilience');
  const hasAnxiety = emotions.includes('anxiety');
  const hasSadness = emotions.includes('sadness');
  const hasJoy = emotions.includes('joy');
  const hasFatigue = emotions.includes('fatigue');
  const hasCalmness = emotions.includes('calm');
  const hasHope = emotions.includes('hope');

  const tones: Record<string, string> = {
    anxiety: 'tense and worried',
    sadness: 'melancholic and introspective',
    joy: 'bright and energetic',
    calm: 'serene and centered',
    fatigue: 'drained and heavy',
    hope: 'forward-looking and optimistic',
    resilience: 'strong and determined',
    reflective: 'thoughtful and contemplative',
  };

  const emotional_tone = emotions.length > 0 ? (tones[emotions[0]] || 'thoughtful and introspective') : 'thoughtful and introspective';

  let insight_text = '';
  let recommendations: string[] = [];

  // Daily summary: aggregate all moods of the day
  if (insightType === 'daily_summary' && moodHistory && moodHistory.length > 0) {
    const { dominantMood, moodShifts, averageIntensity, moodSummary } = aggregateMoodInsight(moodHistory);

    const positiveMoods = moodHistory.filter(m => ['happy', 'calm', 'excited'].includes(m.mood)).length;
    const negativeMoods = moodHistory.filter(m => ['stressed', 'anxious', 'sad', 'overwhelmed'].includes(m.mood)).length;
    const isOverallPositive = positiveMoods >= negativeMoods;

    if (moodHistory.length === 1) {
      insight_text = `Today you logged a single mood check-in — ${moodHistory[0].mood} at intensity ${moodHistory[0].intensity}. ${isOverallPositive ? 'This is a positive starting point for the day.' : 'It takes courage to acknowledge where you are emotionally. This awareness is the first step toward feeling better.'} As you check in throughout the day, the AI will build a richer picture of your emotional patterns. ${content ? `Your journal entry adds valuable context: it reveals ${emotions.slice(0, 2).join(' and ')} undertones in your thinking.` : ''}`;
    } else if (moodShifts.length === 0) {
      insight_text = `${moodSummary} This consistency suggests emotional stability — you remained in a ${dominantMood} state with an average intensity of ${averageIntensity}/10 throughout the day. ${isOverallPositive ? 'Staying in a positive emotional state is worth appreciating — it means something in your environment and mindset is supporting your wellbeing.' : 'While consistency can feel stagnant, it also means your emotional system has found a steady state. Small intentional shifts can gradually move this baseline.'}`;
    } else {
      insight_text = `${moodSummary} You experienced ${moodShifts.length} emotional shift${moodShifts.length > 1 ? 's' : ''} today (${moodShifts.slice(0, 3).join(', ')}), with an average intensity of ${averageIntensity}/10. ${isOverallPositive ? 'The overall trajectory leans positive — even through shifts, your emotional core remained resilient.' : 'Emotional fluctuations are a natural part of the human experience. The important thing is that you are tracking and aware of these changes.'} ${content ? `Your journal writing reveals ${emotions.slice(0, 2).join(' and ')} themes, adding depth to the mood data.` : ''}`;
    }

    recommendations = isOverallPositive
      ? [
          'Notice what activities or thoughts were present during your positive mood states — these are your wellbeing anchors',
          'Capture what specifically contributed to today\'s positive emotional pattern in your next journal entry',
          'Share your emotional awareness practice with someone you trust — it strengthens both your reflections and your connections',
        ]
      : [
          'Identify the strongest emotional trigger from today and consider one small action you can take to address it',
          'Even 5 minutes of intentional breathing or gentle movement can shift an emotional pattern',
          'Tomorrow, try checking in with your mood at different times to build a richer emotional map',
        ];

    return { insight_text, recommendations, emotional_tone };
  }

  if (insightType === 'weekly_summary') {
    insight_text = `Your emotional journey this week reflects genuine depth and self-awareness. The patterns emerging from your entries suggest a mind actively processing and navigating life's complexities. This kind of consistent self-reflection is one of the most powerful tools for emotional growth and resilience. Continue showing up for yourself through these moments of introspection — they build an invaluable inner foundation.`;
    recommendations = [
      'Schedule a brief 5-minute morning check-in to set an emotional intention for the day',
      'Notice any recurring themes in your entries — they often point to areas where growth is naturally emerging',
      'Celebrate the consistency of your reflection practice; it takes genuine courage to look inward regularly',
    ];
  } else if (insightType === 'burnout_warning') {
    insight_text = `Your recent entries and mood patterns show indicators of emotional and mental fatigue. This is an important signal from your system asking for rest and restoration. Burnout doesn't announce itself clearly — it creeps in gradually. Recognizing these early signs is powerful self-awareness in action. It's time to be gentle with your expectations and generous with your recovery.`;
    recommendations = [
      'Identify one major commitment you can temporarily step back from or delegate',
      'Prioritize sleep quality above productivity for the next 72 hours',
      'Practice a brief body-scan meditation to reconnect with physical sensations of tension',
      'Schedule one fully restorative activity with zero productivity expectations this week',
    ];
  } else if (insightType === 'encouragement') {
    insight_text = `What you're doing — choosing to reflect, to show up, to examine your inner world — takes more courage than most people realize. Every entry you write is an act of emotional bravery. The simple act of naming your experience gives it form, and in that form, you find the ability to respond rather than just react. You are building something meaningful here.`;
    recommendations = [
      'Acknowledge one genuine strength you demonstrated this week',
      'Share your reflection practice with someone you trust — vulnerability builds connection',
      'Notice what environments or activities restore your energy most effectively',
    ];
  } else if (hasAnxiety) {
    insight_text = `Your entry carries threads of anxiety and worry, which your mind is actively working to process. This is the nervous system doing its job — scanning for threats and preparing responses. What's notable is your awareness: you're observing the anxiety rather than being entirely consumed by it. That observer perspective is the beginning of regulation. The ${wordCount > 100 ? 'depth and length' : 'quality'} of your reflection suggests genuine emotional intelligence at work.`;
    recommendations = [
      'Try the 5-4-3-2-1 grounding technique: name 5 things you can see, 4 you can touch, 3 you can hear',
      'Identify whether this anxiety is about a specific situation or a more diffuse state',
      'Write down the worst and best possible outcomes of your current concern to contextualize it',
      'Consider a brief walk in nature or gentle movement to discharge anxious energy physically',
    ];
  } else if (hasSadness) {
    insight_text = `There's a quietness in your entry today — a gentleness that comes with sadness. Sadness is not weakness; it's the emotional signature of caring deeply, of valuing what has been lost or what hasn't yet arrived. Your willingness to sit with this feeling rather than escape it speaks to an emotional maturity that will serve you well. Give yourself permission to feel this fully without judgment.`;
    recommendations = [
      'Allow yourself brief, intentional "grief windows" rather than pushing feelings away or drowning in them',
      'Reach out to someone who feels safe — connection is medicine for sadness',
      'Engage in gentle, sensory activities: warm tea, soft music, natural light',
      'Journal again tomorrow — tracking the movement of emotions over days is insightful',
    ];
  } else if (hasJoy || hasCalmness) {
    insight_text = `There's genuine brightness in your entry today. ${hasJoy ? 'Joy' : 'Calm'} is a state worth savoring and studying — understanding what creates it helps you return to it more intentionally. Your emotional tone suggests a nervous system in a regulated, open state: the ideal condition for creativity, connection, and clear thinking. This is worth noting and celebrating.`;
    recommendations = [
      'Document what specifically contributed to this positive emotional state for future reference',
      'This is an excellent time to tackle something challenging or creative — your cognitive resources are high',
      'Share your positive energy with someone who might benefit from your presence today',
    ];
  } else if (hasFatigue) {
    insight_text = `Your words carry the weight of genuine tiredness today. Fatigue isn't just physical — it's your whole system asking for restoration. There's wisdom in recognizing this rather than pushing through on willpower alone. Rest is not the absence of productivity; it is the condition that makes sustainable performance possible. Honor what your body and mind are telling you.`;
    recommendations = [
      'Audit your energy drains — identify one thing you can eliminate, defer, or delegate',
      'Prioritize sleep hygiene tonight: cool room, minimal screens 1 hour before bed',
      'Even 10 minutes of genuine rest (not scrolling) can shift your nervous system state',
      'Nourish yourself with something simple and restorative today — food, movement, or stillness',
    ];
  } else if (hasHope || hasReflection) {
    insight_text = `Your entry today reflects a mind in active, healthy engagement with your own experience. The ${hasHope ? 'hope and forward orientation' : 'quality of reflection'} present in your words indicates emotional resilience and an open, growth-oriented perspective. This is precisely the mindset that drives meaningful personal development. Whatever you're working through or moving toward, you're approaching it with clarity.`;
    recommendations = [
      'Capture any specific insights or realizations from this entry in a dedicated "growth notes" section',
      'Set one small, concrete intention aligned with the positive energy you are feeling',
      'Continue this reflection practice consistently — compound returns build over weeks and months',
    ];
  } else {
    insight_text = `Your entry today carries thoughtful energy — a mind processing, questioning, and seeking understanding. This kind of reflective practice is rare and genuinely powerful. Even on days when emotions feel unclear or mixed, the act of writing creates neural pathways for emotional regulation. You're building something important here, one entry at a time. The quality of your presence to your own experience is worth acknowledging.`;
    recommendations = [
      'Sit quietly for 3 minutes after writing and notice what arises without judgment',
      'Look for one recurring pattern or theme across your recent entries',
      'Ask yourself: "What would I tell a close friend who shared exactly this experience?"',
    ];
  }

  return { insight_text, recommendations, emotional_tone };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: AnalyzeRequest = await req.json();
    const { content = '', mood, userId, journalEntryId, moodEntryId, insightType = 'reflection' } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all of today's moods for daily summary aggregation
    let moodHistory: MoodRecord[] = [];
    if (insightType === 'daily_summary') {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMoods } = await supabase
        .from('mood_entries')
        .select('mood, intensity, note, created_at')
        .eq('user_id', userId)
        .eq('entry_date', today)
        .order('created_at', { ascending: true });
      moodHistory = (todayMoods as MoodRecord[]) || [];
    }

    const emotions = detectEmotions(content);
    const wellnessScore = calculateWellnessScore(content, mood, emotions, insightType === 'daily_summary' ? moodHistory : undefined);
    const { insight_text, recommendations, emotional_tone } = generateInsight(content, mood, emotions, insightType, moodHistory);

    // For daily_summary, upsert the existing daily summary instead of creating duplicates
    let insight;

    if (insightType === 'daily_summary') {
      // Check if a daily summary already exists today
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('ai_insights')
        .select('id')
        .eq('user_id', userId)
        .eq('insight_type', 'daily_summary')
        .gte('created_at', today)
        .maybeSingle();

      if (existing) {
        // Update existing daily summary
        const { data: updated, error } = await supabase
          .from('ai_insights')
          .update({
            journal_entry_id: journalEntryId || null,
            mood_entry_id: moodEntryId || null,
            emotional_tone,
            primary_emotions: emotions,
            insight_text,
            recommendations,
            wellness_score: wellnessScore,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to update insight', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        insight = updated;
      } else {
        // Create new daily summary
        const { data: created, error } = await supabase
          .from('ai_insights')
          .insert({
            user_id: userId,
            journal_entry_id: journalEntryId || null,
            mood_entry_id: moodEntryId || null,
            insight_type: insightType,
            emotional_tone,
            primary_emotions: emotions,
            insight_text,
            recommendations,
            wellness_score: wellnessScore,
          })
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to save insight', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        insight = created;
      }
    } else {
      // Regular per-entry insight
      const { data: created, error } = await supabase
        .from('ai_insights')
        .insert({
          user_id: userId,
          journal_entry_id: journalEntryId || null,
          mood_entry_id: moodEntryId || null,
          insight_type: insightType,
          emotional_tone,
          primary_emotions: emotions,
          insight_text,
          recommendations,
          wellness_score: wellnessScore,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to save insight', details: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      insight = created;
    }

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
