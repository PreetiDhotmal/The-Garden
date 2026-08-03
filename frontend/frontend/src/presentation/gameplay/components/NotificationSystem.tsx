import { useEffect } from "react";
import { useNotificationStore } from "../stores/notificationStore";

const AUTO_DISMISS_MS = 4000;

export function NotificationSystem() {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismiss = useNotificationStore((state) => state.dismiss);

  useEffect(() => {
    const timeouts = notifications.map((notification) =>
      window.setTimeout(() => {
        dismiss(notification.id);
      }, AUTO_DISMISS_MS)
    );
    return () => {
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, [notifications, dismiss]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed left-4 top-20 z-40 flex flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="rounded-md border border-garden-700 bg-black/80 px-3 py-2 text-sm text-light-divine"
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
}
