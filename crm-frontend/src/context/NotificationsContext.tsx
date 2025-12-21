import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getRealtimeSocket } from "../lib/realtime";
import { useAuth } from "./AuthContext";

export type AdminNotification = {
  type: string;
  actor: { id: number; email: string; role: string };
  entity?: string;
  entityId?: number;
  message?: string;
  meta?: any;
  at: string;
};

type CtxValue = {
  items: AdminNotification[];
  unread: number;
  markAllRead: () => void;
  clear: () => void;
};

const Ctx = createContext<CtxValue>(null!);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthed, role } = useAuth();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthed || role !== "admin") {
      setItems([]);
      setUnread(0);
      return;
    }

    const s = getRealtimeSocket();
    if (!s) return;

    const onNotif = (payload: AdminNotification) => {
      setItems((prev) => [payload, ...prev].slice(0, 20)); // son 20
      setUnread((u) => u + 1);
    };

    s.on("admin.notification", onNotif);
    return () => {
      s.off("admin.notification", onNotif);
    };
  }, [isAuthed, role]);

  const value = useMemo<CtxValue>(
    () => ({
      items,
      unread,
      markAllRead: () => setUnread(0),
      clear: () => {
        setItems([]);
        setUnread(0);
      },
    }),
    [items, unread]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  return useContext(Ctx);
}
