"use client";

import { useState, useCallback, useEffect } from "react";
import type { Conversation, Message, FeedbackRating } from "@/lib/types";
import { useLocalStorage } from "./use-local-storage";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

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
): Promise<ApiResponse> {
  const res = await fetch(`${API_URL}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // session_id ties this call to a specific conversation context in Flask
    body: JSON.stringify({ message, session_id: sessionId }),
    credentials: "include",   // send cookies (Flask session fallback)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API returned ${res.status}: ${text}`);
  }

  return res.json() as Promise<ApiResponse>;
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

  // Load from localStorage on mount
  useEffect(() => {
    const saved = storage.getConversations();
    setConversations(saved);
    if (saved.length > 0) {
      setActiveConversationId(saved[0].id);
    }
    setInitialized(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      callChatApi(content.trim(), sessionId)
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
    [activeConversationId, conversations, persist, storage],
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
  };
}
