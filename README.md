# FGTC Search - AI Powered Content Research Assistant

An AI-powered content research tool that helps content creators research and generate content ideas quickly.

## Features

- Multiple AI model support (GPT-4, Claude, DeepSeek, etc.)
- Web search integration with Tavily
- File upload and processing
- Real-time streaming responses
- Authentication and user tiers
- Usage tracking and rate limiting

## Tech Stack

- Next.js 13+ with App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth.js
- Upstash Redis

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
```

2. Install dependencies
```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in your environment variables
```bash
cp .env.example .env
```

4. Run database migrations
```bash
npx prisma migrate dev
```

5. Start the development server
```bash
npm run dev
```

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your site URL
- `NEXTAUTH_SECRET`: Random string for session encryption
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `DEEPSEEK_API_KEY`: DeepSeek API key
- `TAVILY_API_KEY`: Tavily API key
- `UPSTASH_REDIS_URL`: Upstash Redis URL
- `UPSTASH_REDIS_TOKEN`: Upstash Redis token

## Deployment

The project can be deployed to any platform that supports Next.js, such as Vercel or Railway.

## License

MIT