import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface CreateProjectBody {
  name?: string;
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error('[PROJECTS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateProjectBody = {};
  try {
    body = await req.json();
  } catch {
    // no-op: body is optional, defaults apply below
  }

  const name = typeof body.name === 'string' && body.name.trim()
    ? body.name.trim()
    : 'Untitled Project';

  try {
    const project = await prisma.project.create({
      data: {
        name,
        ownerId: userId,
      },
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error('[PROJECTS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
