import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { tasks } from '@trigger.dev/sdk/v3';
import type { specGeneratorTask } from '@/trigger/spec-generator';
import { getProjectWithAccess } from '@/lib/project-access';
import { prisma } from '@/lib/prisma';

interface SpecRequestBody {
  projectId: string;
  roomId: string;
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SpecRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  const { projectId, roomId } = body;

  if (!projectId || typeof projectId !== 'string') {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }
  if (!roomId || typeof roomId !== 'string') {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }

  // Verify the user has access to this project before triggering any work
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Trigger the background task — fire and forget
    const handle = await tasks.trigger<typeof specGeneratorTask>('spec-generator', {
      projectId,
      roomId,
      userId,
    });

    // Persist the run record so we can verify ownership on the token route
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId,
      },
    });

    return NextResponse.json({ runId: handle.id });
  } catch (error) {
    console.error('[AI_SPEC_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
