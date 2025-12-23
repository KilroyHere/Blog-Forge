import { getSupabaseClient } from '../supabase';
import { insertPostSchema, updatePostSchema, type Post, type InsertPost, type UpdatePost } from '../schema';
import { z } from 'zod';

export type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code: number; details?: unknown };

const uuidSchema = z.string().uuid();

export async function getAllPosts(): Promise<ServiceResult<Post[]>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return { success: false, error: 'Failed to fetch posts', code: 500 };
    }

    return { success: true, data: data as Post[] };
  } catch (err) {
    console.error('Error fetching posts:', err);
    return { success: false, error: 'Failed to fetch posts', code: 500 };
  }
}

export async function getPostById(id: string): Promise<ServiceResult<Post>> {
  try {
    const parseResult = uuidSchema.safeParse(id);
    if (!parseResult.success) {
      return { success: false, error: 'Invalid post ID format', code: 400 };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Post not found', code: 404 };
      }
      console.error('Error fetching post:', error);
      return { success: false, error: 'Failed to fetch post', code: 500 };
    }

    return { success: true, data: data as Post };
  } catch (err) {
    console.error('Error fetching post:', err);
    return { success: false, error: 'Failed to fetch post', code: 500 };
  }
}

export async function createPost(input: unknown): Promise<ServiceResult<Post>> {
  try {
    const parseResult = insertPostSchema.safeParse(input);
    if (!parseResult.success) {
      return { 
        success: false, 
        error: 'Invalid post data', 
        code: 400, 
        details: parseResult.error.issues 
      };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('posts')
      .insert([parseResult.data])
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return { success: false, error: 'Failed to create post', code: 500 };
    }

    return { success: true, data: data as Post };
  } catch (err) {
    console.error('Error creating post:', err);
    return { success: false, error: 'Failed to create post', code: 500 };
  }
}

export async function updatePost(id: string, input: unknown): Promise<ServiceResult<Post>> {
  try {
    const idParseResult = uuidSchema.safeParse(id);
    if (!idParseResult.success) {
      return { success: false, error: 'Invalid post ID format', code: 400 };
    }

    const parseResult = updatePostSchema.safeParse(input);
    if (!parseResult.success) {
      return { 
        success: false, 
        error: 'Invalid post data', 
        code: 400, 
        details: parseResult.error.issues 
      };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('posts')
      .update({ ...parseResult.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Post not found', code: 404 };
      }
      console.error('Error updating post:', error);
      return { success: false, error: 'Failed to update post', code: 500 };
    }

    return { success: true, data: data as Post };
  } catch (err) {
    console.error('Error updating post:', err);
    return { success: false, error: 'Failed to update post', code: 500 };
  }
}

export async function deletePost(id: string): Promise<ServiceResult<void>> {
  try {
    const parseResult = uuidSchema.safeParse(id);
    if (!parseResult.success) {
      return { success: false, error: 'Invalid post ID format', code: 400 };
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      return { success: false, error: 'Failed to delete post', code: 500 };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Error deleting post:', err);
    return { success: false, error: 'Failed to delete post', code: 500 };
  }
}
