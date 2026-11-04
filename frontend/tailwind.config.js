/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shopeers Reference B2B SaaS Palette
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#0A24E9', // Shopeers Primary Blue
          600: '#152EAE', // Secondary Blue
          700: '#0A24E9',
          800: '#081EB5',
          900: '#061790',
          950: '#040F60',
          DEFAULT: '#0A24E9',
        },
        navy: {
          50: '#F0F2FA',
          100: '#E2E6F5',
          200: '#C5CDED',
          300: '#9EABE0',
          400: '#6476C5',
          500: '#29315D', // Shopeers Deep Navy
          600: '#22294E',
          700: '#1B203E',
          800: '#141830',
          900: '#0E1122',
          DEFAULT: '#29315D',
        },
        secondary: {
          50: '#F0F9F2',
          100: '#DCF0E0',
          200: '#BDE3C4',
          300: '#94D0A0',
          400: '#73B880',
          500: '#5C9764', // Shopeers Success Green
          600: '#4D8054',
          700: '#3E6643',
          800: '#304F34',
          900: '#243B27',
          DEFAULT: '#5C9764',
        },
        accent: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#0A24E9',
          600: '#152EAE',
          DEFAULT: '#0A24E9',
        },

        // Surface & Background Centralized CSS Tokens
        app: {
          bg: 'var(--background)',
          surface: 'var(--surface)',
          'surface-elevated': 'var(--surface-secondary)',
          border: 'var(--border)',
          text: 'var(--text-primary)',
          'text-muted': 'var(--text-secondary)',
        },

        // Backward compatibility mappings
        plum: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#0A24E9',
          600: '#152EAE',
          700: '#0A24E9',
          800: '#081EB5',
          900: '#061790',
        },
        rose: {
          50: '#F0F9F2',
          100: '#DCF0E0',
          200: '#BDE3C4',
          300: '#94D0A0',
          400: '#73B880',
          500: '#5C9764',
          600: '#4D8054',
          700: '#3E6643',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#0A24E9',
          600: '#152EAE',
          700: '#0A24E9',
          800: '#081EB5',
          900: '#061790',
        }
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '16px',
        '2xl': '18px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(11, 13, 23, 0.04)',
        'card': '0 1px 3px 0 rgba(11, 13, 23, 0.04), 0 1px 2px 0 rgba(11, 13, 23, 0.02)',
        'card-hover': '0 8px 24px -4px rgba(11, 13, 23, 0.08), 0 2px 6px -1px rgba(11, 13, 23, 0.03)',
        'card-dark': '0 4px 12px 0 rgba(0, 0, 0, 0.35)',
        'card-dark-hover': '0 10px 24px 0 rgba(0, 0, 0, 0.5)',
        'elevated': '0 10px 25px -4px rgba(11, 13, 23, 0.08), 0 4px 10px -2px rgba(11, 13, 23, 0.04)',
        'dropdown': '0 12px 30px -4px rgba(11, 13, 23, 0.12), 0 4px 10px -2px rgba(11, 13, 23, 0.06)',
        'dropdown-dark': '0 14px 32px -4px rgba(0, 0, 0, 0.7), 0 8px 16px -2px rgba(0, 0, 0, 0.5)',
        'modal': '0 25px 50px -12px rgba(11, 13, 23, 0.25)',
        'glow-blue': '0 0 20px -3px rgba(10, 36, 233, 0.3)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        drawerRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite linear',
        fadeIn: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideUp: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideDown: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        scaleIn: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        drawerRight: 'drawerRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
