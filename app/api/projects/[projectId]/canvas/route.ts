import { NextResponse } from 'next/server';
import { getProjectWithAccess } from '@/lib/project-access';
import { prisma } from '@/lib/prisma';
import { put, get } from '@vercel/blob';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Verify project access
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { nodes?: any[]; edges?: any[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { nodes = [], edges = [] } = body;
  console.log('[CANVAS_PUT] Saving canvas for project:', { projectId, nodesCount: nodes.length, edgesCount: edges.length });

  try {
    // 1. Upload canvas state to Vercel Blob
    const filename = `canvas-${projectId}.json`;
    const canvasDataString = JSON.stringify({ nodes, edges });
    
    const blob = await put(filename, canvasDataString, {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true
    });

    console.log('[CANVAS_PUT] Saved to Vercel Blob:', blob.url);

    // 2. Store the returned blob URL in the Prisma project record
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        canvasJsonPath: blob.url,
      },
    });

    return NextResponse.json({ data: updatedProject });
  } catch (error) {
    console.error('[CANVAS_PUT_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error during save' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Verify project access
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  console.log('[CANVAS_GET] Loading canvas for project:', { projectId, canvasJsonPath: project.canvasJsonPath });

  // If there's no saved URL yet, return an empty canvas state
  if (!project.canvasJsonPath) {
    return NextResponse.json({ nodes: [], edges: [] });
  }

  try {
    // Fetch the canvas JSON stream securely from Vercel Blob with private access
    const blob = await get(project.canvasJsonPath, {
      access: 'private',
    });

    if (!blob) {
      return NextResponse.json({ error: 'Canvas state not found in storage' }, { status: 404 });
    }

    return new NextResponse(blob.stream, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[CANVAS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error during load' }, { status: 500 });
  }
}
