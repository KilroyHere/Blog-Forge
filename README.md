# Blog Editor

A self-hostable blog application with a distraction-free markdown editing experience. Built with React, Express, and Supabase.

## Features

- Create, edit, and delete blog posts
- Live markdown preview with TUI Editor
- TUI Editor plugins: code syntax highlighting, charts, merged table cells, UML diagrams
- Image and media upload stored directly in the database
- Automatic cleanup of removed images when saving posts
- Dark/light theme support
- Custom fonts: Sora for text, JetBrains Mono for code
- Responsive design
- Supabase for data persistence

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Editor**: TUI Editor (Toast UI) with plugins
- **Syntax Highlighting**: Prism.js (18+ languages)
- **Backend**: Express.js (development) / Vercel Serverless Functions (production)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel via GitHub Actions

## Quick Start

### Prerequisites

- Node.js 20+
- A Supabase account and project

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/KilroyHere/blog-editor.git
   cd blog-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file with your Supabase credentials
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Create the database tables in Supabase:
   ```sql
   -- Posts table
   CREATE TABLE posts (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     markdown TEXT DEFAULT '',
     html TEXT DEFAULT '',
     excerpt TEXT DEFAULT '',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow all access" ON posts FOR ALL USING (true);

   -- Media table (for image uploads)
   CREATE TABLE media (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     filename TEXT NOT NULL,
     mime_type TEXT NOT NULL,
     data TEXT NOT NULL,
     size INTEGER NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   ALTER TABLE media ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Allow public read" ON media FOR SELECT USING (true);
   CREATE POLICY "Allow public insert" ON media FOR INSERT WITH CHECK (true);
   CREATE POLICY "Allow public delete" ON media FOR DELETE USING (true);
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:5000

## Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)

2. Import this GitHub repository

3. Add environment variables:
   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `VITE_SUPABASE_URL` | Same as SUPABASE_URL |
   | `VITE_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY |

4. Click Deploy

### Option 2: Deploy via GitHub Actions

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys to Vercel on push to `main`.

To set it up:
1. Add these secrets to your GitHub repository:
   - `VERCEL_TOKEN` - Your Vercel API token
   - `VERCEL_ORG_ID` - Your Vercel organization ID
   - `VERCEL_PROJECT_ID` - Your Vercel project ID

2. Push to the `main` branch to trigger deployment

## Image Upload

Images added to posts are automatically:
- Uploaded to the database as base64 data
- Served via `/api/media/:id` endpoint
- Cleaned up when removed from posts (on save)
- Deleted when the post is deleted

Supported formats: JPEG, PNG, GIF, WebP, MP4, WebM (max 10MB)

## Project Structure

```
blog-editor/
├── api/                    # Vercel serverless API handler
│   └── index.ts            # Single handler for all API routes
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components (MarkdownEditor, Header, etc.)
│       ├── pages/          # Page components (Dashboard, EditorPage, PostView)
│       └── lib/            # Utilities
├── server/                 # Express backend (development)
│   └── routes.ts           # API routes
├── shared/                 # Shared code
│   ├── schema.ts           # Data types and validation (posts, media)
│   ├── supabase.ts         # Database client
│   └── services/           # Business logic
└── vercel.json             # Vercel configuration
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List all posts |
| POST | `/api/posts` | Create a new post |
| GET | `/api/posts/:id` | Get a single post |
| PUT | `/api/posts/:id` | Update a post |
| DELETE | `/api/posts/:id` | Delete a post |
| POST | `/api/upload` | Upload an image/media file |
| GET | `/api/media/:id` | Get a media file |
| DELETE | `/api/media/:id` | Delete a media file |
| POST | `/api/media/cleanup` | Bulk delete media files |

## License

MIT
