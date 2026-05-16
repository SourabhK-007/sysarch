import { getProjectWithAccess } from '@/lib/project-access';
import { AccessDenied } from '@/components/editor/access-denied';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  const project = await getProjectWithAccess(roomId);

  if (!project) {
    return <AccessDenied />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
        <svg
          className="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
          />
        </svg>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-text-primary tracking-tight">
        {project.name} Workspace
      </h1>
      <p className="max-w-md text-text-secondary">
        Architecture canvas placeholder. Interactive diagramming and system design components coming soon.
      </p>
    </div>
  );
}
