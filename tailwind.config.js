/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    // Include any additional paths where Tailwind classes might be used
    "./src/components/**/*.{js,jsx}",
    "./src/pages/**/*.{js,jsx}",
    "./src/hooks/**/*.{js,jsx}",
  ],
  // Enable JIT mode for faster builds and smaller CSS
  mode: 'jit',
  theme: {
    extend: {
      colors: {
        'primary-orange': '#F68622',
        'primary-dark': '#070804',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'construction-bounce': 'bounce 1s infinite',
        'construction-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'shimmer': {
          '0%': { 
            backgroundPosition: '-200% 0',
            transform: 'translateX(-100%)'
          },
          '100%': { 
            backgroundPosition: '200% 0',
            transform: 'translateX(100%)'
          },
        },
      },
    },
  },
  plugins: [],
  
  // Safelist for dynamically generated classes
  safelist: [
    // Animation classes that might be generated dynamically
    'animate-spin',
    'animate-pulse',
    'animate-bounce',
    'animate-shimmer',
    
    // Color variations that might be used dynamically
    'text-orange-500',
    'text-orange-600',
    'bg-orange-500',
    'bg-orange-600',
    'border-orange-500',
    'border-orange-300',
    
    // Loading and skeleton classes
    'bg-gray-200',
    'bg-gray-300',
    'animate-pulse',
    
    // Grid and layout classes that might be dynamic
    {
      pattern: /grid-cols-(1|2|3|4|5|6)/,
      variants: ['sm', 'md', 'lg', 'xl']
    },
    {
      pattern: /gap-(1|2|3|4|5|6|8)/,
      variants: ['sm', 'md', 'lg', 'xl']
    }
  ],

  // Optimize for production
  corePlugins: {
    // Keep essential plugins
    preflight: true,
    container: true,
    
    // Disable unused visual effects to reduce bundle size
    accessibility: false,
    appearance: false,
    backdropBlur: false,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
    backgroundAttachment: false,
    backgroundClip: true, // Keep for image optimization
    backgroundOrigin: false,
    backgroundPosition: true, // Keep for image positioning
    backgroundRepeat: true, // Keep for patterns
    backgroundSize: true, // Keep for responsive images
    blur: false,
    brightness: false,
    contrast: false,
    dropShadow: false,
    grayscale: false,
    hueRotate: false,
    invert: false,
    saturate: false,
    sepia: false,
    filter: false,
    backdropFilter: false,
    
    // Keep essential layout and interaction plugins
    aspectRatio: true,
    columns: false,
    breakAfter: false,
    breakBefore: false,
    breakInside: false,
    boxDecorationBreak: false,
    caretColor: false,
    accentColor: false,
    scrollBehavior: true,
    scrollMargin: false,
    scrollPadding: false,
    scrollSnapAlign: false,
    scrollSnapStop: false,
    scrollSnapType: false,
    touchAction: true,
    userSelect: true,
    resize: false,
  }
}
