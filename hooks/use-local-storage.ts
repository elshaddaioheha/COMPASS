"use client";

import { useState, useCallback } from "react";
import { STORAGE_KEY, FEEDBACK_STORAGE_KEY } from "@/lib/constants";
import type { Conversation, MessageFeedback } from "@/lib/types";

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

  return {
    getConversations,
    setConversations,
    getConversation,
    saveConversation,
    deleteConversation,
    clearAllConversations,
    getFeedback,
    addFeedback,
  };
}
