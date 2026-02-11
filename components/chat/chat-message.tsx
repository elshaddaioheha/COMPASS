"use client";

import { cn } from "@/lib/utils";
import type { Message, FeedbackRating } from "@/lib/types";
import { APP_NAME, PENDING_RESPONSE_TITLE } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ThumbsUp,
  ThumbsDown,
  Compass,
  User,
  Copy,
  Check,
  Construction,
} from "lucide-react";
import { useState } from "react";

interface ChatMessageProps {
  message: Message;
  onFeedback?: (messageId: string, rating: FeedbackRating) => void;
}

export function ChatMessage({ message, onFeedback }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystemPending = message.content.includes(PENDING_RESPONSE_TITLE);
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
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          {isUser ? "You" : APP_NAME}
        </span>

        {/* System "Implementation In Progress" styled as a Card */}
        {!isUser && isSystemPending ? (
          <Card className="w-full">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Construction className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {PENDING_RESPONSE_TITLE}
                </span>
                {/* <Badge variant="secondary" className="text-[10px] ml-auto">
                  Coming Soon
                </Badge> */}
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thank you for sharing. Our AI-powered therapeutic engine is
                currently under development. Once integrated, COMPASS will
                provide personalised CBT exercises, sentiment-aware dialogue,
                and culturally relevant mental health resources.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                In the meantime, please reach out to the crisis resources if you
                need immediate support.
              </p>
            </CardContent>
          </Card>
        ) : (
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
        )}

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
