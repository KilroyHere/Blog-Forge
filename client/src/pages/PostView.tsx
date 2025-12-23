import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Post } from '@shared/schema';
import '@toast-ui/editor/dist/toastui-editor.css';

export default function PostView() {
  const params = useParams<{ id: string }>();

  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: ['/api/posts', params.id],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="max-w-3xl mx-auto px-6 py-12">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-32 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="max-w-3xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">
            Post not found
          </h1>
          <p className="text-muted-foreground mb-6">
            The post you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </main>
      </div>
    );
  }

  const formattedDate = format(new Date(post.created_at), 'MMMM d, yyyy');

  return (
    <div className="min-h-screen bg-background">
      <Header showBack />
      <article className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8">
          <h1 
            className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight"
            data-testid="text-post-title"
          >
            {post.title}
          </h1>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <time 
                dateTime={post.created_at}
                data-testid="text-post-date"
              >
                {formattedDate}
              </time>
            </div>
            <Link href={`/edit/${post.id}`}>
              <Button variant="outline" size="sm" data-testid="button-edit-post">
                <Edit className="w-4 h-4 mr-1.5" />
                Edit Post
              </Button>
            </Link>
          </div>
        </header>

        <div 
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:text-foreground prose-headings:leading-snug
            prose-p:text-foreground/90 prose-p:leading-normal prose-p:my-2
            prose-a:text-primary hover:prose-a:text-primary/80
            prose-strong:text-foreground
            prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:my-3
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:my-2
            prose-li:text-foreground/90 prose-li:my-0.5
            prose-ul:my-2 prose-ol:my-2
            prose-hr:border-border prose-hr:my-4
            [&_*]:leading-snug
            [&_code]:font-mono [&_pre]:font-mono [&_pre_code]:font-mono"
          dangerouslySetInnerHTML={{ __html: post.html }}
          data-testid="post-content"
        />
      </article>
    </div>
  );
}
