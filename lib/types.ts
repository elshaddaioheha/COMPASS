// ─── Core Chat Types ─────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// ─── Quick Action Types ──────────────────────────────────────────────────────

export interface QuickAction {
  label: string;
  description: string;
  prompt: string;
  icon: string;
}

// ─── Crisis Resource Types ───────────────────────────────────────────────────

export interface CrisisResource {
  name: string;
  number: string;
  description: string;
  region: string;
}

// ─── Feedback Types ──────────────────────────────────────────────────────────

export type FeedbackRating = "helpful" | "not-helpful";

export interface MessageFeedback {
  messageId: string;
  rating: FeedbackRating;
  timestamp: number;
}
