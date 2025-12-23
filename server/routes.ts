import type { Express } from "express";
import { type Server } from "http";
import multer from "multer";
import { initializeDatabase, getSupabaseClient } from "@shared/supabase";
import { getAllPosts, getPostById, createPost, updatePost, deletePost } from "@shared/services/posts";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await initializeDatabase();

  app.get("/api/posts", async (_req, res) => {
    const result = await getAllPosts();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.code).json({ error: result.error });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    const result = await getPostById(req.params.id);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.code).json({ error: result.error });
    }
  });

  app.post("/api/posts", async (req, res) => {
    const result = await createPost(req.body);
    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(result.code).json({ error: result.error, details: result.details });
    }
  });

  app.put("/api/posts/:id", async (req, res) => {
    const result = await updatePost(req.params.id, req.body);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.code).json({ error: result.error, details: result.details });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    const result = await deletePost(req.params.id);
    if (result.success) {
      res.status(204).send();
    } else {
      res.status(result.code).json({ error: result.error });
    }
  });

  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const supabase = getSupabaseClient();
      const base64Data = req.file.buffer.toString('base64');
      const fileName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { data, error } = await supabase
        .from('media')
        .insert([{
          filename: fileName,
          mime_type: req.file.mimetype,
          data: base64Data,
          size: req.file.size,
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to upload file', details: error.message });
      }

      const url = `/api/media/${data.id}`;
      res.json({ url, fileName, id: data.id });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  app.get("/api/media/:id", async (req, res) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', req.params.id)
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
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        console.error('Media delete error:', error);
        return res.status(500).json({ error: 'Failed to delete media' });
      }

      res.status(204).send();
    } catch (err) {
      console.error('Media delete error:', err);
      res.status(500).json({ error: 'Failed to delete media' });
    }
  });

  app.post("/api/media/cleanup", async (req, res) => {
    try {
      const { mediaIds } = req.body;
      if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        return res.status(400).json({ error: 'Invalid media IDs' });
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('media')
        .delete()
        .in('id', mediaIds);

      if (error) {
        console.error('Media cleanup error:', error);
        return res.status(500).json({ error: 'Failed to cleanup media' });
      }

      res.json({ deleted: mediaIds.length });
    } catch (err) {
      console.error('Media cleanup error:', err);
      res.status(500).json({ error: 'Failed to cleanup media' });
    }
  });

  return httpServer;
}
