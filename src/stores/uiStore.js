import { create } from 'zustand';
import { generateUUID } from '../utils/uuid.js';

export const useUiStore = create((set) => ({
  activeTab: 0,
  toasts: [],
  modals: {},
  fabVisible: true,
  lastUsedType: 'SALE',

  setTab: (tabIndex) => set({ activeTab: tabIndex }),
  setLastUsedType: (type) => set({ lastUsedType: type }),
  
  showToast: (message, type = 'success') => {
    const id = generateUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    // Auto-remove after 2.5s per acceptance criteria
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 2500);
  },

  openModal: (name, data = null) => set((state) => ({
    modals: { ...state.modals, [name]: { isOpen: true, data } }
  })),

  closeModal: (name) => set((state) => ({
    modals: { ...state.modals, [name]: { isOpen: false, data: null } }
  })),
}));
