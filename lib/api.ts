/**
 * Base URL for the FastAPI Python backend
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Generate or get session ID (persist in browser)
 */
function getSessionId(): string {
  let sessionId = localStorage.getItem("session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("session_id", sessionId);
  }

  return sessionId;
}

/**
 * Enhanced fetch wrapper for API calls to the backend
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const sessionId = getSessionId();

  const defaultHeaders: HeadersInit = {
    Accept: "application/json",
    "X-Session-ID": sessionId, // 🔥 IMPORTANT
  };

  // Only add Content-Type if NOT FormData
  const isFormData = options.body instanceof FormData;

  if (!isFormData) {
    (defaultHeaders as any)["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Error handling
  if (!response.ok) {
    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      try {
        const textData = await response.text();
        if (textData) errorMsg = textData;
      } catch { }
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}