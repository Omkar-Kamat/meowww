import { create } from "zustand";
import api from "../api/axios";

export const useAuthStore = create((set) => ({
    user: null,
    isAuthChecked: false,

    fetchMe: async () => {
        try {
            const { data } = await api.get("/api/auth/me");
            set({ user: data, isAuthChecked: true });
        } catch {
            set({ user: null, isAuthChecked: true });
        }
    },

    logout: async () => {
        try {
            await api.post("/api/auth/logout");
        } catch (err) {
            console.log(err);
        }

        set({ user: null });
        window.location.href = "/login";
    },
}));
