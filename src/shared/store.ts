import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, User } from '@/entities/types';

interface AppState {
  currentRole: Role;
  currentUser: User | null;
  sidebarOpen: boolean;
  setRole: (role: Role, user: User | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentRole: 'Applicant',
      currentUser: null,
      sidebarOpen: true,
      setRole: (role, user) => set({ currentRole: role, currentUser: user }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    { name: 'smartptw-session' },
  ),
);
