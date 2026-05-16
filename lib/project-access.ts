import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function getClerkIdentity() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  return { userId, email };
}

export async function getProjectWithAccess(projectId: string) {
  const identity = await getClerkIdentity();
  if (!identity) return null;

  const { userId, email } = identity;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      collaborators: true,
    },
  });

  if (!project) return null;

  // Owner check
  if (project.ownerId === userId) {
    return project;
  }

  // Collaborator check
  if (email && project.collaborators.some((c) => c.email === email)) {
    return project;
  }

  return null;
}
