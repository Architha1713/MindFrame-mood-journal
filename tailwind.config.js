/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary - deep teal-blue
        primary: {
          50: '#e6f7f7',
          100: '#b3e8e8',
          200: '#80d9d9',
          300: '#4dcaca',
          400: '#26bebe',
          500: '#00b2b2',
          600: '#009999',
          700: '#007a7a',
          800: '#005c5c',
          900: '#003d3d',
        },
        // Secondary - warm cyan
        secondary: {
          50: '#e0f9ff',
          100: '#b3f0ff',
          200: '#80e6ff',
          300: '#4ddcff',
          400: '#26d4ff',
          500: '#00ccff',
          600: '#00a8d6',
          700: '#0085ad',
          800: '#006285',
          900: '#003f5c',
        },
        // Accent - soft gold
        accent: {
          50: '#fdf9e6',
          100: '#faf0b3',
          200: '#f6e680',
          300: '#f3dd4d',
          400: '#f0d626',
          500: '#edcf00',
          600: '#c9af00',
          700: '#a08c00',
          800: '#786900',
          900: '#504600',
        },
        // Surface colors
        surface: {
          50: '#1a1f2e',
          100: '#151a28',
          200: '#111622',
          300: '#0d121c',
          400: '#090e16',
          500: '#060a10',
        },
        // Glass
        glass: {
          light: 'rgba(255,255,255,0.05)',
          medium: 'rgba(255,255,255,0.08)',
          heavy: 'rgba(255,255,255,0.12)',
        },
        // Mood colors
        mood: {
          happy: '#f9c74f',
          calm: '#43aa8b',
          anxious: '#f8961e',
          stressed: '#f94144',
          tired: '#8ecae6',
          excited: '#f72585',
          sad: '#577590',
          overwhelmed: '#9b5de5',
        },
        // Status
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(190,100%,20%,0.4) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(200,100%,15%,0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(180,100%,15%,0.3) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(210,100%,12%,0.3) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(190,100%,10%,0.4) 0px, transparent 50%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2.5s linear infinite',
        'orbit': 'orbit 20s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'wave': 'wave 3s ease-in-out infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'blur(8px)' },
          '50%': { opacity: '1', filter: 'blur(12px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(0, 178, 178, 0.2)',
        'glow': '0 0 30px rgba(0, 178, 178, 0.3)',
        'glow-lg': '0 0 60px rgba(0, 178, 178, 0.4)',
        'glow-cyan': '0 0 30px rgba(0, 204, 255, 0.3)',
        'glow-gold': '0 0 30px rgba(237, 207, 0, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};
