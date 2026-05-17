import { currentUser } from '@clerk/nextjs/server';
import { getProjectWithAccess } from '@/lib/project-access';
import { liveblocks, getUserColor } from '@/lib/liveblocks';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Get the room from the request body
  const { room } = await request.json();

  if (!room) {
    return new Response('Missing room ID', { status: 400 });
  }

  // Verify project access
  // The roomId is the projectId
  const project = await getProjectWithAccess(room);
  if (!project) {
    return new Response('Forbidden', { status: 403 });
  }

  // Get current user details from Clerk
  const user = await currentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Prepare the user info for Liveblocks Presence
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || 'Anonymous';
  const avatar = user.imageUrl;
  const color = getUserColor(user.id);

  // Start a Liveblocks session
  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name,
      avatar,
      color,
    },
  });

  // Give the user full access to the room
  // In the future, we could refine this based on project roles
  session.allow(room, session.FULL_ACCESS);

  // Authorize the session and return the response
  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
