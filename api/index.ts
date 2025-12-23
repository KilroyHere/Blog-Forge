import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import formidable from 'formidable';
import { readFileSync } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

const postSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  markdown: z.string(),
  html: z.string(),
  excerpt: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
const insertPostSchema = postSchema.omit({ id: true, created_at: true, updated_at: true });
const updatePostSchema = insertPostSchema.partial();
const uuidSchema = z.string().uuid();

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function parseBody(req: VercelRequest): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

async function handleUpload(req: VercelRequest, res: VercelResponse) {
  const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
  
  return new Promise<void>((resolve) => {
    form.parse(req, async (err, _fields, files) => {
      if (err) {
        res.status(400).json({ error: 'Failed to parse upload' });
        return resolve();
      }

      const fileArray = files.file;
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
      
      if (!file) {
        res.status(400).json({ error: 'No file provided' });
        return resolve();
      }

      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      if (!allowed.includes(file.mimetype || '')) {
        res.status(400).json({ error: 'Invalid file type' });
        return resolve();
      }

      try {
        const supabase = getSupabaseClient();
        const originalName = file.originalFilename || 'file';
        const fileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const fileBuffer = readFileSync(file.filepath);
        const base64Data = fileBuffer.toString('base64');

        const { data, error: insertError } = await supabase
          .from('media')
          .insert([{
            filename: fileName,
            mime_type: file.mimetype || 'application/octet-stream',
            data: base64Data,
            size: file.size,
          }])
          .select()
          .single();

        if (insertError) {
          res.status(500).json({ error: 'Failed to upload file', details: insertError.message });
          return resolve();
        }

        const url = `/api/media/${data.id}`;
        res.json({ url, fileName, id: data.id });
        resolve();
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
        resolve();
      }
    });
  });
}

async function handleMediaGet(id: string, res: VercelResponse) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const buffer = Buffer.from(data.data, 'base64');
    res.setHeader('Content-Type', data.mime_type);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);
  } catch (err) {
    console.error('Media fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabaseClient();
  const url = req.url || '';

  try {
    // Handle file upload
    if (url.includes('/api/upload') && req.method === 'POST') {
      return handleUpload(req, res);
    }

    // Handle media retrieval
    const mediaMatch = url.match(/\/api\/media\/([^?]+)/);
    if (mediaMatch && req.method === 'GET') {
      return handleMediaGet(mediaMatch[1], res);
    }

    // Handle media deletion
    if (mediaMatch && req.method === 'DELETE') {
      const { error } = await supabase.from('media').delete().eq('id', mediaMatch[1]);
      if (error) return res.status(500).json({ error: 'Failed to delete media' });
      return res.status(204).end();
    }

    // Handle media cleanup (bulk delete)
    if (url.includes('/api/media/cleanup') && req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      let body = req.body;
      if (!body && contentType.includes('application/json')) {
        body = await parseBody(req);
      }
      const { mediaIds } = body || {};
      if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        return res.status(400).json({ error: 'Invalid media IDs' });
      }
      const { error } = await supabase.from('media').delete().in('id', mediaIds);
      if (error) return res.status(500).json({ error: 'Failed to cleanup media' });
      return res.json({ deleted: mediaIds.length });
    }

    // Parse JSON body for non-upload requests
    const contentType = req.headers['content-type'] || '';
    let body = req.body;
    if (!body && contentType.includes('application/json')) {
      body = await parseBody(req);
    }

    const match = url.match(/\/api\/posts(?:\/([^?]+))?/);
    const id = match?.[1];

    if (req.method === 'GET' && url.includes('/api/posts') && !id) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Failed to fetch posts' });
      return res.status(200).json(data);
    }

    if (req.method === 'GET' && id) {
      if (!uuidSchema.safeParse(id).success) {
        return res.status(400).json({ error: 'Invalid post ID format' });
      }
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
      if (error) return res.status(500).json({ error: 'Failed to fetch post' });
      return res.status(200).json(data);
    }

    if (req.method === 'POST' && url.includes('/api/posts') && !id) {
      const parsed = insertPostSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid post data', details: parsed.error.issues });
      }
      const { data, error } = await supabase
        .from('posts')
        .insert([parsed.data])
        .select()
        .single();
      if (error) return res.status(500).json({ error: 'Failed to create post' });
      return res.status(201).json(data);
    }

    if (req.method === 'PUT' && id) {
      if (!uuidSchema.safeParse(id).success) {
        return res.status(400).json({ error: 'Invalid post ID format' });
      }
      const parsed = updatePostSchema.safeParse(body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid post data', details: parsed.error.issues });
      }
      const { data, error } = await supabase
        .from('posts')
        .update({ ...parsed.data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error?.code === 'PGRST116') return res.status(404).json({ error: 'Post not found' });
      if (error) return res.status(500).json({ error: 'Failed to update post' });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE' && id) {
      if (!uuidSchema.safeParse(id).success) {
        return res.status(400).json({ error: 'Invalid post ID format' });
      }
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) return res.status(500).json({ error: 'Failed to delete post' });
      return res.status(204).end();
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
