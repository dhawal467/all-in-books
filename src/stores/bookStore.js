import { create } from 'zustand';

export const useBookStore = create((set) => ({
  activeBookId: 'main',
  books: [{ id: 'main', name: 'Main Book' }],
  load: async () => {
    // Phase 1: Only 'main' book exists
  },
  setActive: (id) => set({ activeBookId: id }),
}));
