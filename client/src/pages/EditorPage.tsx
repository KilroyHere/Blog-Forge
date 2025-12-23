import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { SaveIndicator } from '@/components/SaveIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Save, Trash2 } from 'lucide-react';
import type { Post, InsertPost } from '@shared/schema';

function extractMediaIds(markdown: string): string[] {
  const regex = /\/api\/media\/([a-f0-9-]+)/g;
  const ids: string[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    ids.push(match[1]);
  }
  return Array.from(new Set(ids));
}

export default function EditorPage() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = Boolean(params.id);

  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const originalMediaIdsRef = useRef<string[]>([]);

  const { data: existingPost, isLoading: isLoadingPost } = useQuery<Post>({
    queryKey: ['/api/posts', params.id],
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setMarkdown(existingPost.markdown);
      setHtml(existingPost.html);
      originalMediaIdsRef.current = extractMediaIds(existingPost.markdown);
    }
  }, [existingPost]);

  const cleanupRemovedMedia = async (currentMarkdown: string) => {
    const currentMediaIds = extractMediaIds(currentMarkdown);
    const removedIds = originalMediaIdsRef.current.filter(id => !currentMediaIds.includes(id));
    
    if (removedIds.length > 0) {
      try {
        await apiRequest('POST', '/api/media/cleanup', { mediaIds: removedIds });
        console.log(`Cleaned up ${removedIds.length} removed images`);
      } catch (error) {
        console.error('Failed to cleanup removed media:', error);
      }
    }
    
    originalMediaIdsRef.current = currentMediaIds;
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertPost) => {
      const response = await apiRequest('POST', '/api/posts', data);
      return response.json();
    },
    onSuccess: async (newPost: Post) => {
      originalMediaIdsRef.current = extractMediaIds(markdown);
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      toast({
        title: 'Post created',
        description: 'Your post has been saved successfully.',
      });
      setLocation(`/edit/${newPost.id}`);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertPost) => {
      await cleanupRemovedMedia(data.markdown);
      const response = await apiRequest('PUT', `/api/posts/${params.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', params.id] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      toast({
        title: 'Post updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      toast({
        title: 'Error',
        description: 'Failed to update post. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const mediaIds = extractMediaIds(markdown);
      if (mediaIds.length > 0) {
        try {
          await apiRequest('POST', '/api/media/cleanup', { mediaIds });
        } catch (error) {
          console.error('Failed to cleanup media on delete:', error);
        }
      }
      await apiRequest('DELETE', `/api/posts/${params.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: 'Post deleted',
        description: 'Your post has been removed.',
      });
      setLocation('/');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleEditorChange = useCallback((newMarkdown: string, newHtml: string) => {
    setMarkdown(newMarkdown);
    setHtml(newHtml);
  }, []);

  const generateExcerpt = (text: string): string => {
    const plainText = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\n/g, ' ')
      .trim();
    return plainText.slice(0, 150) + (plainText.length > 150 ? '...' : '');
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your post.',
        variant: 'destructive',
      });
      return;
    }

    setSaveStatus('saving');
    const postData: InsertPost = {
      title: title.trim(),
      markdown,
      html,
      excerpt: generateExcerpt(markdown),
    };

    if (isEditing) {
      updateMutation.mutate(postData);
    } else {
      createMutation.mutate(postData);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingPost) {
    return (
      <div className="min-h-screen bg-background">
        <Header showBack />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-[500px] w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showBack title={isEditing ? 'Edit Post' : 'New Post'} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-bold border-0 border-b border-border rounded-none px-0 py-3 focus-visible:ring-0 focus-visible:border-primary bg-transparent placeholder:text-muted-foreground/50"
            data-testid="input-title"
          />
        </div>

        <div className="mb-6">
          <MarkdownEditor
            initialValue={markdown}
            height="500px"
            onChange={handleEditorChange}
            placeholder="Start writing your post..."
          />
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? 'Saving...' : 'Save Post'}
            </Button>
          </div>

          {isEditing && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-delete"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </main>

      <SaveIndicator status={saveStatus} />
    </div>
  );
}
