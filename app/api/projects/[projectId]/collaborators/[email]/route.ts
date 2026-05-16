import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/projects/[projectId]/collaborators/[email]
 * Removes a collaborator. Owner only.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string; email: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId, email } = await params;
  const decodedEmail = decodeURIComponent(email);

  try {
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

    // 2. Remove collaborator
    await prisma.projectCollaborator.delete({
      where: {
        projectId_email: {
          projectId,
          email: decodedEmail.toLowerCase(),
        },
      },
    });

    return NextResponse.json({ message: 'Collaborator removed' });
  } catch (error) {
    console.error('[API_COLLABORATORS_DELETE]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
