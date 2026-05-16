# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 05: Prisma Setup (Completed)

## Current Goal

- Implement sharing system with collaborator management and Clerk profile enrichment.

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

- **Feature 04 — Project Dialogs** ✓
  - Created `ProjectDialogsProvider` and `useProjectDialogs` hook for centralized state management.
  - Implemented 'Create', 'Rename', and 'Delete' dialogs using shadcn/ui components.
  - Added real-time URL-safe slug preview to the 'Create' dialog.
  - Updated `/editor` home view with a minimal layout and 'New Project' action.
  - Wired mock project data into `ProjectSidebar` with hover actions for renaming and deleting.
  - Added a mobile backdrop scrim to easily close the sidebar on smaller screens.

- **Feature 05 — Prisma Setup** ✓
  - Created `prisma/models/project.prisma` with `Project` and `ProjectCollaborator` models.
  - Implemented `lib/prisma.ts` as a cached singleton with Accelerate extension and `@prisma/adapter-pg` fallback.
  - Updated `prisma.config.ts` to load `.env.local` to securely pull `DATABASE_URL`.
  - Generated Prisma Client and ran `init_project_models` migration.
  - Verified `npm run build` passes successfully.

- **Feature 06 — Project APIs** ✓
  - Implemented `GET /api/projects` to list current user's projects.
  - Implemented `POST /api/projects` to create new projects with default names.
  - Implemented `PATCH /api/projects/[projectId]` to rename projects, with owner checks.
  - Implemented `DELETE /api/projects/[projectId]` to delete projects, with owner checks.
  - Handled 401 and 403 authorization correctly using Clerk.
  - Verified `npm run build` passes successfully.

- **Feature 07 — Wire Editor Home** ✓
  - Fetched owned and shared projects server-side in `app/editor/layout.tsx`.
  - Created `useProjectActions` hook for project mutations (create, rename, delete).
  - Wired real project data into `ProjectSidebar` and connected dialogs.
  - Verified navigation to workspace on creation and redirect/refresh on delete/rename.

- **Feature 08 — Editor Workspace Shell** ✓
  - Implemented `lib/project-access.ts` for server-side identity and access checks.
  - Created `AccessDenied` component for unauthorized project access.
  - Updated `EditorLayout`, `EditorNavbar`, and `ProjectSidebar` to support workspace context and active project highlighting.
  - Implemented `/editor/[roomId]` server component with access validation and canvas placeholder.
  - Verified `npm run build` passes successfully.

- **Feature 09 — Share Dialog** ✓
  - Implemented API routes for collaborator listing, invitation, and removal with ownership checks.
  - Integrated Clerk Backend API for user profile enrichment (names/avatars).
  - Created `ShareDialog` component with invitation logic and collaborator list.
  - Wired "Share" button in `EditorNavbar` and updated `EditorLayout` for ownership context.
  - Verified `npm run build` passes successfully.

## In Progress

- None.


## Next Up

- Feature 10 (TBD).

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Using shadcn/ui with Tailwind CSS v4 (CSS-native config via `@theme inline`). No `tailwind.config.js` is generated.
- `components/ui/*` files are not to be modified post-install (per `ai-workflow-rules.md`).

## Session Notes

- Project uses Next.js 16.2.6, React 19.2.4, Tailwind CSS v4.
- shadcn/ui init uses `npx shadcn@latest init` with `--yes` flag for non-interactive install.
- CSS design tokens defined in `ui-context.md` must be reflected in `globals.css` via `@theme inline`.
