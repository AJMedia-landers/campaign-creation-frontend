"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";

type SocketCtxValue = {
  socket: Socket | null;
  setSocketToken: (token: string | null) => void;
};

const SocketCtx = createContext<SocketCtxValue>({
  socket: null,
  setSocketToken: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL!;
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/token", { cache: "no-store" });
        const json = (await res.json()) as { token: string | null };
        setToken(json?.token ?? null);
      } catch {
        setToken(null);
      } finally {
        setInitialized(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!initialized || !token) return;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(url, {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;

    // logs
    socket.on("connect", () => console.log("[socket] connected", socket.id));
    socket.on("disconnect", (reason) =>
      console.log("[socket] disconnected:", reason)
    );
    socket.on("connect_error", (e) =>
      console.log("[socket] connect_error:", e.message)
    );

    // cleanup
    return () => {
      socket.close();
    };
  }, [url, initialized, token]);

  // Stable ctx value
  const ctx = useMemo<SocketCtxValue>(
    () => ({
      socket: socketRef.current,
      setSocketToken: (t) => setToken(t),
    }),
    []
  );

  return <SocketCtx.Provider value={ctx}>{children}</SocketCtx.Provider>;
}

export function useSocket() {
  return useContext(SocketCtx);
}
