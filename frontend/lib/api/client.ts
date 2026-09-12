/**
 * Shared axios instance.
 *
 * The request interceptor is wired for you: it attaches the stored bearer
 * token. You should not need to set the Authorization header by hand anywhere
 * else in the app.
 *
 * The response interceptor clears rejected sessions while preserving errors.
 */
import axios from "axios";
import { getStoredToken, useAuthStore } from "@/lib/auth/authStore";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/wp-json/bemalearn/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // A delayed response from an old session must not clear a newer login.
      const sentHeader = error.config?.headers.Authorization;
      const currentToken = getStoredToken();
      if (currentToken && sentHeader === `Bearer ${currentToken}`) {
        useAuthStore.getState().signOut();
      }
    }
    // Preserve response/status so callers can distinguish refusals from outages.
    return Promise.reject(error);
  },
);

export default api;
