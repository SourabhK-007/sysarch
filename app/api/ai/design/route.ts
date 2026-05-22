import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { tasks } from '@trigger.dev/sdk/v3';
import type { designAgentTask } from '@/trigger/design-agent';
import { getProjectWithAccess } from '@/lib/project-access';
import { prisma } from '@/lib/prisma';

interface DesignRequestBody {
  prompt: string;
  roomId: string;
  projectId: string;
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: DesignRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  const { prompt, roomId, projectId } = body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }
  if (!roomId || typeof roomId !== 'string') {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }
  if (!projectId || typeof projectId !== 'string') {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  // Verify the user has access to this project before triggering any work
  const project = await getProjectWithAccess(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Trigger the background task — fire and forget (no waiting for result)
    const handle = await tasks.trigger<typeof designAgentTask>('design-agent', {
      prompt: prompt.trim(),
      roomId,
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
    console.error('[AI_DESIGN_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
