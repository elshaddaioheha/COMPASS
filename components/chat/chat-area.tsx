"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./chat-message";
import { ChatTypingIndicator } from "./chat-typing-indicator";
import { ChatWelcome } from "./chat-welcome";
import { ChatInput } from "./chat-input";
import { ChatHeader } from "./chat-header";
import type { Conversation, FeedbackRating, LanguageCode } from "@/lib/types";

interface ChatAreaProps {
  conversation: Conversation | null;
  isTyping: boolean;
  onSendMessage: (content: string) => void;
  onFeedback: (messageId: string, rating: FeedbackRating) => void;
  onToggleSidebar: () => void;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}

export function ChatArea({
  conversation,
  isTyping,
  onSendMessage,
  onFeedback,
  onToggleSidebar,
  language,
  onLanguageChange,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isTyping]);

  const hasMessages = conversation && conversation.messages.length > 0;

  return (
    <div className="relative flex flex-1 flex-col h-screen overflow-hidden">
      <ChatHeader
        onToggleSidebar={onToggleSidebar}
        conversationTitle={conversation?.title}
      />

      {/* Scrollable messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-[49px] md:pt-0 pb-[120px] md:pb-4"
      >
        <div className="mx-auto max-w-3xl">
          {!hasMessages ? (
            <ChatWelcome />
          ) : (
            <>
              {conversation.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onFeedback={onFeedback}
                />
              ))}
              {isTyping && <ChatTypingIndicator />}
            </>
          )}
        </div>
      </div>

      {/* Fixed input at bottom */}
      <ChatInput
        onSend={onSendMessage}
        disabled={isTyping}
        language={language}
        onLanguageChange={onLanguageChange}
      />
    </div>
  );
}
