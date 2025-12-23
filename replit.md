# Blog Editor Application

## Overview

A content-first blog editor application inspired by Notion and Medium. The application allows users to create, edit, and view blog posts with a distraction-free markdown editing experience. Built with a React frontend and Express backend, using Supabase for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Editor**: Toast UI Editor (@toast-ui/editor) for markdown editing with live preview

### Backend Architecture
- **Framework**: Express.js running on Node.js
- **API Design**: RESTful API with `/api` prefix for all endpoints
- **Build System**: esbuild for server bundling, Vite for client bundling
- **Development**: Hot module replacement via Vite middleware in development mode

### Data Storage
- **Primary Database**: Supabase (PostgreSQL-based)
- **Schema Management**: Zod schemas for validation, Drizzle ORM configured but Supabase client used directly for queries
- **Data Model**: Posts table with id (UUID), title, markdown, html, excerpt, created_at, updated_at

### Key Design Decisions

1. **Supabase over Drizzle Direct Connection**
   - Problem: Need reliable database with minimal setup
   - Solution: Supabase client SDK for both server and client-side queries
   - Rationale: Provides built-in auth capabilities, real-time features, and hosted PostgreSQL

2. **Markdown + HTML Storage**
   - Problem: Need both raw markdown for editing and rendered HTML for display
   - Solution: Store both markdown and html fields in the database
   - Rationale: Avoids re-rendering on every page view while maintaining editability

3. **shadcn/ui Component System**
   - Problem: Need consistent, accessible UI components
   - Solution: Copy-paste component library with Radix primitives
   - Rationale: Full control over component code, no external dependency lock-in

4. **Monorepo Structure**
   - Frontend in `/client`, backend in `/server`, shared code in `/shared`
   - Path aliases configured: `@/` for client source, `@shared/` for shared code

## External Dependencies

### Database & Backend Services
- **Supabase**: PostgreSQL database hosting and client SDK
  - Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (server), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client)
  - Required table: `posts` with RLS policies for public access

### Frontend Libraries
- **@toast-ui/editor**: WYSIWYG markdown editor with split-view preview
- **@tanstack/react-query**: Data fetching, caching, and synchronization
- **date-fns**: Date formatting utilities
- **lucide-react**: Icon library

### Development Tools
- **Vite**: Development server and build tool with HMR
- **TypeScript**: Type checking across the entire codebase
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle Kit**: Database migration tooling (configured but not actively used)