import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Calendar } from 'lucide-react';
import type { Post } from '@shared/schema';
import { format } from 'date-fns';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const formattedDate = format(new Date(post.created_at), 'MMM d, yyyy');

  return (
    <Card 
      className="group hover-elevate transition-all duration-150"
      data-testid={`card-post-${post.id}`}
    >
      <CardHeader className="pb-3">
        <h3 
          className="text-xl font-semibold line-clamp-2 text-foreground"
          data-testid={`text-title-${post.id}`}
        >
          {post.title || 'Untitled Post'}
        </h3>
      </CardHeader>
      <CardContent className="pb-4">
        <p 
          className="text-sm text-muted-foreground line-clamp-3 leading-relaxed"
          data-testid={`text-excerpt-${post.id}`}
        >
          {post.excerpt || 'No content yet...'}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-4 pt-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span data-testid={`text-date-${post.id}`}>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/post/${post.id}`}>
            <Button 
              variant="ghost" 
              size="sm"
              data-testid={`button-view-${post.id}`}
            >
              <Eye className="w-4 h-4 mr-1.5" />
              View
            </Button>
          </Link>
          <Link href={`/edit/${post.id}`}>
            <Button 
              variant="outline" 
              size="sm"
              data-testid={`button-edit-${post.id}`}
            >
              <Edit className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
