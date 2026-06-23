"use client";

import { cn } from "@/lib/utils";
import type { Message, FeedbackRating } from "@/lib/types";
import { APP_NAME } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  ThumbsDown,
  Compass,
  User,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

interface EmotionConfig {
  emoji: string;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const EMOTION_MAP: Record<string, EmotionConfig> = {
  anxiety: {
    emoji: "😰",
    label: "Anxious",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    textColor: "text-amber-700 dark:text-amber-400",
    borderColor: "border-amber-500/20 dark:border-amber-500/30",
  },
  depression: {
    emoji: "😔",
    label: "Depression",
    bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    textColor: "text-indigo-700 dark:text-indigo-400",
    borderColor: "border-indigo-500/20 dark:border-indigo-500/30",
  },
  anger: {
    emoji: "😠",
    label: "Angry",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    textColor: "text-rose-700 dark:text-rose-400",
    borderColor: "border-rose-500/20 dark:border-rose-500/30",
  },
  confusion: {
    emoji: "😕",
    label: "Confused",
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    textColor: "text-purple-700 dark:text-purple-400",
    borderColor: "border-purple-500/20 dark:border-purple-500/30",
  },
  sadness: {
    emoji: "😢",
    label: "Sad",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-500/20 dark:border-blue-500/30",
  },
  neutral: {
    emoji: "😐",
    label: "Calm",
    bgColor: "bg-zinc-500/10 dark:bg-zinc-500/20",
    textColor: "text-zinc-700 dark:text-zinc-400",
    borderColor: "border-zinc-500/20 dark:border-zinc-500/30",
  },
  suicidal: {
    emoji: "🚨",
    label: "Crisis Sign",
    bgColor: "bg-red-500/10 dark:bg-red-500/25 animate-pulse",
    textColor: "text-red-700 dark:text-red-400 font-semibold",
    borderColor: "border-red-500/30 dark:border-red-500/40",
  },
};

const DEFAULT_EMOTION: EmotionConfig = {
  emoji: "✨",
  label: "Emotion",
  bgColor: "bg-secondary",
  textColor: "text-secondary-foreground",
  borderColor: "border-border",
};

interface ChatMessageProps {
  message: Message;
  onFeedback?: (messageId: string, rating: FeedbackRating) => void;
}

export function ChatMessage({ message, onFeedback }: ChatMessageProps) {
  const isUser = message.role === "user";
  // Show the detected emotion on bot replies (skip "uncertain", which isn't
  // a real feeling, just a low-confidence signal).
  const showEmotion =
    !isUser && !!message.emotion && message.emotion !== "uncertain";
  // Confidence "gauge": how strongly the model read this emotion (0–100%).
  const confidencePct =
    typeof message.confidence === "number"
      ? Math.round(message.confidence * 100)
      : null;
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<FeedbackRating | null>(
    null,
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (rating: FeedbackRating) => {
    setFeedbackGiven(rating);
    onFeedback?.(message.id, rating);
  };

  const emotionConfig = showEmotion ? (EMOTION_MAP[message.emotion!] || DEFAULT_EMOTION) : null;

  return (
    <div
      className={cn(
        "group flex gap-3 py-4 px-4 md:px-6 animate-slide-in",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar className="mt-0.5 shrink-0 size-8">
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isUser ? (
            <User className="size-4" />
          ) : (
            <Compass className="size-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col gap-1.5 max-w-[80%] md:max-w-[70%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            {isUser ? "You" : APP_NAME}
          </span>
          {showEmotion && emotionConfig && (
            <div
              className="flex items-center gap-2"
              title={
                confidencePct !== null
                  ? `${emotionConfig.label} · ${confidencePct}% model confidence`
                  : `Detected emotion: ${message.emotion}`
              }
            >
              <Badge
                variant="outline"
                className={cn(
                  "h-5 gap-1 px-2 text-[10px] font-medium border capitalize select-none",
                  emotionConfig.bgColor,
                  emotionConfig.textColor,
                  emotionConfig.borderColor,
                )}
              >
                <span>{emotionConfig.emoji}</span>
                <span>{emotionConfig.label}</span>
              </Badge>
              {confidencePct !== null && (
                <div className="flex items-center gap-1.5">
                  {/* Confidence gauge — bar length + colour reflect how strongly
                      the model read this emotion. */}
                  <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${confidencePct}%`,
                        backgroundColor: confidenceColor(confidencePct),
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {confidencePct}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm",
          )}
        >
          {renderContent(message.content)}
        </div>

        {/* Actions (only for bot messages) */}
        {!isUser && (
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleFeedback("helpful")}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                feedbackGiven === "helpful" && "text-green-600",
              )}
            >
              <ThumbsUp className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleFeedback("not-helpful")}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                feedbackGiven === "not-helpful" && "text-red-500",
              )}
            >
              <ThumbsDown className="size-3" />
            </Button>
          </div>
        )}

        <span className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ─── Confidence gauge colour ─────────────────────────────────────────────────
// Green = strong read, amber = moderate, red = weak. Hex literals are used
// because Tailwind theme tokens aren't available in inline styles.
function confidenceColor(pct: number): string {
  if (pct >= 75) return "#16a34a"; // green-600
  if (pct >= 50) return "#ca8a04"; // yellow-600
  return "#dc2626"; // red-600
}

// ─── Simple Markdown-ish renderer ────────────────────────────────────────────

function renderContent(text: string) {
  const lines = text.split("\n");

  return lines.map((line, i) => {
    let processed: React.ReactNode = line;

    const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
    if (boldParts.length > 1) {
      processed = boldParts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    }

    if (typeof processed === "string") {
      const italicParts = processed.split(/(\*[^*]+\*)/g);
      if (italicParts.length > 1) {
        processed = italicParts.map((part, j) => {
          if (part.startsWith("*") && part.endsWith("*")) {
            return (
              <em key={j} className="italic text-muted-foreground">
                {part.slice(1, -1)}
              </em>
            );
          }
          return part;
        });
      }
    }

    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-muted-foreground">&bull;</span>
          <span>
            {Array.isArray(processed)
              ? processed.slice(0)
              : typeof processed === "string"
                ? processed.slice(2)
                : processed}
          </span>
        </div>
      );
    }

    if (line.trim() === "") {
      return <div key={i} className="h-2" />;
    }

    return <div key={i}>{processed}</div>;
  });
}
