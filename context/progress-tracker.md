# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- All core features completed successfully! ✓

## Current Goal

- Fully validated, compiled, and integrated the entire design workspace and system specification engine.


## Completed

- **Product Rebranding: Ghost AI to Loom AI** ✓
  - Successfully replaced all occurrences of the legacy "Ghost AI" product name with "Loom AI" across all application codebases and files.
  - Rebranded the interactive workspace sidebar interface UI labels, placeholders, and status text messages.
  - Updated LLM background tasks (both design agent and technical spec generator) system prompts and streaming progress status updates to refer to the agent as "Loom AI".
  - Updated related context documents and feature specifications to keep documentation in sync.

- **Feature 29 — Spec UI Integration** ✓
  - Designed and built a compact specifications list inside the `<AISidebar />` Specs tab dynamically loaded from `ProjectSpec` API.
  - Resolved JSX syntax root violations by wrapping sibling output elements in a standard React Fragment.
  - Implemented high-fidelity premium dynamic `<Dialog />` previews showcasing loaded markdown inside a scrollable layout with loaders.
  - Overrode dialog width via inline styles (`maxWidth: '896px', width: 'calc(100vw - 3rem)'`) to resolve Tailwind v4 custom class conflicts and expand viewport properly on larger screens.
  - Removed browser-native scrollbars from the `<ScrollArea>` layout, enabling a clean, custom-scrolled HSL dark scrollbar handle.
  - Scaled technical typography sizes across headers (`h1`/`h2`/`h3`), paragraphs (`p`), list elements (`li`), data tables, and inline code blocks inside `<MarkdownPreview />` to look gorgeous and publication-grade.
  - Integrated inline download shortcuts on both list cards and modal footers utilizing raw file stream APIs with premium brand-purple transitions and scale micro-animations.
  - Verified a successful production compile with zero compilation warnings or TypeScript errors.


- **Feature 27 & 28 — Spec Generation Flow, Persistence and Download** ✓
  - Designed and created the `ProjectSpec` PostgreSQL model linked to the `Project` model.
  - Successfully synced database schemas with `npx prisma db push` and regenerated the Prisma Client.
  - Implemented the Trigger.dev `specGeneratorTask` background task that fetches Liveblocks room coordinates, feeds progress statuses, runs Gemini (`gemini-2.5-flash`) spec drafting, saves output to Vercel Blob with secure private parameters, and persists metadata in SQL.
  - Developed a full suite of backend route handlers: spec triggering (`POST /api/ai/spec`), public task-run token issuance (`POST /api/ai/spec/token`), project specs listing (`GET /api/projects/[projectId]/specs`), preview content fetching (`GET /api/projects/[projectId]/specs/[specId]`), and stream-download attachment routing (`GET /api/projects/[projectId]/specs/[specId]/download`).
  - Styled a premium responsive UI specs panel inside `<AISidebar />` supporting click triggering, custom Markdown rendering with header decoration and dynamic interactive tables, a multi-version dropdown history selector, and instant browser-driven downloads.
  - Integrated full Trigger.dev `useRealtimeRun` status trackers for live feedback.

- **Feature 26 — Design Agent Frontend** ✓
  - Passed `projectId` to the `<AISidebar />` client component inside `components/editor/editor-layout.tsx` to provide active workspace room context.
  - Integrated Trigger.dev `useRealtimeRun` inside `<AISidebar />` to monitor the task run in real time.
  - Resolved `Missing accessToken in TriggerAuthContext` runtime crash by passing `enabled: !!runId && !!accessToken` to the hook options, disabling client polling until task credentials are ready.
  - Made the chat box fully scrollable by enforcing height boundaries on nested flex elements in the sidebar layout (`Tabs`, `TabsContent`, and `ScrollArea`) using `min-h-0` classes, and enhanced the auto-scroll viewport query selector to find both Radix and Shadcn viewport slots.
  - Wired up prompt submission (`POST /api/ai/design`) and run-token generation (`POST /api/ai/design/token`) to authenticate and trigger real-time updates securely.
  - Implemented a unified `isPending` state that locks the textarea, send button, and starter chip prompts immediately during active AI runs to avoid race conditions.
  - Bound the real-time tracking states to reset on terminal run states (`COMPLETED`, `FAILED`, `CANCELED`).

