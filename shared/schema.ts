import { z } from "zod";

// Post schema for Supabase
export const postSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  markdown: z.string(),
  html: z.string(),
  excerpt: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const insertPostSchema = postSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updatePostSchema = insertPostSchema.partial();

export type Post = z.infer<typeof postSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;

// Media schema for storing images/files in database
export const mediaSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  mime_type: z.string(),
  data: z.string(), // base64 encoded
  size: z.number(),
  created_at: z.string(),
});

export const insertMediaSchema = mediaSchema.omit({
  id: true,
  created_at: true,
});

export type Media = z.infer<typeof mediaSchema>;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
