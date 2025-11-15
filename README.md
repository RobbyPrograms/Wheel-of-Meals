# SavoryCircle -Created by Robby Rolison

SavoryCircle is an interactive web application that helps users discover new meals based on their favorite foods. It includes features like user authentication, meal generation, meal planning, and AI-powered recipe suggestions.

## Features

- **User Authentication**: Secure login and registration using Supabase Auth
- **Food Management**: Add, edit, and delete your favorite foods
- **Meal Wheel**: Spin the wheel to randomly select your next meal
- **Meal Planning**: Create and manage weekly meal plans
- **AI Suggestions**: Get AI-powered recipe suggestions based on your favorite foods

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **AI Integration**: DeepSeek AI for recipe suggestions

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/savorycircle.git
   cd savorycircle
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   DEEPSEEK_API_KEY=your-deepseek-api-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3002](http://localhost:3002) in your browser.

### Database Setup

1. Navigate to the `/setup` page in your application
2. Follow the instructions to set up your Supabase database tables

Alternatively, you can manually set up your database by following the instructions in the `SUPABASE_SETUP.md` file.

## Project Structure

```
savorycircle/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app directory
│   │   ├── about/       # About page
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── login/       # Login page
│   │   ├── setup/       # Database setup page
│   │   ├── signup/      # Signup page
│   │   └── page.tsx     # Home page
│   ├── components/      # Reusable components
│   ├── lib/             # Utility functions and services
│   │   ├── auth-context.tsx  # Authentication context
│   │   ├── deepseek.ts       # DeepSeek AI integration
│   │   ├── supabase.ts       # Supabase client
│   │   └── supabase-types.ts # TypeScript types for Supabase
│   └── styles/          # Global styles
├── .env.local           # Environment variables (create this file)
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── SUPABASE_SETUP.md    # Supabase setup instructions
```

## Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Troubleshooting

If you encounter issues with the application:

1. Check the browser console for error messages
2. Verify that your Supabase database is properly set up
3. Ensure your environment variables are correctly configured
4. Visit the `/setup` page to check your database status

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DeepSeek AI](https://deepseek.ai/) 