- **Feature 25 — Sidebar Chat Feed** ✓
  - Established a real-time room-scoped collaborative chat feed named `ai-chat` using Liveblocks `RoomEvent`.
  - Added full Zod-backed payload validation schemas and runtime parsing utilities in `types/tasks.ts`.
  - Overhauled the `<AISidebar />` component to subscribe to live room chat events, bind user info via `useSelf()`, broadcast sent messages, and clear chat input instantly.
  - Styled a premium responsive UI displaying avatar bubbles symmetrically (me on the right, other collaborators on the left) with fallback initials and short formatted timestamps.
  - Verified a successful production build with zero compiler warnings or TypeScript errors.

- **Feature 24 — AI Presence State** ✓
  - Connected collaborator presence `thinking` status to live cursor badges with spinning indicators.
  - Wired `@liveblocks/react` `useMyPresence` and `useBroadcastEvent` in the `<AISidebar />` component to collaboratively toggle thinking states and broadcast room-wide status events.
  - Successfully verified that the entire application compiles and builds flawlessly with zero TypeScript compiler errors.

- **Feature 22 — Design Agent API** ✓
  - Created `prisma/models/task-run.prisma` with `TaskRun` model: `runId` (unique), `projectId`, `userId`, `createdAt`, index on `runId`, compound index on `userId + projectId`.
  - Ran migration `20260519121807_add_task_run` and regenerated Prisma Client.
  - Created `trigger/design-agent.ts` exporting `designAgentTask` (id: `design-agent`): accepts `prompt` and `roomId`, logs input, returns stub — no AI logic yet.
  - Created `POST /api/ai/design`: validates auth + project ownership via `getProjectWithAccess`, triggers `design-agent` via `tasks.trigger`, persists `TaskRun` record, returns `runId`.
  - Created `POST /api/ai/design/token`: validates auth, looks up `TaskRun` by `runId`, checks `userId` ownership, issues a Trigger.dev public token scoped to that run via `auth.createPublicToken`.
  - Verified `npm run build` passes with zero TypeScript errors. Both routes visible in build output.

  - Installed `@trigger.dev/sdk` and `@trigger.dev/build` packages.
  - Created `trigger.config.ts` at the project root with `maxDuration: 300` and `dirs: ["./trigger"]`.
  - Created `trigger/` directory and `trigger/example.ts` with a Hello World smoke-test task.
  - Added `trigger:dev` script to `package.json`.
  - Added `TRIGGER_SECRET_KEY` placeholder to `.env.local`.
  - Verified `npm run build` passes with zero TypeScript errors.
  - **Remaining manual steps**: replace `YOUR_PROJECT_REF` in `trigger.config.ts` with your Trigger.dev project ref, and replace `TRIGGER_SECRET_KEY` in `.env.local` with your dev API key from the dashboard.

  - Resolved selected nodes/edges deletion by changing `onKeyDown` to `onKeyDownCapture` on the canvas wrapper, bypassing React Flow's event suppression and properly invoking Liveblocks' collaborative `onDelete`.
  - Implemented fully bidirectional four-sided connection handles on all shapes by rendering overlapping `source` and `target` handles at each position (`top`, `right`, `bottom`, `left`) while maintaining exact schema IDs for backwards-compatibility.
  - Adjusted the canvas drag-and-drop handler to subtract half of the node's dimensions (`width / 2` and `height / 2`), ensuring dropped nodes are centered exactly under the cursor.
  - Disabled automatic initialization zoom/fit-view on first node drop by removing the `fitView` prop from `<ReactFlow>` (retaining explicit programmatic `fitView` calls during templates imports and database load).
  - Whitelisted `img.clerk.com` inside `next.config.ts`'s `remotePatterns` to allow error-free collaborator avatar rendering.
  - Cleaned up the workspace navbar by conditionally rendering Clerk's `UserButton` only on the editor home screen, completely removing it from the active collaborative workspace view.
  - Implemented Figma-style keyless multi-element selection by importing and configuring `SelectionMode.Partial`, `selectionOnDrag={canvasMode === 'pointer'}`, and `selectionKeyCode={null}` in the `<ReactFlow>` canvas. This allows drawing a selection box directly via click-and-drag in Pointer mode, and added a premium dashed cyan marquee selection box styling in `app/globals.css` matching the dark technical aesthetic.
  - Added Pointer (Selection Tool) and Hand (Pan Tool) modes inside the elements Shape Panel, complete with standard Figma-style `MousePointer2` and `Hand` icons, dynamic grab cursor styles on the canvas wrapper, elements dragging/connecting/selection locking in Pan mode, and standard keyboard shortcut listeners (`V` for Pointer, `H` for Hand).
  - Restored native React Flow edge selection by allowing click events to bubble up from our custom edge path (removing blocking `e.stopPropagation()` handlers). This enables React Flow's native state machine to capture the selection correctly, which automatically triggers the reconnection anchors (`.react-flow__edgeupdater`).
  - Added a highly robust window-level event listener for Delete/Backspace keypresses, resolving elements deletion issues completely (even when clicking on custom edges or canvas nodes, which normally moves focus away from wrapper container).
  - Enabled dynamic edge reconnection by adding `edgesReconnectable={true}` and `onReconnect={onReconnect}` from `@xyflow/react` to `<ReactFlow>`. Reconnecting edges is done by clicking and dragging the glowing cyan handle circles at the ends of selected edges.
  - Formatted reconnection handles using proper SVG attributes (`fill`, `stroke`, `stroke-width`, `r`, and a drop-shadow glow filter) inside `app/globals.css` to make dragging handles perfectly visible and highly satisfying.

