import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          50: '#F0EFFF',
          100: '#E1DEFF',
          200: '#C3BCFF',
          300: '#A59BFF',
          400: '#8779FF',
          500: '#6C63FF',
          600: '#4B40FF',
          700: '#2A1FFF',
          800: '#0A00FF',
          900: '#0900D6',
        },
        accent: {
          DEFAULT: '#00C9A7',
          50: '#E0FFF9',
          100: '#B3FFF0',
          200: '#66FFE1',
          300: '#1AFFD2',
          400: '#00E8BF',
          500: '#00C9A7',
          600: '#00A389',
          700: '#007D6B',
          800: '#00574A',
          900: '#00312B',
        },
        dark: {
          DEFAULT: '#0F0F1A',
          50: '#2A2A3D',
          100: '#252536',
          200: '#1E1E30',
          300: '#1A1A2E',
          400: '#15152A',
          500: '#0F0F1A',
          600: '#0A0A14',
          700: '#05050E',
          800: '#000008',
          900: '#000000',
        },
        card: '#1A1A2E',
        border: 'rgba(108, 99, 255, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6C63FF 0%, #00C9A7 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(108,99,255,0.1) 0%, rgba(0,201,167,0.1) 100%)',
        'gradient-purple': 'linear-gradient(135deg, #6C63FF 0%, #9B59B6 100%)',
        'gradient-teal': 'linear-gradient(135deg, #00C9A7 0%, #1ABC9C 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(108, 99, 255, 0.3)',
        'glow-accent': '0 0 20px rgba(0, 201, 167, 0.3)',
        'glow-sm': '0 0 10px rgba(108, 99, 255, 0.2)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(108, 99, 255, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(108, 99, 255, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(108, 99, 255, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
