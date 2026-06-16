"use client";

import { useCallback } from "react";
import {
  STORAGE_KEY,
  FEEDBACK_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  DEFAULT_LANGUAGE,
} from "@/lib/constants";
import type { Conversation, MessageFeedback, LanguageCode } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

function loadFeedback(): MessageFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MessageFeedback[]) : [];
  } catch {
    return [];
  }
}

function saveFeedback(feedback: MessageFeedback[]) {
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
}

function loadLanguage(): LanguageCode {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (raw as LanguageCode) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function saveLanguage(language: LanguageCode) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLocalStorage() {
  // ── Conversations ────────────────────────────────────────────────────────

  const getConversations = useCallback(() => loadConversations(), []);

  const setConversations = useCallback((conversations: Conversation[]) => {
    saveConversations(conversations);
  }, []);

  const getConversation = useCallback((id: string) => {
    return loadConversations().find((c) => c.id === id) ?? null;
  }, []);

  const saveConversation = useCallback((conversation: Conversation) => {
    const all = loadConversations();
    const idx = all.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      all[idx] = conversation;
    } else {
      all.unshift(conversation);
    }
    saveConversations(all);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    const all = loadConversations().filter((c) => c.id !== id);
    saveConversations(all);
  }, []);

  const clearAllConversations = useCallback(() => {
    saveConversations([]);
  }, []);

  // ── Feedback ─────────────────────────────────────────────────────────────

  const getFeedback = useCallback(() => loadFeedback(), []);

  const addFeedback = useCallback((fb: MessageFeedback) => {
    const all = loadFeedback();
    // Replace existing feedback for same message
    const idx = all.findIndex((f) => f.messageId === fb.messageId);
    if (idx >= 0) {
      all[idx] = fb;
    } else {
      all.push(fb);
    }
    saveFeedback(all);
  }, []);

  // ── Language ─────────────────────────────────────────────────────────────

  const getLanguage = useCallback(() => loadLanguage(), []);

  const setLanguage = useCallback((language: LanguageCode) => {
    saveLanguage(language);
  }, []);

  return {
    getConversations,
    setConversations,
    getConversation,
    saveConversation,
    deleteConversation,
    clearAllConversations,
    getFeedback,
    addFeedback,
    getLanguage,
    setLanguage,
  };
}
