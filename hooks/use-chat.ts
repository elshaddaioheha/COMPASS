"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  Conversation,
  Message,
  FeedbackRating,
  LanguageCode,
} from "@/lib/types";
import { DEFAULT_LANGUAGE } from "@/lib/constants";
import { useLocalStorage } from "./use-local-storage";
import { toast } from "sonner";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "");

// Render's free tier spins the backend down after ~15 min idle, so the first
// request can take up to ~60s to wake it. Give each attempt a generous timeout
// and retry the "service waking" responses (502/503/504) Render returns.
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1_500;

// HTTP statuses Render/proxies return while a cold-starting service is not ready.
const COLD_START_STATUSES = new Set([502, 503, 504]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Utility ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Fire-and-forget ping to wake a sleeping backend as soon as the app loads,
// so it's likely awake by the time the user sends their first message.
async function warmUpBackend(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    await fetch(`${API_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
  } catch {
    // Ignore — this is only a best-effort wake-up.
  }
}

function generateTitle(content: string): string {
  const cleaned = content.trim();
  const firstSentence = cleaned.split(/[.!?\n]/)[0].trim();
  const text = firstSentence || cleaned;
  const maxLength = 35;
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 15 ? `${truncated.slice(0, lastSpace)}…` : `${truncated}…`;
}

// ─── Flask API call ───────────────────────────────────────────────────────────

interface ApiResponse {
  reply: string;
  emotion: string | null;
  confidence: number | null;
  error?: string;
}

// A genuine application-level HTTP error (4xx/5xx) that should NOT be retried,
// as opposed to a transient cold-start/network failure.
class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function callChatApi(
  message: string,
  sessionId: string,
  language: LanguageCode,
): Promise<ApiResponse> {
  // Build the request body. Always send the input language hint; when the user
  // picked a specific language (not "auto"), also force the reply language so
  // Yoruba/Pidgin users get replies back in their language.
  const body: Record<string, string> = {
    message,
    session_id: sessionId,
    language,
  };
  if (language !== "auto") {
    body.reply_language = language;
  }

  let lastError: unknown;

  // Retry the cold-start cases (timeout, network drop, 502/503/504) so a
  // sleeping Render backend that wakes mid-request still gets answered.
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // session_id ties this call to a specific conversation context in Flask
        body: JSON.stringify(body),
        credentials: "include", // send cookies (Flask session fallback)
        signal: controller.signal,
      });

      // Backend still waking — retry instead of surfacing an error.
      if (COLD_START_STATUSES.has(res.status)) {
        throw new Error(`backend waking (${res.status})`);
      }

      if (!res.ok) {
        // A real application error (400/429/500…) — don't retry these.
        let errMsg = `Server error (${res.status})`;
        try {
          const data = await res.json();
          if (data && (data.reply || data.error)) {
            errMsg = data.reply || data.error;
          }
        } catch {
          const text = await res.text().catch(() => "");
          if (text) errMsg = text;
        }
        throw new ApiError(errMsg, res.status);
      }

      return (await res.json()) as ApiResponse;
    } catch (err) {
      lastError = err;
      // Don't retry genuine 4xx/5xx app errors — only cold-start/network ones.
      if (err instanceof ApiError) throw err;
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1)); // linear backoff
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Request failed after retries");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat() {
  const storage = useLocalStorage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showCrisisDialog, setShowCrisisDialog] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isTyping, setIsTyping] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = storage.getConversations();
    setConversations(saved);
    if (saved.length > 0) {
      setActiveConversationId(saved[0].id);
    }
    setLanguageState(storage.getLanguage());
    setInitialized(true);
    // Wake a possibly-sleeping backend now, so it's ready by send time.
    void warmUpBackend();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Language preference (persisted) ──────────────────────────────────────────

  const setLanguage = useCallback(
    (next: LanguageCode) => {
      setLanguageState(next);
      storage.setLanguage(next);
    },
    [storage],
  );

  // ── Derived state ──────────────────────────────────────────────────────────

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  // ── Persist helper ─────────────────────────────────────────────────────────

  const persist = useCallback(
    (updated: Conversation[]) => {
      setConversations(updated);
      storage.setConversations(updated);
    },
    [storage],
  );

  // ── Create new conversation ────────────────────────────────────────────────

  const createConversation = useCallback(() => {
    const newConvo: Conversation = {
      id: generateId(),
      title: "New Conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newConvo, ...conversations];
    persist(updated);
    setActiveConversationId(newConvo.id);
    return newConvo.id;
  }, [conversations, persist]);

  // ── Switch conversation ────────────────────────────────────────────────────

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  // ── Delete conversation ────────────────────────────────────────────────────

  const deleteConversation = useCallback(
    (id: string) => {
      const updated = conversations.filter((c) => c.id !== id);
      persist(updated);
      if (activeConversationId === id) {
        setActiveConversationId(updated.length > 0 ? updated[0].id : null);
      }
    },
    [conversations, activeConversationId, persist],
  );

  // ── Clear all conversations ────────────────────────────────────────────────

  const clearAllConversations = useCallback(() => {
    persist([]);
    setActiveConversationId(null);
  }, [persist]);

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      let convoId = activeConversationId;
      let current = [...conversations];

      // Auto-create conversation if none active
      if (!convoId) {
        const newConvo: Conversation = {
          id: generateId(),
          title: generateTitle(content),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        convoId = newConvo.id;
        current = [newConvo, ...current];
        setActiveConversationId(convoId);
      }

      const idx = current.findIndex((c) => c.id === convoId);
      if (idx < 0) return;

      // Append user message immediately (optimistic update)
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      const withUser: Conversation[] = current.map((c, i) =>
        i === idx
          ? {
            ...c,
            messages: [...c.messages, userMsg],
            title:
              c.title === "New Conversation"
                ? generateTitle(content)
                : c.title,
            updatedAt: Date.now(),
          }
          : c,
      );
      persist(withUser);
      setIsTyping(true);

      // Call Flask API and append bot reply
      const sessionId = convoId; // Each conversation = isolated session context
      callChatApi(content.trim(), sessionId, language)
        .then((data) => {
          const botMsg: Message = {
            id: generateId(),
            role: "assistant",
            content: data.reply,
            timestamp: Date.now(),
            emotion: data.emotion ?? undefined,
            confidence: data.confidence ?? undefined,
          };

          // ─── Crisis & Depression detection ──────────────────────────────────
          const isSuicidal = data.emotion === "suicidal";
          const isSevereDepression = data.emotion === "depression" && typeof data.confidence === "number" && data.confidence >= 0.65;

          if (isSuicidal) {
            // Self-harm / suicidal is highly critical -> Open the Modal immediately AND show an urgent Toast
            setShowCrisisDialog(true);
            toast.error("Critical Safety Notice", {
              description: "Thoughts of self-harm detected. Please reach out to emergency services or a crisis line immediately.",
              duration: 15000,
              action: {
                label: "Call Hotlines",
                onClick: () => setShowCrisisDialog(true),
              },
            });
          } else if (isSevereDepression) {
            // Depression with high confidence -> Show warning Toast with quick helpline access
            toast.warning("Support Resources Available", {
              description: "You seem to be going through a difficult time. You don't have to carry this alone.",
              duration: 10000,
              action: {
                label: "Get Support",
                onClick: () => setShowCrisisDialog(true),
              },
            });
          }

          setConversations((prev) => {
            const copy = prev.map((c) =>
              c.id === convoId
                ? {
                  ...c,
                  messages: [...c.messages, botMsg],
                  updatedAt: Date.now(),
                }
                : c,
            );
            storage.setConversations(copy);
            return copy;
          });
        })
        .catch((err) => {
          console.error("[COMPASS] API error:", err);
          
          let displayMsg = "I couldn't reach the server just now — it may be waking up from sleep, which can take up to a minute on the free tier. Please send your message again in a moment. 🔌";
          
          if (err instanceof ApiError) {
            if (err.status === 429) {
              displayMsg = `Rate Limit Exceeded: ${err.message} ⏳ Please wait a moment before trying again.`;
            } else if (err.status === 400) {
              displayMsg = `Invalid Input: ${err.message} ⚠️`;
            } else if (err.status === 500) {
              displayMsg = "The server encountered an error processing your request. Please try again shortly. 🛠️";
            } else {
              displayMsg = `${err.message}`;
            }
          } else if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
            displayMsg = "Connection failed. This might be due to a CORS policy block (missing allowed origin) or the server being offline. Please check your console log. 🌐";
          }
          
          const errMsg: Message = {
            id: generateId(),
            role: "assistant",
            content: displayMsg,
            timestamp: Date.now(),
          };
          setConversations((prev) => {
            const copy = prev.map((c) =>
              c.id === convoId
                ? { ...c, messages: [...c.messages, errMsg], updatedAt: Date.now() }
                : c,
            );
            storage.setConversations(copy);
            return copy;
          });
        })
        .finally(() => {
          setIsTyping(false);
        });
    },
    [activeConversationId, conversations, persist, storage, language],
  );

  // ── Feedback ───────────────────────────────────────────────────────────────

  const submitFeedback = useCallback(
    (messageId: string, rating: FeedbackRating) => {
      storage.addFeedback({
        messageId,
        rating,
        timestamp: Date.now(),
      });
    },
    [storage],
  );

  // ── Rename conversation ────────────────────────────────────────────────────

  const renameConversation = useCallback(
    (id: string, newTitle: string) => {
      const updated = conversations.map((c) =>
        c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c,
      );
      persist(updated);
    },
    [conversations, persist],
  );

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isTyping,
    initialized,
    createConversation,
    switchConversation,
    deleteConversation,
    clearAllConversations,
    sendMessage,
    submitFeedback,
    renameConversation,
    language,
    setLanguage,
    showCrisisDialog,
    setShowCrisisDialog,
  };
}
