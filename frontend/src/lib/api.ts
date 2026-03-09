const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "pilgrim";
};

export const getSavedToken = () => localStorage.getItem("jwtToken") || "";

export const saveToken = (token: string) => {
  localStorage.setItem("jwtToken", token.trim());
};

export const clearToken = () => {
  localStorage.removeItem("jwtToken");
};

export const getSavedUser = (): AuthUser | null => {
  const raw = localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const saveUser = (user: AuthUser) => {
  localStorage.setItem("authUser", JSON.stringify(user));
};

export const clearUser = () => {
  localStorage.removeItem("authUser");
};

export const clearSession = () => {
  clearToken();
  clearUser();
};

type RequestOptions = RequestInit & {
  token?: string;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { token, headers, ...rest } = options;
  const requestHeaders = new Headers(headers || {});
  if (!requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const authToken = token || getSavedToken();
  if (authToken) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};
