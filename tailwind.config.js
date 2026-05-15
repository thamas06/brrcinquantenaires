/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs principales du design system "The Nocturnal Connoisseur"
        background: '#071327',
        surface: '#071327',
        'surface-dim': '#071327',
        'surface-bright': '#2e394f',
        'surface-container': '#142034',
        'surface-container-low': '#101b30',
        'surface-container-high': '#1f2a3f',
        'surface-container-highest': '#2a354b',
        'surface-container-lowest': '#030e22',
        'surface-variant': '#2a354b',

        // Primary (Moonlight Blue)
        primary: '#bac8dc',
        'primary-container': '#0d1b2a',
        'primary-fixed': '#d6e4f9',
        'primary-fixed-dim': '#bac8dc',
        'on-primary': '#243141',
        'on-primary-container': '#768497',
        'on-primary-fixed': '#0f1c2c',
        'on-primary-fixed-variant': '#3a4859',

        // Secondary (Gold)
        secondary: '#e9c176',
        'secondary-container': '#604403',
        'secondary-fixed': '#ffdea5',
        'secondary-fixed-dim': '#e9c176',
        'on-secondary': '#412d00',
        'on-secondary-container': '#dab36a',
        'on-secondary-fixed': '#261900',
        'on-secondary-fixed-variant': '#5d4201',

        // Tertiary (Teal)
        tertiary: '#95d4b3',
        'tertiary-container': '#001f12',
        'tertiary-fixed': '#b1f0ce',
        'tertiary-fixed-dim': '#95d4b3',
        'on-tertiary': '#003824',
        'on-tertiary-container': '#528f71',
        'on-tertiary-fixed': '#002114',
        'on-tertiary-fixed-variant': '#0e5138',

        // Error
        error: '#ffb4ab',
        'error-container': '#93000a',
        'on-error': '#690005',
        'on-error-container': '#ffdad6',

        // Autres
        outline: '#8e9196',
        'outline-variant': '#44474c',
        'inverse-surface': '#d7e2ff',
        'inverse-on-surface': '#263046',
        'inverse-primary': '#525f71',
        'on-background': '#d7e2ff',
        'on-surface': '#d7e2ff',
        'on-surface-variant': '#c4c6cc',
        'surface-tint': '#bac8dc',
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      fontFamily: {
        'headline': ['Plus Jakarta Sans', 'sans-serif'],
        'body': ['Manrope', 'sans-serif'],
        'label': ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        'ambient': '0 12px 40px rgba(7, 19, 39, 0.15)',
        'floating': '0 40px 12px 40px rgba(7, 19, 39, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
}
