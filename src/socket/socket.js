import { io } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

export const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  autoConnect: false,
});

socket.on("session-terminated", () => {
  const logout = useAuthStore.getState().logout;
  logout();
});