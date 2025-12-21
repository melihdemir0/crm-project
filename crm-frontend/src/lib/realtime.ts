import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./authStorage";

const SOCKET_URL = "http://localhost:3000"; // backend host (api.ts ile aynı)

let socket: Socket | null = null;

export function connectRealtime() {
  const token = getAccessToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(`${SOCKET_URL}/realtime`, {
    transports: ["websocket"],
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("[realtime] connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[realtime] disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.log("[realtime] connect_error:", err?.message ?? err);
  });

  // ✅ admin bildirimlerini yakala
  socket.on("admin.notification", (payload) => {
    console.log("[admin.notification]", payload);
  });

  return socket;
}

export function disconnectRealtime() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getRealtimeSocket() {
  return socket;
}
