import { create } from "zustand";

interface SidebarState {
  expanded: boolean;
  hidden: boolean;
  drawerOpen: boolean;
  toggleExpanded: () => void;
  toggleHidden: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  expanded: true,
  hidden: false,
  drawerOpen: false,
  toggleExpanded: () => set((state) => ({ expanded: !state.expanded })),
  toggleHidden: () => set((state) => ({ hidden: !state.hidden, drawerOpen: false })),
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
}));
