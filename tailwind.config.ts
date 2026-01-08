import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colori Advisory+ dal branding
        primary: {
          DEFAULT: '#003366', // Blu navy principale
          light: '#0A4E7E',
          dark: '#001B3D',
        },
        secondary: {
          DEFAULT: '#00B4D8', // Turchese
          light: '#48CAE4',
          dark: '#0096C7',
        },
        accent: {
          DEFAULT: '#90E0EF', // Azzurro chiaro
          light: '#ADE8F4',
          dark: '#00B4D8',
        },
        festivo: '#EF4444', // Rosso per giorni festivi
        semifestivo: '#F97316', // Arancione per giorni semifestivi
        presente: '#10B981', // Verde per presenze
        assente: '#F3F4F6', // Grigio chiaro per assenze
        parziale: '#FCD34D', // Giallo per presenze parziali
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
