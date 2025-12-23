// Storage module - not used in this app since we use Supabase directly
// Kept for compatibility with the template structure

export interface IStorage {}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
