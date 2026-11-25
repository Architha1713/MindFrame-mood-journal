import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Restrict CORS to the app's origin. The ALLOWED_ORIGINS env var should be set
// to the deployed app origin (e.g. https://mindframe.bolt.app). In development
// we fall back to localhost origins so local testing still works.
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") || "";
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];

function corsHeaders(origin: string | null) {
  const allowed =
    (APP_ORIGIN && origin === APP_ORIGIN) ||
    (origin && DEV_ORIGINS.includes(origin));
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Vary": "Origin",
  };
}

interface AnalyzeRequest {
  content?: string;
  mood?: string;
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

// ---------- Crisis detection ----------
// Word-boundary matching for self-harm / severe distress phrases. Detection is
// NOT guaranteed — this is a best-effort keyword check, not a clinical tool.
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill\s+myself\b/i,
  /\bend\s+my\s+life\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bself[\s-]?harm\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bcan'?t\s+go\s+on\b/i,
  /\bbetter\s+off\s+dead\b/i,
  /\bnot\s+worth\s+living\b/i,
  /\bend\s+it\s+all\b/i,
  /\bsuicid/i,
  /\btake\s+my\s+own\s+life\b/i,
];

function isCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

function crisisResponse() {
  return {
    crisis: true as const,
    insight_text:
      "What you're describing sounds really heavy, and you don't have to carry it alone. " +
      "Please consider reaching out to someone you trust right now — a friend, family member, or a helpline. " +
      "If you are in immediate danger, contact your local emergency services. " +
      "Helpline (India): Tele-MANAS 14416. Please verify the number for your region. " +
      "Note: this message is triggered by keyword matching and detection is not guaranteed.",
    recommendations: [
      "Contact someone you trust and let them know what you're going through",
      "Tele-MANAS (India): 14416 — please verify the helpline for your region",
      "If you are in immediate danger, contact local emergency services",
    ],
    emotional_tone: "distressed",
    primary_emotions: ["distress"],
    wellness_score: null,
    resources: [
      { label: "Tele-MANAS India", number: "14416" },
      { label: "Local emergency services", number: "Verify for your region" },
    ],
  };
}

// ---------- Emotion detection with word-boundary + negation ----------
const emotionKeywords: Record<string, string[]> = {
  joy: ["happy", "excited", "grateful", "great", "wonderful", "amazing", "love", "joyful", "thrilled", "content", "pleased", "delighted"],
  sadness: ["sad", "crying", "depressed", "lonely", "lost", "grief", "heartbroken", "down", "blue", "unhappy", "disappointed", "miss"],
  anxiety: ["anxious", "worried", "nervous", "scared", "fear", "panic", "stress", "overwhelm", "dread", "tense", "uneasy", "apprehensive"],
  anger: ["angry", "frustrated", "mad", "upset", "annoyed", "irritated", "furious", "rage", "resentful", "agitated"],
  calm: ["peaceful", "calm", "serene", "relaxed", "tranquil", "centered", "grounded", "still", "balanced"],
  fatigue: ["tired", "exhausted", "drained", "weary", "sleepy", "depleted", "fatigued"],
  hope: ["hopeful", "optimistic", "better", "improve", "forward", "growth", "progress", "possibility", "future"],
  resilience: ["strong", "resilient", "overcome", "cope", "manage", "handle", "determined", "persist", "despite"],
};

const negationWords = ["not", "no", "never", "without", "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't", "can't", "cannot", "couldn't", "won't", "wouldn't"];

function wordBoundaryMatch(text: string, keyword: string): { match: boolean; negated: boolean } {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "gi");
  const matches = [...text.matchAll(pattern)];
  if (matches.length === 0) return { match: false, negated: false };
  let negated = false;
  for (const m of matches) {
    const startIdx = m.index ?? 0;
    const before = text.slice(Math.max(0, startIdx - 30), startIdx).toLowerCase();
    const window = before.split(/[^a-z']+/).slice(-3);
    if (window.some((w) => negationWords.includes(w))) {
      negated = true;
    }
  }
  return { match: true, negated };
}

function detectEmotions(text: string): { emotions: string[]; negated: string[] } {
  const lowerText = text.toLowerCase();
  const detected: string[] = [];
  const negated: string[] = [];
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    let found = false;
    let isNegated = false;
    for (const kw of keywords) {
      const { match, negated: neg } = wordBoundaryMatch(lowerText, kw);
      if (match) {
        found = true;
        if (neg) isNegated = true;
      }
    }
    if (found) {
      if (isNegated && !detected.includes(emotion)) {
        negated.push(emotion);
      } else if (!isNegated) {
        detected.push(emotion);
      }
    }
  }
  return { emotions: detected.length > 0 ? detected.slice(0, 4) : ["reflective"], negated };
}

