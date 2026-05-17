import { getProjectWithAccess } from '@/lib/project-access';
import { AccessDenied } from '@/components/editor/access-denied';
import { CollaborativeCanvasWrapper } from '@/components/editor/collaborative-canvas';

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  const project = await getProjectWithAccess(roomId);

  if (!project) {
    return <AccessDenied />;
  }

  return <CollaborativeCanvasWrapper roomId={roomId} />;
}
