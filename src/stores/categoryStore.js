import { create } from 'zustand';
import { db } from '../db/db.js';

export const useCategoryStore = create((set, get) => ({
  categories: [],
  
  load: async () => {
    const categories = await db.categories.where('bookId').equals('main').toArray();
    set({ categories });
  },

  add: async (data) => {
    // Categories use auto-increment numeric internal IDs if ++id is used, 
    // but schema says ++id, bookId, type
    const categoryId = await db.categories.add({
      ...data,
      bookId: 'main',
      isDefault: false
    });
    await get().load();
    return categoryId;
  },

  remove: async (id) => {
    const category = await db.categories.get(id);
    if (category && category.isDefault) {
      throw new Error('Cannot delete default categories');
    }
    await db.categories.delete(id);
    await get().load();
  }
}));
