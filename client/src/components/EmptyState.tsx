import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileText, PenLine } from 'lucide-react';

export function EmptyState() {
  return (
    <div 
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      data-testid="empty-state"
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        No posts yet
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Start your blogging journey by creating your first post. Share your thoughts, ideas, and stories with the world.
      </p>
      <Link href="/new">
        <Button size="lg" data-testid="button-create-first-post">
          <PenLine className="w-5 h-5 mr-2" />
          Create Your First Post
        </Button>
      </Link>
    </div>
  );
}
