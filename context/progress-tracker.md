# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 03: Authentication

## Current Goal

- Wrap root layout with `ClerkProvider` using Clerk's `dark` theme
- Create sign-in and sign-up pages (`app/sign-in` and `app/sign-up`) with simple two-panel layout
- Add `proxy.ts` at the project root for route protection
- Update `/` to redirect users based on auth status
- Add `UserButton` to `EditorNavbar`

## Completed

- **Feature 01 — Design System** ✓
  - shadcn/ui initialized with Nova preset (Lucide + Geist), Tailwind v4 detected automatically.
  - Components installed: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea (`components/ui/`).
  - `lucide-react` installed (bundled as shadcn dependency).
  - `lib/utils.ts` created with `cn()` helper (clsx + tailwind-merge).
  - `globals.css` updated: shadcn/ui semantic tokens remapped to the Loom AI dark palette; project-specific tokens (`--bg-base`, `--accent-primary`, etc.) defined in `:root` and exposed via `@theme inline`.
  - Build passes with zero TypeScript errors.

- **Feature 02 — Editor Navbar and Sidebar** ✓
  - Created `EditorNavbar` component with toggle sidebar functionality and structural sections.
  - Created `ProjectSidebar` component that floats over the canvas and supports Tabs for "My Projects" and "Shared".
  - Updated Dialog pattern in `components/ui/dialog.tsx` to align with the Loom AI design system (rounded-3xl, dark backdrop blur).

- **Feature 03 — Authentication** ✓
  - Installed `@clerk/ui` and configured `ClerkProvider` in root layout with `dark` theme.
  - Created layout for auth pages featuring a simple two-panel design with logo and short text feature list.
  - Set up `app/sign-in` and `app/sign-up` using Clerk's standard components, customized using CSS variables.
  - Added `proxy.ts` at root level for route protection.
  - Added `UserButton` to `EditorNavbar`.
  - Configured home route (`/`) to conditionally redirect to `/editor` or `/sign-in` based on auth status.
  - Verified `npm run build` passes successfully.

## In Progress

- None.

## Next Up

- Feature 04 (TBD — check feature-specs directory for next spec).

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Using shadcn/ui with Tailwind CSS v4 (CSS-native config via `@theme inline`). No `tailwind.config.js` is generated.
- `components/ui/*` files are not to be modified post-install (per `ai-workflow-rules.md`).

## Session Notes

- Project uses Next.js 16.2.6, React 19.2.4, Tailwind CSS v4.
- shadcn/ui init uses `npx shadcn@latest init` with `--yes` flag for non-interactive install.
- CSS design tokens defined in `ui-context.md` must be reflected in `globals.css` via `@theme inline`.