- **Feature 21 — Canvas Autosave & Database Persistence** ✓
  - Installed `@vercel/blob` npm package for secure cloud object storage.
  - Reused the existing `canvasJsonPath: String?` schema field on the Prisma `Project` record to store the Vercel Blob URL, keeping metadata lean.
  - Implemented `PUT /api/projects/[projectId]/canvas` which verifies Clerk authentication and collaborator access, uploads the latest canvas `{ nodes, edges }` to Vercel Blob, and updates the Prisma project record.
  - Implemented `GET /api/projects/[projectId]/canvas` which verifies project access, retrieves the Vercel Blob URL from the database, fetches the raw canvas JSON from the blob storage, and returns it.
  - Created a custom debounced `useCanvasAutosave` hook that watches for canvas state changes, debounces saves (to avoid excessive server writes), and broadcasts statuses.
  - Integrated the loading/autosave framework inside `components/editor/collaborative-canvas.tsx`. On mount, if the Liveblocks room is empty, it fetches and collaboratively restores the saved state. If the room has active elements, it skips loading to protect current collaboration.
  - Developed a premium Cloud Save status button in the `components/editor/editor-navbar.tsx` toolbar, displaying dynamic states (`Saving...`, `Saved`, `Save Error`) mapped to theme-specific HSL variables, and allowing manual force-saving immediately on click.

- **Feature 20 — AI Sidebar Shell** ✓
  - Separated the AI sidebar into a clean, dedicated `<AISidebar />` component under `components/editor/ai-sidebar.tsx`.
  - Preserved existing slide transition animations, floating position overlay (`fixed top-14 right-0`), and shadow treatment (`shadow-2xl`).
  - Added a premium header showing "AI Workspace", subtitle "Collaborate with Loom AI", small bot icon, and right-aligned close action.
  - Implemented a two-tab shadcn `Tabs` layout supporting an active indigo accent theme and muted inactive states.
  - Built the **AI Architect** panel containing a scrollable `ScrollArea` for conversations, custom Bot empty state with clickable starter prompt pills (which autofill the input area), right/left bubble styling (cyan user message bubble vs dark assistant bubble), and auto-resizing text area (min 72px, max 160px) supporting `Enter` to send.
  - Built the **Specs** panel featuring a "Generate Spec" CTA button, a static markdown preview snippet of system architecture, and a disabled download action card.
  - Mounted the dynamic `<AISidebar />` component inside `components/editor/editor-layout.tsx`, fully replacing the static placeholder.

- **Feature 19 — Collaborative Presence, Avatars, and Live Cursors** ✓
  - Updated Liveblocks typed Presence context to include `cursor: { x: number; y: number } | null` and `thinking: boolean`.
  - Created a dynamic, conditional `RoomContextWrapper` in `components/editor/editor-layout.tsx` that hosts `LiveblocksProvider` and `RoomProvider` exclusively when inside active room views, keeping the home layout/navbar entirely independent of Liveblocks.
  - Implemented `<CollaboratorAvatars />` showing up to 5 overlapping avatars inside active rooms with custom image fallback to initials and ring boundaries, and displaying a compact `+N` count.
  - Created `<PresenceNavbarGroup />` bundling collaborators list, conditional separator line, and Clerk's standard `UserButton` scaled perfectly to `h-8 w-8`.
  - Wired `EditorNavbar` to conditionally mount `PresenceNavbarGroup` inside the active canvas room.
  - Created `<LiveCursor />` component displaying collaborator pointers and badges, and `<LiveCursorsLayer />` projecting flow-space coordinate positions back to constant-size screen space.
  - Wired mouse movement trackers `onMouseMove` / `onMouseLeave` inside `CollaborativeCanvas` to project viewport coordinates to flow space and broadcast them collaboratively via presence.
  - Successully resolved redundant Liveblocks context connections inside the main canvas wrapper component.

