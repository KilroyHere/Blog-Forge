# Blog Editor Application - Design Guidelines

## Design Approach
**Selected Approach:** Design System (Notion/Medium-inspired)
**Justification:** Utility-focused content management tool where clarity, readability, and efficient workflow matter most. Drawing inspiration from Notion's clean editor interface and Medium's reading experience.

**Core Principles:**
- Content-first: Editor and posts are the stars
- Minimal chrome: Interface should disappear during writing
- Clear hierarchy: Distinguish editing mode from reading mode
- Distraction-free: Clean, focused layouts

## Typography System
**Font Stack:**
- Headers: Inter (500-700 weight) via Google Fonts
- Body/Editor: -apple-system, BlinkMacSystemFont, "Segoe UI" (system fonts for familiarity)
- Code blocks: 'Fira Code' or 'JetBrains Mono'

**Hierarchy:**
- Page titles: text-4xl/5xl font-bold
- Post titles: text-3xl/4xl font-semibold
- Section headers: text-xl/2xl font-medium
- Body text: text-base/lg leading-relaxed
- Meta info (dates, tags): text-sm font-normal

## Layout System
**Spacing Primitives:** Tailwind units of 3, 4, 6, 8, 12, 16
- Tight spacing: p-3, gap-4
- Standard spacing: p-6, gap-8
- Generous spacing: p-12, py-16

**Container Strategy:**
- Editor view: max-w-4xl mx-auto (optimal writing width ~800px)
- Post list: max-w-6xl mx-auto
- Reading view: max-w-3xl mx-auto (prose-friendly)

## Application Structure

**A. Dashboard/Post List View**
- Header with app title and "New Post" CTA button (top-right)
- Post grid/list with 2-column layout on desktop (grid-cols-1 md:grid-cols-2)
- Each post card includes: title, excerpt (first 120 chars), date, edit button
- Empty state: centered message with large "Create Your First Post" button

**B. Editor View**
- Minimal header: Back button (left), Post title input (center), Save/Publish buttons (right)
- Full-width tui.editor integration below header
- Editor occupies majority of viewport (min-h-screen - header height)
- Floating save indicator (bottom-right corner) showing save status

**C. Post Reading View**
- Clean header with back button
- Article container (max-w-3xl) with generous padding (px-6 py-12)
- Post metadata bar: Published date, edit button
- Rendered markdown content with proper vertical rhythm (space-y-6)

## Component Library

**Navigation:**
- Simple top bar (h-16) with logo/title and primary actions
- Sticky positioning for editor header only
- Breadcrumb-style navigation (Dashboard > Post Title)

**Buttons:**
- Primary: Solid background, medium weight, px-6 py-3, rounded-lg
- Secondary: Outline style, same padding
- Icon buttons: Square (w-10 h-10), rounded-md, for actions like edit/delete

**Cards (Post List):**
- Bordered containers with rounded-xl, p-6
- Hover state: subtle shadow elevation
- Title (text-xl font-semibold), excerpt (text-sm), metadata row at bottom

**Forms:**
- Post title input: Borderless, text-4xl, font-bold, placeholder styling
- Focus states: subtle bottom border appears
- Auto-resize textarea behavior for title

**Editor Integration:**
- tui.editor takes full available height
- Toolbar should be sticky when scrolling
- Preview/edit mode toggle prominently placed

**Empty States:**
- Centered vertically and horizontally
- Illustration placeholder (150x150) or icon
- Encouraging message with clear CTA

## Responsive Behavior
- Mobile (< 768px): Single column, full-width editor, hamburger if needed
- Tablet (768-1024px): 2-column post grid, comfortable editor width
- Desktop (> 1024px): Full layout as described, max-width containers

## Images
**Dashboard:** No hero image needed - function-first interface
**Post Cards:** Optional thumbnail preview (16:9 aspect ratio) if markdown contains images
**Empty State:** Simple icon or illustration placeholder (not critical)

## Animation Guidelines
**Minimal animations only:**
- Page transitions: Simple fade (150ms)
- Save indicator: Pulse when saving
- Card hover: Transform scale(1.01) with shadow
- No scroll-triggered or complex animations

## Key UX Patterns
- Auto-save every 30 seconds during editing
- Unsaved changes warning when navigating away
- Markdown preview toggle within editor
- Quick access to recently edited posts
- Clear visual distinction between draft/published states

This design prioritizes writing flow and content consumption over decorative elements, creating a professional, distraction-free blogging experience.