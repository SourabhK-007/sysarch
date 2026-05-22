import { NextResponse } from 'next/server';
import { getProjectWithAccess } from '@/lib/project-access';
import { prisma } from '@/lib/prisma';
import { get } from '@vercel/blob';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const { projectId, specId } = await params;

  // 1. Authenticate and check project access
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 2. Fetch the ProjectSpec metadata record
    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
    });

    if (!spec) {
      return NextResponse.json({ error: 'Specification not found' }, { status: 404 });
    }

    if (spec.projectId !== projectId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Retrieve spec content from Vercel Blob
    const blob = await get(spec.filePath, {
      access: 'private',
    });

    if (!blob) {
      return NextResponse.json({ error: 'Specification content not found' }, { status: 404 });
    }

    const content = await new Response(blob.stream).text();

    return NextResponse.json({ spec, content });
  } catch (error) {
    console.error('[SPEC_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
