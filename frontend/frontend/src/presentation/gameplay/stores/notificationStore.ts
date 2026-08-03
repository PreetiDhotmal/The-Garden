import { create } from "zustand";

export interface Notification {
  readonly id: string;
  readonly message: string;
}

interface NotificationState {
  readonly notifications: readonly Notification[];
  push: (message: string) => void;
  dismiss: (id: string) => void;
}

let nextId = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  push: (message) => {
    nextId += 1;
    const notification: Notification = { id: `notification-${String(nextId)}`, message };
    set((state) => ({ notifications: [...state.notifications, notification] }));
  },
  dismiss: (id) => {
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) }));
  },
}));
