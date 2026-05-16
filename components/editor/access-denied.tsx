import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AccessDenied() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-bg-subtle text-accent-primary">
        <Lock className="h-8 w-8" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-text-primary tracking-tight">
        Access Denied
      </h1>
      <p className="mb-8 max-w-md text-text-secondary">
        You don't have permission to view this project, or it may not exist.
        Please contact the owner for access.
      </p>
      <Button asChild variant="outline">
        <Link href="/editor">
          Return to Dashboard
        </Link>
      </Button>
    </div>
  );
}
