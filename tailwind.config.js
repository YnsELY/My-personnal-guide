/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#b39164', // New Gold (was #B48E2D)
          100: '#F5E6C4',
          900: '#755C1B',
        },
        // We can keep these for explicit dark mode mapping if needed, 
        // but standard Tailwind colors like zinc-900 are often better.
        // Let's redefine 'dark-background' to be used in dark: classes if we want a specific gray.
      }
    },
  },
  plugins: [],
}
