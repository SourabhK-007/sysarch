import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { auth as triggerAuth } from '@trigger.dev/sdk/v3';
import { prisma } from '@/lib/prisma';

interface TokenRequestBody {
  runId: string;
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: TokenRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  const { runId } = body;

  if (!runId || typeof runId !== 'string') {
    return NextResponse.json({ error: 'runId is required' }, { status: 400 });
  }

  try {
    // 1. Look up the task run in the database to verify it exists and belongs to this user
    const taskRun = await prisma.taskRun.findUnique({
      where: { runId },
    });

    if (!taskRun) {
      return NextResponse.json({ error: 'Task run not found' }, { status: 404 });
    }

    if (taskRun.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Issue a public Trigger.dev token scoped strictly to that run
    const token = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[AI_SPEC_TOKEN_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
