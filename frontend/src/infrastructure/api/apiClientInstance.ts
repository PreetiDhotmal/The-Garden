import { ApiClient } from "./ApiClient";
import { useAuthStore } from "@/presentation/stores/authStore";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export const apiClient = new ApiClient({
  baseUrl,
  getAuthToken: () => useAuthStore.getState().token,
});
