"use client";

import React, {
  createContext,
  useContext,
  useEffect,
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
  const [socket, setSocket] = useState<Socket | null>(null);

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
    if (!initialized || !token) {
      setSocket(null);
      return;
    }

    const newSocket = io(url, {
      transports: ["websocket"],
      auth: { token },
    });

    setSocket(newSocket);

    // logs
    newSocket.on("connect", () => console.log("[socket] connected", newSocket.id));
    newSocket.on("disconnect", (reason) =>
      console.log("[socket] disconnected:", reason)
    );
    newSocket.on("connect_error", (e) =>
      console.log("[socket] connect_error:", e.message)
    );

    // cleanup
    return () => {
      newSocket.close();
      setSocket(null);
    };
  }, [url, initialized, token]);

  // Context value updates when socket state changes
  const ctx: SocketCtxValue = {
    socket,
    setSocketToken: setToken,
  };

  return <SocketCtx.Provider value={ctx}>{children}</SocketCtx.Provider>;
}

export function useSocket() {
  return useContext(SocketCtx);
}
