/**
 * Base URL for the FastAPI Python backend
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Persist session ID in memory + localStorage (FIXED)
 */
let SESSION_ID: string | null = null;

function getSessionId(): string {
  // Return from memory if already set
  if (SESSION_ID) return SESSION_ID;

  // Try to get from localStorage
  let stored = localStorage.getItem("session_id");

  // If not present → create new
  if (!stored) {
    stored = crypto.randomUUID();
    localStorage.setItem("session_id", stored);
  }

  // Save in memory
  SESSION_ID = stored;

  return SESSION_ID;
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

  // 🔥 Debug (important for checking same session)
  console.log("Session ID:", sessionId);

  const defaultHeaders: HeadersInit = {
    Accept: "application/json",
    "X-Session-ID": sessionId,
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
      } catch {}
    }

    throw new Error(errorMsg);
  }

  // Handle empty response
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}