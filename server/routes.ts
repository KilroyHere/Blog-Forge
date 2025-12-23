import type { Express } from "express";
import { type Server } from "http";
import multer from "multer";
import { initializeDatabase } from "./lib/supabase";
import { getAllPosts, getPostById, createPost, updatePost, deletePost } from "./services/posts";
import { uploadMedia, getMediaById, deleteMedia, cleanupMedia } from "./services/media";

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
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = await uploadMedia(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.code).json({ error: result.error });
    }
  });

  app.get("/api/media/:id", async (req, res) => {
    const result = await getMediaById(req.params.id);
    if (result.success) {
      const buffer = Buffer.from(result.data.data, 'base64');
      res.setHeader('Content-Type', result.data.mime_type);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(buffer);
    } else {
      res.status(result.code).json({ error: result.error });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    const result = await deleteMedia(req.params.id);
    if (result.success) {
      res.status(204).send();
    } else {
      res.status(result.code).json({ error: result.error });
    }
  });

  app.post("/api/media/cleanup", async (req, res) => {
    const result = await cleanupMedia(req.body.mediaIds);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.code).json({ error: result.error });
    }
  });

  return httpServer;
}
