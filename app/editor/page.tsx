import { EditorHomeActions } from '@/components/editor/editor-home-actions';

export default function EditorPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <h1 className="mb-2 text-2xl font-bold text-text-primary tracking-tight">
        Create a project or open an existing one
      </h1>
      <p className="mb-8 max-w-md text-text-secondary">
        Start a new architecture workspace, or choose a project from the sidebar.
      </p>
      <EditorHomeActions />
    </div>
  );
}
