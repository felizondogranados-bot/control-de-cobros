/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exclusiva paleta de colores solicitada
        moss: {
          DEFAULT: '#929433',
          hover: '#a3a547',
          dark: '#6e7025',
          light: '#F4F5E6',
        },
        linen: {
          DEFAULT: '#EEE7DD',
          light: '#FAF7F2',
          dark: '#D8CFC2',
        },
        matcha: {
          DEFAULT: '#D7D799',
          light: '#FAFAD9',
          dark: '#9E9E59',
        },
        rose: {
          DEFAULT: '#EBB4B2',
          light: '#FBF0EF',
          dark: '#B06B69',
        },
        // Mapeo brand para retrocompatibilidad instantánea con tonos cálidos
        brand: {
          blue: {
            DEFAULT: '#929433', // Moss Green
            dark: '#6e7025',
          },
          gray: {
            light: '#FAF7F2', // Linen Light para el fondo general
            dark: '#2E3014',  // Moss Green ultra oscuro para legibilidad
          },
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        title: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 30px -4px rgba(146, 148, 51, 0.04), 0 2px 16px -2px rgba(0, 0, 0, 0.02)',
        soft: '0 10px 40px -10px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