- **Feature 18 — Starter Templates** ✓
  - Created `CanvasTemplate` interface and static `CANVAS_TEMPLATES` array in `components/editor/starter-templates.ts` supporting standard colors and shapes.
  - Implemented `components/editor/starter-templates-modal.tsx` with dynamic, auto-scaling lightweight SVG visual previews of architectures (Microservices, Event-Driven, CI/CD Pipeline).
  - Added "Templates" action button in `components/editor/editor-navbar.tsx` visible when a room workspace is active.
  - Wired CustomEvent-based modal triggering and import behavior inside `components/editor/collaborative-canvas.tsx`, completely replacing previous canvas content on import and correctly centering elements via `fitView()`.
  - Passed production build checks (`npm run build`) successfully with zero type errors.

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
  - Updated `/editor home view with a minimal layout and 'New Project' action.
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

- **Feature 10 — Liveblocks Setup** ✓
  - Updated `liveblocks.config.ts` with typed Presence and UserMeta.
  - Implemented cached Liveblocks node client in `lib/liveblocks.ts` with a deterministic color helper.
  - Created `POST /api/liveblocks-auth` route for secure room access with project verification.
  - Verified `npm run build` passes successfully.

- **Feature 11 — Real-time Collaborative Canvas** ✓
  - Created `types/canvas.ts` containing `canvasNode`, `canvasEdge`, `NODE_COLORS`, and `NODE_SHAPES`.
  - Built client component `CollaborativeCanvasWrapper` with `CanvasErrorBoundary`, `LiveblocksProvider`, `RoomProvider`, `ClientSideSuspense`, and a premium CSS loader fallback.
  - Built `CollaborativeCanvas` inner component leveraging `@xyflow/react` (v12) and `@liveblocks/react-flow` with `ConnectionMode.Loose`, custom thin edge line aesthetics, dot-pattern background, and a beautifully dark-styled `MiniMap`.
  - Replaced the placeholder in the server component `app/editor/[roomId]/page.tsx` with `<CollaborativeCanvasWrapper roomId={roomId} />`, preserving server-side access validation.
  - Verified a successful production build with Turbopack and TypeScript compiles.

- **Feature 12 — Shape Panel (Drag and Drop)** ✓
  - Created floating pill-shaped `<ShapePanel>` toolbar at the bottom-center of the canvas.
  - Provided draggable buttons for Rectangle, Decision, Event, Service, Database, and External shapes using Lucide icons.
  - Implemented client-side `CustomCanvasNodeRenderer` rendering nodes as styled boxes with top, right, bottom, and left handles revealed on hover.
  - Integrated `onDragOver` and `onDrop` event handlers inside `<ReactFlowProvider>` using React Flow's `screenToFlowPosition` and `setNodes` to programmatically insert nodes.
  - Verified a successful production build with Turbopack and TypeScript compiles.

- **Feature 13 — Node Shapes and Drag Previews** ✓
  - Implemented reusable `<ShapeRenderer>` rendering standard shapes (`rectangle`, `pill`, `circle`) using CSS styling.
  - Implemented SVG rendering for complex shapes (`diamond`, `hexagon`, `cylinder`) that scale smoothly with the node's dimensions.
  - Handled non-scaling borders using `vector-effect="non-scaling-stroke"` to keep borders razor-sharp regardless of node size.
  - Bound selected state to dynamic theme highlights using node-specific contrast color pairings (`NODE_COLORS`).
  - Created native custom ghost drag previews in `<ShapePanel>` by utilizing an off-screen `<ShapeRenderer>` bundle and `event.dataTransfer.setDragImage`.
  - Verified a successful production build with Turbopack and TypeScript compiles.

- **Feature 14 — Canvas Node Resizing & Inline Label Editing** ✓
  - Integrated React Flow `<NodeResizer>` controls shown only on selected nodes.
  - Set strict minimum width/height limits to prevent shapes from being resized to zero/invisible bounds.
  - Custom styled resize handles to match Loom AI's premium dark-theme branding (subtle offscreen elements that turn glowing cyan on hover).
  - Designed double-click inline label editing vertically and horizontally centered in all CSS and SVG shapes.
  - Added `nodrag` and `nopan` class overrides to the textarea, ensuring text editing does not trigger canvas drag or pan actions.
  - Used `useReactFlow()` to mutate node data, syncing label edits in real-time across collaborators using the existing Liveblocks room flow.
  - Added auto-focus and auto-selection of text when launching editor mode.
  - Verified a successful production build with Turbopack and TypeScript compiles.

- **Feature 15 — Canvas Node Color Toolbar** ✓
  - Added floating color toolbar centered above selected canvas nodes (`absolute -top-12 left-1/2 -translate-x-1/2`).
  - Handled 8 high-contrast color swatches from the `NODE_COLORS` palette in `types/canvas.ts`.
  - Added active status styling (matching color border and center inset dot) and hover animation (controlled tight glow based on the swatch text color).
  - Fully bypassed event bubbling for toolbar interactions (clicks, mouse downs, and pointer downs) using `nodrag nopan` and `e.stopPropagation()`.
  - Integrated with collaborative canvas state via React Flow's `setNodes` hook, updating node fill/text colors seamlessly across collaborators in real time.
  - Verified compile checks pass perfectly without warnings or type errors.

- **Feature 16 — Custom Edge Behavior & Inline Label Editing** ✓
  - Configured four-sided connection handles (`top`, `right`, `bottom`, `left`) on all nodes with subtle styling (small white dots with dark border, faded in on hover).
  - Created a custom edge renderer `CustomCanvasEdgeRenderer` registered as type `canvasEdge` and configured it as the default edge type inside React Flow.
  - Implemented clean right-angle routing with rounded corners using React Flow's `getSmoothStepPath` (`borderRadius: 8`).
  - Added visual highlight states (dimmed at rest, brightened to text-primary when hovered or selected).
  - Engineered dual-path SVG structure (invisible thick helper `strokeWidth={15}` for hover + thin visible stroke) making edges incredibly easy to click and hover.
  - Built interactive inline edge label editing: double-clicking the edge path or the badge launches a growing HTML input centered at the path's midpoint using `EdgeLabelRenderer`.
  - Added click and input event isolation (`nodrag nopan` plus `e.stopPropagation()`) preventing canvas drag or pan actions.
  - Handled blur, Enter, or Escape key events to save or discard label edits, updating edges collaboratively in real-time.
  - Rendered saved labels as small pill badges and added a faint dashed hint badge (`Double-click to label`) for active unlabeled edges.
  - Verified a successful production compile with zero TypeScript errors.

- **Feature 17 — Canvas Ergonomics** ✓
  - Added a floating pill-shaped control bar at the bottom-left of the canvas.
  - Wired React Flow zoom controls with smooth animations.
  - Wired Liveblocks undo and redo handlers with dynamic visual states (dimmed/disabled) when the history stack is empty.
  - Created a custom `useKeyboardShortcuts` hook to process keyboard shortcuts: `=` / `+` (Zoom In), `-` (Zoom Out), `Cmd/Ctrl + Z` (Undo), `Cmd/Ctrl + Shift + Z` (Redo), and `Cmd/Ctrl + Y` (Redo).
  - Isolated keyboard shortcut processing so standard keys are ignored while active focus is on input fields, textareas, or content-editable text areas.
  - Removed the default React Flow `<MiniMap>`.
  - Passed all TypeScript compile and build checks.
- Resolved "RoomProvider is missing from the React tree" runtime crash by conditionally rendering `<AISidebar />` in `EditorLayout` only when `activeProjectId` is present.

## In Progress

- None.

## Next Up


- None.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Using shadcn/ui with Tailwind CSS v4 (CSS-native config via `@theme inline`). No `tailwind.config.js` is generated.
- `components/ui/*` files are not to be modified post-install (per `ai-workflow-rules.md`).

## Session Notes

- Project uses Next.js 16.2.6, React 19.2.4, Tailwind CSS v4.
- shadcn/ui init uses `npx shadcn@latest init` with `--yes` flag for non-interactive install.
- CSS design tokens defined in `ui-context.md` must be reflected in `globals.css` via `@theme inline`.
