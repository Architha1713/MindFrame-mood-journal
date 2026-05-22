import { MoodType, CharacterStyle } from '../lib/supabase';

interface MoodCompanionProps {
  mood: MoodType;
  style: CharacterStyle;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const moodConfig: Record<MoodType, {
  label: string;
  color: string;
  glow: string;
  bgGradient: string;
  borderColor: string;
  description: string;
}> = {
  happy: {
    label: 'Happy',
    color: '#f9c74f',
    glow: 'rgba(249, 199, 79, 0.4)',
    bgGradient: 'radial-gradient(circle, rgba(249,199,79,0.15) 0%, transparent 70%)',
    borderColor: 'rgba(249, 199, 79, 0.4)',
    description: 'Joyful & bright',
  },
  calm: {
    label: 'Calm',
    color: '#43aa8b',
    glow: 'rgba(67, 170, 139, 0.4)',
    bgGradient: 'radial-gradient(circle, rgba(67,170,139,0.15) 0%, transparent 70%)',
    borderColor: 'rgba(67, 170, 139, 0.4)',
    description: 'Peaceful & centered',
  },
  anxious: {
    label: 'Anxious',
    color: '#f8961e',
    glow: 'rgba(248, 150, 30, 0.4)',
    bgGradient: 'radial-gradient(circle, rgba(248,150,30,0.15) 0%, transparent 70%)',
    borderColor: 'rgba(248, 150, 30, 0.4)',
    description: 'Uneasy & restless',
  },
  stressed: {
    label: 'Stressed',
    color: '#f94144',
    glow: 'rgba(249, 65, 68, 0.4)',
    bgGradient: 'radial-gradient(circle, rgba(249,65,68,0.15) 0%, transparent 70%)',
    borderColor: 'rgba(249, 65, 68, 0.4)',
    description: 'Tense & pressured',
  },
  tired: {
    label: 'Tired',
    color: '#8ecae6',
    glow: 'rgba(142, 202, 230, 0.4)',
    bgGradient: 'radial-gradient(circle, rgba(142,202,230,0.15) 0%, transparent 70%)',
    borderColor: 'rgba(142, 202, 230, 0.4)',
    description: 'Drained & sleepy',
  },
  excited: {
    label: 'Excited',
    color: '#f72585',
    glow: 'rgba(247, 37, 133, 0.4)',
    bgGradient: 'radial-gradient(circle, rgba(247,37,133,0.15) 0%, transparent 70%)',
    borderColor: 'rgba(247, 37, 133, 0.4)',
    description: 'Energetic & thrilled',
  },
  sad: {
    label: 'Sad',
    color: '#577590',
    glow: 'rgba(87, 117, 144, 0.4)',
    bgGradient: 'radial-gradient(circle, rgba(87,117,144,0.15) 0%, transparent 70%)',
    borderColor: 'rgba(87, 117, 144, 0.4)',
    description: 'Low & melancholic',
  },
  overwhelmed: {
    label: 'Overwhelmed',
    color: '#9b5de5',
    glow: 'rgba(155, 93, 229, 0.4)',
    bgGradient: 'radial-gradient(circle, rgba(155,93,229,0.15) 0%, transparent 70%)',
    borderColor: 'rgba(155, 93, 229, 0.4)',
    description: 'Flooded & clouded',
  },
};

// SVG face expressions per mood
function CompanionFace({ mood, style }: { mood: MoodType; style: CharacterStyle }) {
  const config = moodConfig[mood];

  const faceColor = style === 'feminine' ? '#ffd0b5' : style === 'masculine' ? '#d4a574' : '#e8c9a0';
  const hairColor = style === 'feminine' ? '#8b4513' : style === 'masculine' ? '#2c1810' : '#5c3d2e';
  const accentColor = config.color;

  const expressions: Record<MoodType, { eyes: string; mouth: string; extras?: string }> = {
    happy: {
      eyes: `<ellipse cx="34" cy="44" rx="4" ry="5" fill="${hairColor}"/><ellipse cx="66" cy="44" rx="4" ry="5" fill="${hairColor}"/><circle cx="33" cy="42" r="1.5" fill="white"/><circle cx="65" cy="42" r="1.5" fill="white"/>`,
      mouth: `<path d="M 36 60 Q 50 72 64 60" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      extras: `<circle cx="27" cy="54" r="5" fill="${accentColor}" opacity="0.4"/><circle cx="73" cy="54" r="5" fill="${accentColor}" opacity="0.4"/>`,
    },
    calm: {
      eyes: `<path d="M 30 44 Q 34 40 38 44" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M 62 44 Q 66 40 70 44" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      mouth: `<path d="M 38 61 Q 50 67 62 61" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    },
    anxious: {
      eyes: `<ellipse cx="34" cy="44" rx="4" ry="5" fill="${hairColor}"/><ellipse cx="66" cy="44" rx="4" ry="5" fill="${hairColor}"/><circle cx="35" cy="43" r="1.5" fill="white"/><circle cx="67" cy="43" r="1.5" fill="white"/>`,
      mouth: `<path d="M 38 63 Q 50 58 62 63" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      extras: `<path d="M 30 36 Q 34 32 38 36" stroke="${hairColor}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M 62 36 Q 66 32 70 36" stroke="${hairColor}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    },
    stressed: {
      eyes: `<ellipse cx="34" cy="44" rx="5" ry="4" fill="${hairColor}"/><ellipse cx="66" cy="44" rx="5" ry="4" fill="${hairColor}"/>`,
      mouth: `<path d="M 36 65 Q 50 57 64 65" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      extras: `<path d="M 28 37 L 40 34" stroke="${hairColor}" stroke-width="2" stroke-linecap="round"/><path d="M 60 34 L 72 37" stroke="${hairColor}" stroke-width="2" stroke-linecap="round"/>`,
    },
    tired: {
      eyes: `<path d="M 30 46 Q 34 43 38 46" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M 62 46 Q 66 43 70 46" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      mouth: `<path d="M 40 62 Q 50 65 60 62" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      extras: `<path d="M 30 43 Q 34 40 38 43" stroke="${hairColor}" stroke-width="2.5" fill="${faceColor}" opacity="0.6"/><path d="M 62 43 Q 66 40 70 43" stroke="${hairColor}" stroke-width="2.5" fill="${faceColor}" opacity="0.6"/>`,
    },
    excited: {
      eyes: `<circle cx="34" cy="44" r="5" fill="${hairColor}"/><circle cx="66" cy="44" r="5" fill="${hairColor}"/><circle cx="32" cy="42" r="2" fill="white"/><circle cx="64" cy="42" r="2" fill="white"/>`,
      mouth: `<path d="M 35 58 Q 50 74 65 58" stroke="${hairColor}" stroke-width="2.5" fill="${accentColor}" opacity="0.3"/>`,
      extras: `<circle cx="25" cy="50" r="6" fill="${accentColor}" opacity="0.35"/><circle cx="75" cy="50" r="6" fill="${accentColor}" opacity="0.35"/>`,
    },
    sad: {
      eyes: `<ellipse cx="34" cy="44" rx="4" ry="5" fill="${hairColor}"/><ellipse cx="66" cy="44" rx="4" ry="5" fill="${hairColor}"/>`,
      mouth: `<path d="M 38 65 Q 50 57 62 65" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      extras: `<path d="M 34 50 Q 32 54 31 58" stroke="#8ecae6" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.7"/><path d="M 66 50 Q 64 54 63 58" stroke="#8ecae6" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.7"/>`,
    },
    overwhelmed: {
      eyes: `<ellipse cx="34" cy="44" rx="5" ry="6" fill="${hairColor}"/><ellipse cx="66" cy="44" rx="5" ry="6" fill="${hairColor}"/><circle cx="33" cy="43" r="1.5" fill="white"/><circle cx="65" cy="43" r="1.5" fill="white"/>`,
      mouth: `<path d="M 37 63 Q 50 68 63 63" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      extras: `<path d="M 28 35 L 38 33 L 34 38" stroke="${hairColor}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M 72 35 L 62 33 L 66 38" stroke="${hairColor}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    },
  };

  const hairStyles: Record<CharacterStyle, string> = {
    feminine: `<ellipse cx="50" cy="22" rx="28" ry="18" fill="${hairColor}"/>
      <ellipse cx="24" cy="40" rx="8" ry="20" fill="${hairColor}"/>
      <ellipse cx="76" cy="40" rx="8" ry="20" fill="${hairColor}"/>
      <path d="M 22 55 Q 18 70 22 80" stroke="${hairColor}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M 78 55 Q 82 70 78 80" stroke="${hairColor}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
    masculine: `<ellipse cx="50" cy="22" rx="28" ry="16" fill="${hairColor}"/>
      <rect x="22" y="15" width="56" height="12" rx="6" fill="${hairColor}"/>`,
    neutral: `<ellipse cx="50" cy="22" rx="28" ry="16" fill="${hairColor}"/>
      <ellipse cx="25" cy="38" rx="7" ry="14" fill="${hairColor}"/>
      <ellipse cx="75" cy="38" rx="7" ry="14" fill="${hairColor}"/>`,
  };

  const expr = expressions[mood];

  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Glow background */}
      <defs>
        <radialGradient id={`glow-${mood}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#glow-${mood})`} />

      {/* Hair back */}
      <g dangerouslySetInnerHTML={{ __html: hairStyles[style] }} />

      {/* Face */}
      <ellipse cx="50" cy="50" rx="26" ry="28" fill={faceColor} />

      {/* Facial features */}
      <g dangerouslySetInnerHTML={{ __html: expr.extras || '' }} />
      <g dangerouslySetInnerHTML={{ __html: expr.eyes }} />
      <g dangerouslySetInnerHTML={{ __html: expr.mouth }} />

      {/* Nose */}
      <path d="M 48 50 Q 50 56 52 50" stroke={hairColor} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />

      {/* Body */}
      <ellipse cx="50" cy="92" rx="18" ry="10" fill={accentColor} opacity="0.2" />
      <path d="M 35 78 Q 50 84 65 78 L 62 95 Q 50 100 38 95 Z" fill={accentColor} opacity="0.25" />
    </svg>
  );
}

export default function MoodCompanion({ mood, style, size = 'md', animated = true, selected, onClick }: MoodCompanionProps) {
  const config = moodConfig[mood];

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const containerSizes = {
    sm: 'w-20 h-24',
    md: 'w-28 h-36',
    lg: 'w-40 h-48',
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-2 group cursor-pointer
        ${containerSizes[size]}
        transition-all duration-300
        ${onClick ? 'hover:scale-105 active:scale-95' : ''}
      `}
    >
      <div className={`
        relative ${sizeClasses[size]}
        ${animated ? 'animate-float' : ''}
        transition-all duration-300
      `}>
        {/* Glow ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}
          style={{
            boxShadow: `0 0 30px ${config.glow}, 0 0 60px ${config.glow}`,
            background: config.bgGradient,
            borderRadius: '50%',
          }}
        />

        {/* Selection ring */}
        {selected && (
          <div
            className="absolute -inset-1.5 rounded-full border-2 transition-all duration-300"
            style={{ borderColor: config.color, boxShadow: `0 0 20px ${config.glow}` }}
          />
        )}

        <CompanionFace mood={mood} style={style} />
      </div>

      <div className="text-center">
        <p className={`text-xs font-semibold transition-colors duration-200 ${selected ? '' : 'text-white/60 group-hover:text-white/90'}`}
          style={selected ? { color: config.color } : {}}>
          {config.label}
        </p>
        {size !== 'sm' && (
          <p className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors hidden sm:block">
            {config.description}
          </p>
        )}
      </div>
    </button>
  );
}

export { moodConfig };
