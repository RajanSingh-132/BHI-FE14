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

type ChatResponse = { answer: string; type?: string };

function getChunkText(payload: any): string {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.delta === "string") return payload.delta;
  if (typeof payload.token === "string") return payload.token;
  if (typeof payload.content === "string") return payload.content;
  if (payload.data && typeof payload.data === "object") {
    if (typeof payload.data.delta === "string") return payload.data.delta;
    if (typeof payload.data.token === "string") return payload.data.token;
    if (typeof payload.data.content === "string") return payload.data.content;
  }
  return "";
}

function getFinalAnswer(payload: any): string {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.answer === "string") return payload.answer;
  if (payload.data && typeof payload.data === "object" && typeof payload.data.answer === "string") {
    return payload.data.answer;
  }
  return "";
}

/**
 * Chat route streaming helper. Supports JSON and SSE/line-stream responses.
 */
export async function fetchChatStream(
  endpoint: string,
  body: Record<string, unknown>,
  onChunk?: (chunk: string) => void
): Promise<ChatResponse> {
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const sessionId = getSessionId();
  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "X-Session-ID": sessionId,
    },
    body: JSON.stringify(body),
  });

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

  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/json")) {
    const json = (await response.json()) as ChatResponse;
    if (json?.answer && onChunk) onChunk(json.answer);
    return json;
  }

  if (!response.body) {
    return { answer: "" };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let finalAnswer = "";
  let finalType: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith(":")) continue;
      if (line.startsWith("event:") || line.startsWith("id:") || line.startsWith("retry:")) continue;

      const payloadText = line.startsWith("data:") ? line.slice(5).trim() : line;
      if (!payloadText || payloadText === "[DONE]") continue;

      try {
        const payload = JSON.parse(payloadText);
        const chunk = getChunkText(payload);
        const answer = getFinalAnswer(payload);

        if (typeof payload?.type === "string") {
          finalType = payload.type;
        } else if (typeof payload?.data?.type === "string") {
          finalType = payload.data.type;
        }

        if (answer) {
          finalAnswer = answer;
          continue;
        }

        if (chunk) {
          accumulated += chunk;
          if (onChunk) {
            onChunk(chunk);
            // Add a small delay to allow React to render the chunk, creating a word-by-word typing effect
            await new Promise(resolve => setTimeout(resolve, 30));
          }
        }
      } catch {
        accumulated += payloadText;
        onChunk?.(payloadText);
      }
    }
  }

  const result = finalAnswer || accumulated;
  return { answer: result, type: finalType };
}
