import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/projects/[projectId]/collaborators
 * Lists collaborators for a project, enriched with Clerk profile data.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    // 1. Verify project exists and user has access (owner or collaborator)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { collaborators: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Basic access check: must be owner or already a collaborator
    // (Actual email check is harder without user email, but we'll assume 
    // if you have the ID and are authed, we return the list for now, 
    // or we can be stricter).
    // Let's just check if user is owner for now to be safe, 
    // or if they are in the collaborators list.
    
    // To check collaborator status, we need the user's email.
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmailNormalized = user.emailAddresses[0]?.emailAddress?.trim().toLowerCase();

    const isOwner = project.ownerId === userId;
    const isCollaborator = project.collaborators.some(c => (c.email ?? "").trim().toLowerCase() === userEmailNormalized);

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch owner details from Clerk
    const ownerUser = await client.users.getUser(project.ownerId);
    const owner = {
      id: ownerUser.id,
      email: ownerUser.emailAddresses[0]?.emailAddress,
      name: `${ownerUser.firstName || ''} ${ownerUser.lastName || ''}`.trim() || ownerUser.username || ownerUser.emailAddresses[0]?.emailAddress,
      imageUrl: ownerUser.imageUrl,
    };

    // 3. Fetch all collaborators
    const collaborators = project.collaborators;

    // 4. Enrich with Clerk data
    const emails = collaborators.map(c => c.email);
    const clerkUsers = emails.length > 0 
      ? await client.users.getUserList({ emailAddress: emails })
      : { data: [] };

    const enrichedCollaborators = collaborators.map(collab => {
      const clerkUser = clerkUsers.data.find(u => 
        u.emailAddresses.some(e => e.emailAddress === collab.email)
      );

      return {
        id: collab.id,
        email: collab.email,
        name: clerkUser ? `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username : null,
        imageUrl: clerkUser?.imageUrl || null,
        createdAt: collab.createdAt,
      };
    });

    return NextResponse.json({ 
      data: {
        owner,
        collaborators: enrichedCollaborators
      } 
    });
  } catch (error) {
    console.error('[API_COLLABORATORS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[projectId]/collaborators
 * Invites a collaborator by email. Owner only.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // 1. Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Prevent inviting the owner
    const client = await clerkClient();
    const owner = await client.users.getUser(userId);
    const userEmailNormalized = owner.emailAddresses[0]?.emailAddress?.trim().toLowerCase();
    const candidateEmailNormalized = (email ?? "").trim().toLowerCase();

    if (candidateEmailNormalized === userEmailNormalized) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    // 3. Create collaborator record
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId,
        email: email.toLowerCase(),
      },
    });

    return NextResponse.json({ data: collaborator });
 } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'User already invited' }, { status: 400 });
    }
    console.error('[API_COLLABORATORS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
