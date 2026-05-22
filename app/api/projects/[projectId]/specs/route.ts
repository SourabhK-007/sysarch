import { NextResponse } from 'next/server';
import { getProjectWithAccess } from '@/lib/project-access';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // 1. Authenticate and check project access
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 2. Fetch all generated ProjectSpec metadata records for this project sorted by createdAt DESC
    const specs = await prisma.projectSpec.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ specs });
  } catch (error) {
    console.error('[SPECS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
