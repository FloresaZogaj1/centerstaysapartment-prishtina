module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#0f1724',
        ivory: '#F6F3EE',
        champagne: '#C6A76D',
        gold: '#CBAA6A',
        'warm-gray': '#E9E6E1',
        'bg-warm': '#FBF9F7',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      borderRadius: {
        'lg-2': '14px'
      },
      boxShadow: {
        'lux-1': '0 10px 40px rgba(15,23,36,0.12)',
        'lux-2': '0 20px 60px rgba(15,23,36,0.14)'
      },
      transitionDuration: {
        400: '400ms'
      }
    }
  },
  plugins: []
}
