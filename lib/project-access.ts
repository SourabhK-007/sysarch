import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function getClerkIdentity() {
  const { userId } = await auth();
  if (!userId) return null;

  // currentUser() makes an HTTP call to Clerk's backend API.
  // Guard against transient network failures so owner-only access
  // (which only needs userId from the JWT) is never blocked.
  let email: string | undefined;
  try {
    const user = await currentUser();
    email = user?.emailAddresses[0]?.emailAddress;
  } catch (err) {
    console.warn('[getClerkIdentity] currentUser() failed — collaborator email unavailable:', err);
  }

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
