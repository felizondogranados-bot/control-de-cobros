/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            DEFAULT: '#0052FF', // Azul principal (vibrante y profesional, estilo fintech)
            dark: '#0A192F',    // Azul oscuro (profundidad, profesionalismo, contraste premium)
          },
          gray: {
            light: '#F8FAFC',   // Gris claro (para fondos, bordes suaves y neutralidad)
            dark: '#1E293B',    // Gris oscuro (para textos legibles de alta calidad y componentes oscuros)
          },
          white: '#FFFFFF',     // Blanco puro
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 20px -2px rgba(0, 82, 255, 0.05), 0 2px 12px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
