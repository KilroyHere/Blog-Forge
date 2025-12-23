import { getSupabaseClient } from '../lib/supabase';
import { z } from 'zod';

export type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code: number };

const uuidSchema = z.string().uuid();

export interface MediaFile {
  id: string;
  filename: string;
  mime_type: string;
  data: string;
  size: number;
  created_at: string;
}

export interface UploadResult {
  url: string;
  fileName: string;
  id: string;
}

export async function uploadMedia(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  size: number
): Promise<ServiceResult<UploadResult>> {
  try {
    const supabase = getSupabaseClient();
    const base64Data = buffer.toString('base64');
    const fileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data, error } = await supabase
      .from('media')
      .insert([{
        filename: fileName,
        mime_type: mimeType,
        data: base64Data,
        size: size,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error: 'Failed to upload file', code: 500 };
    }

    return { 
      success: true, 
      data: { 
        url: `/api/media/${data.id}`, 
        fileName, 
        id: data.id 
      } 
    };
  } catch (err) {
    console.error('Upload error:', err);
    return { success: false, error: 'Upload failed', code: 500 };
  }
}

export async function getMediaById(id: string): Promise<ServiceResult<MediaFile>> {
  try {
    const parseResult = uuidSchema.safeParse(id);
    if (!parseResult.success) {
      return { success: false, error: 'Invalid media ID format', code: 400 };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return { success: false, error: 'Media not found', code: 404 };
    }

    return { success: true, data: data as MediaFile };
  } catch (err) {
    console.error('Media fetch error:', err);
    return { success: false, error: 'Failed to fetch media', code: 500 };
  }
}

export async function deleteMedia(id: string): Promise<ServiceResult<void>> {
  try {
    const parseResult = uuidSchema.safeParse(id);
    if (!parseResult.success) {
      return { success: false, error: 'Invalid media ID format', code: 400 };
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Media delete error:', error);
      return { success: false, error: 'Failed to delete media', code: 500 };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Media delete error:', err);
    return { success: false, error: 'Failed to delete media', code: 500 };
  }
}

export async function cleanupMedia(mediaIds: string[]): Promise<ServiceResult<{ deleted: number }>> {
  try {
    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return { success: false, error: 'Invalid media IDs', code: 400 };
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('media')
      .delete()
      .in('id', mediaIds);

    if (error) {
      console.error('Media cleanup error:', error);
      return { success: false, error: 'Failed to cleanup media', code: 500 };
    }

    return { success: true, data: { deleted: mediaIds.length } };
  } catch (err) {
    console.error('Media cleanup error:', err);
    return { success: false, error: 'Failed to cleanup media', code: 500 };
  }
}
