import { Config } from 'tailwindcss'

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'business-gold': '#fbbf24',
        'task-orange': '#fb923c',
        'executor-blue': '#60a5fa',
        'business-green': '#dcfce7',
        'management-teal': '#ccfbf1',
      },
    },
  },
  plugins: [],
} satisfies Config