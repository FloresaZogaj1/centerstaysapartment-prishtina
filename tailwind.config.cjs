module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2699D6'
        },
        charcoal: {
          DEFAULT: '#111827'
        }
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(17,24,39,0.06)',
        'soft-blue': '0 10px 30px rgba(38,153,214,0.12)'
      }
    }
  },
  plugins: []
}