function calculateMoodScore(text: string, mood: string | undefined, emotions: string[], negated: string[], moodHistory?: MoodRecord[]): number {
  let score = 5;
  const positiveIndicators = ["grateful", "happy", "excited", "calm", "peaceful", "better", "progress", "growth", "joy", "love", "content", "hopeful", "optimistic", "resilient", "strong"];
  const negativeIndicators = ["stressed", "anxious", "sad", "depressed", "overwhelmed", "tired", "exhausted", "panic", "fear", "hopeless", "struggling"];

  let positiveCount = 0;
  let negativeCount = 0;
  for (const w of positiveIndicators) {
    const { match, negated: neg } = wordBoundaryMatch(text.toLowerCase(), w);
    if (match) {
      if (neg) negativeCount++;
      else positiveCount++;
    }
  }
  for (const w of negativeIndicators) {
    const { match, negated: neg } = wordBoundaryMatch(text.toLowerCase(), w);
    if (match) {
      if (neg) positiveCount++;
      else negativeCount++;
    }
  }

  if (mood === "happy" || mood === "excited" || mood === "calm") score += 2;
  if (mood === "stressed" || mood === "overwhelmed" || mood === "anxious") score -= 2;
  if (mood === "sad") score -= 1;
  if (mood === "tired") score -= 1;

  score += Math.min(positiveCount, 3);
  score -= Math.min(negativeCount, 3);

  if ((emotions.includes("resilience") || emotions.includes("hope")) && !negated.includes("resilience")) score += 1;
  if ((emotions.includes("joy") || emotions.includes("calm")) && !negated.includes("joy")) score += 1;

  if (moodHistory && moodHistory.length > 0) {
    const positiveMoods = moodHistory.filter((m) => ["happy", "calm", "excited"].includes(m.mood)).length;
    const ratio = positiveMoods / moodHistory.length;
    score = score * 0.6 + (ratio * 8 + 1) * 0.4;
  }

  return Math.max(1, Math.min(10, Math.round(score)));
}

function aggregateMoodInsight(moodHistory: MoodRecord[]) {
  if (moodHistory.length === 0) {
    return { dominantMood: "reflective", moodShifts: [] as string[], averageIntensity: 5, moodSummary: "" };
  }
  const moodCounts: Record<string, number> = {};
  moodHistory.forEach((m) => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1; });
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
  const moodShifts: string[] = [];
  for (let i = 1; i < moodHistory.length; i++) {
    if (moodHistory[i].mood !== moodHistory[i - 1].mood) {
      moodShifts.push(`${moodHistory[i - 1].mood} to ${moodHistory[i].mood}`);
    }
  }
  const averageIntensity = Math.round((moodHistory.reduce((sum, m) => sum + m.intensity, 0) / moodHistory.length) * 10) / 10;
  const uniqueMoods = [...new Set(moodHistory.map((m) => m.mood))];
  const moodSummary = uniqueMoods.length === 1
    ? `You logged ${uniqueMoods[0]} consistently today.`
    : `Your mood entries span ${uniqueMoods.length} states today: ${uniqueMoods.join(", ")}.`;
  return { dominantMood, moodShifts, averageIntensity, moodSummary };
}

// ---------- Reflection templates (cautious wording, two tones) ----------
type Tone = "neutral" | "warm";

