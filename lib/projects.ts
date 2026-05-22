import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import type { Project } from '@/lib/generated/prisma/client';

export type ProjectRow = Pick<Project, 'id' | 'name' | 'ownerId' | 'status' | 'createdAt' | 'updatedAt'>;

/**
 * Returns owned projects for the currently authenticated user.
 * Must be called from a server context.
 */
export async function getOwnedProjects(): Promise<ProjectRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      ownerId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Returns projects shared with the currently authenticated user via collaborator membership.
 * Must be called from a server context.
 */
export async function getSharedProjects(): Promise<ProjectRow[]> {
  const { userId } = await auth();
  if (!userId) return [];

  // currentUser() makes an HTTP call to Clerk's backend API.
  // If the Clerk API is temporarily unreachable, return an empty list
  // rather than crashing the layout.
  let email: string | undefined;
  try {
    const user = await currentUser();
    email = user?.emailAddresses[0]?.emailAddress;
  } catch (err) {
    console.warn('[getSharedProjects] currentUser() failed — skipping shared projects:', err);
    return [];
  }

  if (!email) return [];

  // 2. Fetch projects where user is a collaborator but not the owner
  return prisma.project.findMany({
    where: {
      ownerId: { not: userId },
      collaborators: {
        some: {
          email: email.toLowerCase(),
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      ownerId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
