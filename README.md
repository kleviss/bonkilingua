# Bonkilingua Web App

A language learning application with AI-powered corrections and personalized learning tools.

## Features

- AI-powered text corrections
- Language detection
- Personalized learning tools
- Rewards system
- User authentication
- Database storage for chat history and lessons

## Tech Stack

- Next.js 15
- React 18
- Tailwind CSS
- Supabase (Authentication & Database)
- OpenAI API

## Setup Instructions

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bonkilingua-web-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. Set up Supabase:
   - Create a new project in Supabase
   - Go to SQL Editor and run the SQL commands from `supabase/schema.sql`
   - Enable Email Auth in Authentication settings

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses Supabase as the database with the following tables:

### profiles
- `id`: UUID (primary key, references auth.users)
- `email`: Text
- `bonk_points`: Integer
- `total_corrections`: Integer
- `languages_learned`: Text Array
- `streak_days`: Integer
- `level`: Integer
- `daily_challenge`: Boolean
- `created_at`: Timestamp
- `updated_at`: Timestamp

### chat_sessions
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `corrected_text`: Text
- `input_text`: Text
- `language`: Text
- `model`: Text
- `created_at`: Timestamp

### saved_lessons
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `title`: Text
- `content`: Text
- `created_at`: Timestamp

## Authentication

The app supports both authenticated and unauthenticated usage:

- **Authenticated Users**: Data is stored in the Supabase database
- **Unauthenticated Users**: Data is stored in the browser's localStorage

When an unauthenticated user signs up or logs in, their localStorage data is synced to the database.

## License

[MIT](LICENSE)