function generateInsight(
  content: string,
  mood: string | undefined,
  emotions: string[],
  negated: string[],
  insightType: string,
  tone: Tone,
  moodHistory?: MoodRecord[],
) {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const hasReflection = emotions.includes("reflective") || emotions.includes("resilience");
  const hasAnxiety = emotions.includes("anxiety");
  const hasSadness = emotions.includes("sadness");
  const hasJoy = emotions.includes("joy");
  const hasFatigue = emotions.includes("fatigue");
  const hasCalmness = emotions.includes("calm");
  const hasHope = emotions.includes("hope");

  const toneLabel = tone === "warm" ? "warm and supportive" : "neutral and analytical";

  const tones: Record<string, string> = {
    anxiety: "associated with tension and worry",
    sadness: "associated with low mood",
    joy: "associated with positive affect",
    calm: "associated with calm",
    fatigue: "associated with tiredness",
    hope: "associated with forward-looking words",
    resilience: "associated with coping language",
    reflective: "associated with reflective words",
  };
  const emotional_tone = emotions.length > 0 ? (tones[emotions[0]] || "associated with reflective words") : "associated with reflective words";

  // Daily summary
  if (insightType === "daily_summary" && moodHistory && moodHistory.length > 0) {
    const { dominantMood, moodShifts, averageIntensity, moodSummary } = aggregateMoodInsight(moodHistory);
    const positiveMoods = moodHistory.filter((m) => ["happy", "calm", "excited"].includes(m.mood)).length;
    const negativeMoods = moodHistory.filter((m) => ["stressed", "anxious", "sad", "overwhelmed"].includes(m.mood)).length;
    const isOverallPositive = positiveMoods >= negativeMoods;

    const negatedNote = negated.length > 0 ? ` (Note: your entry also includes words such as "not ${negated[0]}", which the rules do not count toward that emotion.)` : "";

    if (moodHistory.length === 1) {
      insight_text = tone === "warm"
        ? `Today you logged one mood check-in — ${moodHistory[0].mood} at intensity ${moodHistory[0].intensity}. ${isOverallPositive ? "That is a gentle, positive starting point." : "It takes courage to name where you are emotionally."} ${content ? `Your entry includes words associated with ${emotions.slice(0, 2).join(" and ")}.${negatedNote}` : ""} (Automated reflection; not a therapist or medical advice.)`
        : `One mood entry today: ${moodHistory[0].mood}, intensity ${moodHistory[0].intensity}/10. ${content ? `Detected word associations: ${emotions.slice(0, 2).join(", ")}.${negatedNote}` : ""} (Automated reflection; keyword-based, not clinical advice.)`;
    } else if (moodShifts.length === 0) {
      insight_text = tone === "warm"
        ? `${moodSummary} This consistency may suggest a steady emotional state around "${dominantMood}", average intensity ${averageIntensity}/10. ${isOverallPositive ? "It is okay to appreciate a steady positive day." : "A steady low state is worth noticing; small shifts are still possible."} ${content ? `Your entry includes words associated with ${emotions.slice(0, 2).join(" and ")}.${negatedNote}` : ""} (Automated reflection; not a therapist or medical advice.)`
        : `${moodSummary} No mood shifts across entries; dominant "${dominantMood}", average intensity ${averageIntensity}/10. ${content ? `Word associations: ${emotions.slice(0, 2).join(", ")}.${negatedNote}` : ""} (Automated reflection; keyword-based, not clinical advice.)`;
    } else {
      insight_text = tone === "warm"
        ? `${moodSummary} Your entries show ${moodShifts.length} shift${moodShifts.length > 1 ? "s" : ""} (${moodShifts.slice(0, 3).join(", ")}), average intensity ${averageIntensity}/10. ${isOverallPositive ? "Even through shifts, the overall pattern leans positive." : "Mood fluctuations are common; tracking them is a helpful first step."} ${content ? `Your entry includes words associated with ${emotions.slice(0, 2).join(" and ")}.${negatedNote}` : ""} (Automated reflection; not a therapist or medical advice.)`
        : `${moodSummary} ${moodShifts.length} shift${moodShifts.length > 1 ? "s" : ""} recorded (${moodShifts.slice(0, 3).join(", ")}), average intensity ${averageIntensity}/10. ${content ? `Word associations: ${emotions.slice(0, 2).join(", ")}.${negatedNote}` : ""} (Automated reflection; keyword-based, not clinical advice.)`;
    }

    recommendations = isOverallPositive
      ? [
          "Consider noting what was present during positive mood entries — these are observations, not conclusions",
          "If helpful, record what may have contributed to today's pattern in your next entry",
          "Sharing your reflection practice with someone you trust can complement it",
        ]
      : [
          "Consider identifying the strongest feeling from today and one small, optional action",
          "Brief breathing or gentle movement may help shift an emotional state",
          "Checking in at different times of day can build a fuller picture over time",
        ];

    return { insight_text, recommendations, emotional_tone };
  }

  let insight_text = "";
  let recommendations: string[] = [];

  const suffix = " (Automated reflection; it uses simple keyword rules, not a therapist or medical advice, and can misread your entries.)";

  if (insightType === "weekly_summary") {
    insight_text = tone === "warm"
      ? `Your entries this week include words associated with ${emotions.slice(0, 2).join(" and ") || "reflection"}. Showing up to write regularly takes care and courage. These reflections are observations from keyword matching, not a professional assessment.${suffix}`
      : `Summary of this week's entries: word associations include ${emotions.slice(0, 2).join(", ") || "reflective"}. ${wordCount} words analyzed. This is a keyword-based summary, not a clinical assessment.${suffix}`;
    recommendations = [
      "A brief morning check-in can help set an intention for the day",
      "Recurring words across entries may point to themes worth noticing",
      "Consistency in reflection is worth acknowledging",
    ];
  } else if (insightType === "burnout_warning") {
    insight_text = tone === "warm"
      ? `Your recent entries and mood patterns include words associated with fatigue and stress. This may be a signal worth paying attention to. These keyword-based observations are not a diagnosis; if this resonates, consider being gentle with your expectations and resting when you can.${suffix}`
      : `Pattern: recent entries show word associations with fatigue/stress and a lower estimated mood score. This is a keyword-based estimate, not a diagnosis. If consistent, consider reducing load and prioritizing rest.${suffix}`;
    recommendations = [
      "Consider whether one commitment could be paused or delegated",
      "Prioritizing sleep may be more useful than pushing through",
      "A brief body-scan or rest practice may help you notice tension",
    ];
  } else if (insightType === "encouragement") {
    insight_text = tone === "warm"
      ? `Choosing to reflect and write takes courage. The act of naming your experience can be meaningful on its own. Your entry includes words associated with ${emotions.slice(0, 2).join(" and ") || "reflection"}. This is an observation from keyword matching, not a professional judgment.${suffix}`
      : `Observation: your entry includes words associated with ${emotions.slice(0, 2).join(" and ") || "reflection"}. Regular reflection is a consistent practice. This is keyword-based, not an assessment.${suffix}`;
    recommendations = [
      "Consider acknowledging one strength you noticed this week",
      "Sharing your practice with someone you trust can complement it",
      "Noting what restores your energy may be useful for future reference",
    ];
  } else if (hasAnxiety) {
    insight_text = tone === "warm"
      ? `Your entry includes words associated with anxiety and worry. It can be hard to sit with those feelings; noticing them is a meaningful step. The rules detected these associations from keywords and may misread your meaning.${suffix}`
      : `Word associations: anxiety/worry. Your ${wordCount}-word entry was matched against keyword lists; this is not a clinical reading.${suffix}`;
    recommendations = [
      "A grounding exercise (e.g. naming 5 things you can see) is an option some find helpful",
      "Consider whether this relates to a specific situation or a more general state",
      "Noting the best and worst possible outcomes can sometimes contextualize a worry",
    ];
  } else if (hasSadness) {
    insight_text = tone === "warm"
      ? `Your entry includes words associated with sadness. Sadness can reflect caring deeply about something. These are keyword associations, not an assessment of how you are actually doing.${suffix}`
      : `Word associations: sadness/low mood. Detected via keyword matching; not a clinical assessment.${suffix}`;
    recommendations = [
      "Brief, intentional windows to feel — rather than pushing feelings away — are an option",
      "If it would help, consider reaching out to someone who feels safe",
      "Gentle sensory activities (warm tea, soft music) are worth trying",
    ];
  } else if (hasJoy || hasCalmness) {
    insight_text = tone === "warm"
      ? `Your entry includes words associated with ${hasJoy ? "joy" : "calm"}. It can be worth noticing what surrounds those feelings. These are keyword associations, not a measure of your actual state.${suffix}`
      : `Word associations: ${hasJoy ? "positive affect" : "calm"}. Keyword-based; not an assessment.${suffix}`;
    recommendations = [
      "Consider documenting what may have contributed to this state",
      "This may be a good time for something creative or challenging — only if it feels right",
      "Sharing positive energy with someone is an option",
    ];
  } else if (hasFatigue) {
    insight_text = tone === "warm"
      ? `Your entry includes words associated with tiredness and fatigue. There can be wisdom in recognizing this rather than pushing through. This is a keyword-based observation, not a judgment about what you should do.${suffix}`
      : `Word associations: fatigue/tiredness. Keyword-based detection; not a clinical assessment.${suffix}`;
    recommendations = [
      "Consider auditing energy drains and whether one can be reduced",
      "Prioritizing sleep hygiene tonight is an option",
      "Even a few minutes of genuine rest can help",
    ];
  } else if (hasHope || hasReflection) {
    insight_text = tone === "warm"
      ? `Your entry includes words associated with ${hasHope ? "hope and forward-looking language" : "reflection"}. This kind of engagement with your experience can be meaningful. These are keyword observations, not a professional reading.${suffix}`
      : `Word associations: ${hasHope ? "hope" : "reflection"}. Keyword-based; not an assessment.${suffix}`;
    recommendations = [
      "Consider capturing any specific realization in a dedicated notes section",
      "One small, concrete intention aligned with this energy is an option",
      "Continuing the practice consistently may build a fuller picture over time",
    ];
  } else {
    insight_text = tone === "warm"
      ? `Your entry includes words associated with reflective thinking. Even when emotions feel mixed or unclear, writing can be a useful practice. These are keyword observations, not a measure of your actual wellbeing.${suffix}`
      : `Word associations: reflective thinking. ${wordCount} words analyzed via keyword matching; no strong emotion clusters detected. Not an assessment.${suffix}`;
    recommendations = [
      "Sitting quietly for a few minutes after writing and noticing what arises is an option",
      "Looking for recurring themes across recent entries can be useful",
      "Asking yourself what you would tell a friend in the same situation is a reflection prompt",
    ];
  }

  return { insight_text, recommendations, emotional_tone };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  try {
    // ---- Verify JWT from Authorization header ----
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use the user's JWT to identify them — NOT a userId from the body.
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    const userId = user.id; // derived from JWT, body userId is ignored

    // Service-role client for DB writes
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the user's profile to read tone preference
    const { data: profile } = await admin
      .from("profiles")
      .select("reflection_tone")
      .eq("id", userId)
      .maybeSingle();
    const tone: Tone = profile?.reflection_tone === "neutral" ? "neutral" : "warm";

    const body: AnalyzeRequest = await req.json();
    const { content = "", mood, journalEntryId, moodEntryId, insightType = "reflection" } = body;

    // ---- Crisis check BEFORE any normal insight/score ----
    if (isCrisis(content)) {
      const crisis = crisisResponse();
      // Still record a flagged insight so the user can see the supportive
      // message in their feed, but with NO score or analytics.
      const { data: created } = await admin
        .from("ai_insights")
        .insert({
          user_id: userId,
          journal_entry_id: journalEntryId || null,
          mood_entry_id: moodEntryId || null,
          insight_type: "reflection",
          emotional_tone: crisis.emotional_tone,
          primary_emotions: crisis.primary_emotions,
          insight_text: crisis.insight_text,
          recommendations: crisis.recommendations,
          wellness_score: null,
        })
        .select()
        .single();
      return new Response(JSON.stringify({ ...crisis, insight: created }), {
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // Fetch today's moods for daily summary
    let moodHistory: MoodRecord[] = [];
    if (insightType === "daily_summary") {
      const today = new Date().toISOString().split("T")[0];
      const { data: todayMoods } = await admin
        .from("mood_entries")
        .select("mood, intensity, note, created_at")
        .eq("user_id", userId)
        .eq("entry_date", today)
        .order("created_at", { ascending: true });
      moodHistory = (todayMoods as MoodRecord[]) || [];
    }

    const { emotions, negated } = detectEmotions(content);
    const moodScore = calculateMoodScore(content, mood, emotions, negated, insightType === "daily_summary" ? moodHistory : undefined);
    const { insight_text, recommendations, emotional_tone } = generateInsight(content, mood, emotions, negated, insightType, tone, moodHistory);

    let insight;
    if (insightType === "daily_summary") {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await admin
        .from("ai_insights")
        .select("id")
        .eq("user_id", userId)
        .eq("insight_type", "daily_summary")
        .gte("created_at", today)
        .maybeSingle();

      if (existing) {
        const { data: updated, error } = await admin
          .from("ai_insights")
          .update({
            journal_entry_id: journalEntryId || null,
            mood_entry_id: moodEntryId || null,
            emotional_tone,
            primary_emotions: emotions,
            insight_text,
            recommendations,
            wellness_score: moodScore,
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) {
          return new Response(JSON.stringify({ error: "Failed to update reflection" }), {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }
        insight = updated;
      } else {
        const { data: created, error } = await admin
          .from("ai_insights")
          .insert({
            user_id: userId,
            journal_entry_id: journalEntryId || null,
            mood_entry_id: moodEntryId || null,
            insight_type: insightType,
            emotional_tone,
            primary_emotions: emotions,
            insight_text,
            recommendations,
            wellness_score: moodScore,
          })
          .select()
          .single();
        if (error) {
          return new Response(JSON.stringify({ error: "Failed to save reflection" }), {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }
        insight = created;
      }
    } else {
      const { data: created, error } = await admin
        .from("ai_insights")
        .insert({
          user_id: userId,
          journal_entry_id: journalEntryId || null,
          mood_entry_id: moodEntryId || null,
          insight_type: insightType,
          emotional_tone,
          primary_emotions: emotions,
          insight_text,
          recommendations,
          wellness_score: moodScore,
        })
        .select()
        .single();
      if (error) {
        return new Response(JSON.stringify({ error: "Failed to save reflection" }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
      insight = created;
    }

    return new Response(JSON.stringify(insight), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    const origin = req.headers.get("Origin");
    const headers = corsHeaders(origin);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
