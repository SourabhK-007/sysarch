import { auth } from '@clerk/nextjs/server';
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

  // 1. Get user's email from Clerk
  const { currentUser } = await import('@clerk/nextjs/server');
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

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
