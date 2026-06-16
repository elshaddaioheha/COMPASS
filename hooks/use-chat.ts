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

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// Abort the request if the backend takes too long (it can cold-start on free
// hosting tiers). Keeps the UI from hanging on "typing…" forever.
const REQUEST_TIMEOUT_MS = 30_000;

// ─── Utility ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

  // Abort on timeout so the UI never hangs forever.
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

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API returned ${res.status}: ${text}`);
    }

    return (await res.json()) as ApiResponse;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat() {
  const storage = useLocalStorage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
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
          // Show a friendly error message in chat instead of crashing
          const errMsg: Message = {
            id: generateId(),
            role: "assistant",
            content:
              "I'm having trouble connecting right now. Please make sure the backend is running and try again. 🔌",
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
  };
}
