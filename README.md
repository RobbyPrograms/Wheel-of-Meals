# Wheel of Meals

Wheel of Meals is an interactive web application that helps users discover new meal ideas based on their favorite foods. It generates random meal suggestions, provides ingredient lists, and offers advanced features like meal planning and AI-powered recipe suggestions.

## Features

- **User Authentication**: Create accounts and securely store preferences using Supabase
- **Favorite Foods Input**: Save your favorite foods for personalized meal suggestions
- **Random Meal Generator**: Get random meal ideas from your saved preferences
- **Interactive Meal Wheel**: A fun, visual way to randomize meal selections
- **Meal Planning Tool**: Generate one or two-week meal plans with ingredient lists
- **AI-Powered Recipe Suggestions**: Get creative recipe ideas using DeepSeek AI
- **Ingredient List Display**: View detailed ingredient lists for each meal
- **User Preference Memory**: Store preferences for a personalized experience
- **Responsive and Fun UI**: A visually appealing and user-friendly interface

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- DeepSeek AI (Recipe Suggestions)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## License

This project is licensed under the MIT License. 