import { EditorLayout } from "@/components/editor/editor-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <EditorLayout>{children}</EditorLayout>;
}
