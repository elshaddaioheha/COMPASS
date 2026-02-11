"use client";

import { useState, useCallback, useEffect } from "react";
import type { Conversation, Message, FeedbackRating } from "@/lib/types";
import { useLocalStorage } from "./use-local-storage";
import { PENDING_RESPONSE_TITLE, PENDING_RESPONSE_BODY } from "@/lib/constants";

// ─── Utility ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createSystemMessage(): Message {
  return {
    id: generateId(),
    role: "assistant",
    content: `**${PENDING_RESPONSE_TITLE}**\n\n${PENDING_RESPONSE_BODY}`,
    timestamp: Date.now(),
  };
}

function generateTitle(content: string): string {
  const cleaned = content.trim();

  // Extract first sentence or phrase
  const firstSentence = cleaned.split(/[.!?\n]/)[0].trim();
  const text = firstSentence || cleaned;

  // Limit to 35 characters for sidebar
  const maxLength = 35;
  if (text.length <= maxLength) return text;

  // Truncate at last complete word before limit
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 15 ? `${truncated.slice(0, lastSpace)}…` : `${truncated}…`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

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

  // ── Derived state ────────────────────────────────────────────────────────

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ?? null;

  // ── Persist helper ───────────────────────────────────────────────────────

  const persist = useCallback(
    (updated: Conversation[]) => {
      setConversations(updated);
      storage.setConversations(updated);
    },
    [storage],
  );

  // ── Create new conversation ──────────────────────────────────────────────

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

  // ── Switch conversation ──────────────────────────────────────────────────

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  // ── Delete conversation ──────────────────────────────────────────────────

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

  // ── Clear all conversations ──────────────────────────────────────────────

  const clearAllConversations = useCallback(() => {
    persist([]);
    setActiveConversationId(null);
  }, [persist]);

  // ── Send message ─────────────────────────────────────────────────────────

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

      // Add user message
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      current[idx] = {
        ...current[idx],
        messages: [...current[idx].messages, userMsg],
        // Update title from first user message
        title:
          current[idx].title === "New Conversation"
            ? generateTitle(content)
            : current[idx].title,
        updatedAt: Date.now(),
      };

      persist(current);
      setIsTyping(true);

      // Respond with "implementation coming soon" placeholder
      setTimeout(
        () => {
          const botMsg = createSystemMessage();

          setConversations((prev) => {
            const copy = [...prev];
            const i = copy.findIndex((c) => c.id === convoId);
            if (i >= 0) {
              copy[i] = {
                ...copy[i],
                messages: [...copy[i].messages, botMsg],
                updatedAt: Date.now(),
              };
            }
            storage.setConversations(copy);
            return copy;
          });

          setIsTyping(false);
        },
        1500 + Math.random() * 1000,
      );
    },
    [activeConversationId, conversations, persist, storage],
  );

  // ── Feedback ─────────────────────────────────────────────────────────────

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

  // ── Rename conversation ──────────────────────────────────────────────────

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
