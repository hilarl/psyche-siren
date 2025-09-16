# Copilot Instructions for psyche-siren

This document guides AI coding agents to be productive in the `psyche-siren` codebase. It covers architecture, workflows, conventions, and integration points specific to this project.

## Project Overview
- **Framework:** Next.js (App Router, TypeScript)
- **UI:** Custom components in `src/components/` and `src/components/ui/`
- **API:** Route handlers in `src/app/api/`
- **State Management:** Likely local or context-based (see `src/lib/store.ts`)
- **Styling:** CSS modules and global styles in `src/styles/`

## Key Workflows
- **Development:**
  - Start dev server: `npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`)
  - Main entry: `src/app/page.tsx`, layout: `src/app/layout.tsx`
- **Build:**
  - Build for production: `npm run build`
- **Testing:**
  - No test files detected; add tests in `src/__tests__/` or similar if needed.
- **Debugging:**
  - Use browser devtools and Next.js error overlays.

## Architectural Patterns
- **App Structure:**
  - Pages and layouts in `src/app/`
  - API endpoints in `src/app/api/`
  - Reusable UI in `src/components/ui/`
- **Component Conventions:**
  - Functional React components, often using hooks from `src/hooks/`
  - Props and state are typed with TypeScript
- **Styling:**
  - Global styles: `src/styles/globals.css`
  - Component styles: co-located or imported CSS

## Integration Points
- **External:**
  - Next.js, Vercel, Geist font
- **Internal:**
  - Shared utilities in `src/lib/utils.ts`
  - State logic in `src/lib/store.ts`

## Project-Specific Conventions
- **File Naming:**
  - Use kebab-case for files, PascalCase for components
- **Directory Structure:**
  - Keep UI primitives in `src/components/ui/`
  - Place hooks in `src/hooks/`
- **API Design:**
  - Use Next.js route handlers for backend logic

## Example Patterns
- **Component:**
  ```tsx
  // src/components/chat.tsx
  import { useMobile } from '../hooks/use-mobile';
  export default function Chat() { /* ... */ }
  ```
- **API Route:**
  ```ts
  // src/app/api/psychology/route.ts
  export async function GET(req: Request) { /* ... */ }
  ```

## Recommendations for AI Agents
- Follow Next.js and TypeScript idioms
- Reference existing components and utilities for consistency
- Prefer colocated styles and hooks
- Document new patterns in this file for future agents

---
_If any section is unclear or missing, please provide feedback to improve these instructions._
