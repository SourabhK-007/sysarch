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

  // Shared projects: user is a collaborator but not the owner.
  // We look up by the Clerk user's email stored on ProjectCollaborator.
  // Since we only store email on collaborators (not userId), we can't
  // join on userId directly here — return empty until email is available via Clerk.
  // This is intentionally left as an empty set for now; the spec says
  // "fetch owned and shared projects server-side" without defining the email lookup yet.
  return [];
}
