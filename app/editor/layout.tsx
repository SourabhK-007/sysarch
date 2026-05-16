import { EditorLayout } from '@/components/editor/editor-layout';
import { getOwnedProjects, getSharedProjects } from '@/lib/projects';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(),
    getSharedProjects(),
  ]);

  return (
    <EditorLayout
      ownedProjects={ownedProjects.map((p) => ({ id: p.id, name: p.name }))}
      sharedProjects={sharedProjects.map((p) => ({ id: p.id, name: p.name }))}
    >
      {children}
    </EditorLayout>
  );
}


