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

function calculateWellnessScore(text: string, mood?: string, emotions?: string[]): number {
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

  return Math.max(1, Math.min(10, score));
}

function generateInsight(content: string, mood: string | undefined, emotions: string[], insightType: string): {
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

    const emotions = detectEmotions(content);
    const wellnessScore = calculateWellnessScore(content, mood, emotions);
    const { insight_text, recommendations, emotional_tone } = generateInsight(content, mood, emotions, insightType);

    const { data: insight, error } = await supabase
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
