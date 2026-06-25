"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./chat-message";
import { ChatTypingIndicator } from "./chat-typing-indicator";
import { ChatWelcome } from "./chat-welcome";
import { ChatInput } from "./chat-input";
import { ChatHeader } from "./chat-header";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, Heart } from "lucide-react";
import type { Conversation, FeedbackRating, LanguageCode } from "@/lib/types";

interface ChatAreaProps {
  conversation: Conversation | null;
  isTyping: boolean;
  onSendMessage: (content: string) => void;
  onFeedback: (messageId: string, rating: FeedbackRating) => void;
  onToggleSidebar: () => void;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onShowCrisisResources: () => void;
}

export function ChatArea({
  conversation,
  isTyping,
  onSendMessage,
  onFeedback,
  onToggleSidebar,
  language,
  onLanguageChange,
  onShowCrisisResources,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isTyping]);

  const hasMessages = conversation && conversation.messages.length > 0;

  // Extract emotion and confidence of the last assistant reply to show safety/support banners
  const lastMessage = conversation?.messages[conversation.messages.length - 1] ?? null;
  const isLastMessageBot = lastMessage && lastMessage.role === "assistant";
  const lastEmotion = isLastMessageBot ? lastMessage.emotion : null;
  const lastConfidence = isLastMessageBot ? lastMessage.confidence : null;

  const isSuicidal = lastEmotion === "suicidal";
  const isSevereNegative =
    (lastEmotion === "depression" && (lastConfidence ?? 0) >= 0.65) ||
    ((lastEmotion === "anxiety" || lastEmotion === "sadness" || lastEmotion === "anger") && (lastConfidence ?? 0) >= 0.75);

  return (
    <div className="relative flex flex-1 flex-col h-[100dvh] overflow-hidden">
      <ChatHeader
        onToggleSidebar={onToggleSidebar}
        conversationTitle={conversation?.title}
      />

      {/* Scrollable messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-[calc(49px+env(safe-area-inset-top))] md:pt-0 pb-[150px] md:pb-4"
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
              
              {/* Crisis Support Banner */}
              {isSuicidal && (
                <div className="px-4 md:px-6 py-3 animate-slide-in">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start">
                    <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Need Immediate Support?</h4>
                      <p className="text-xs text-muted-foreground">
                        You are not alone. Please reach out to one of these emergency helpline resources if you feel in danger or have thoughts of self-harm.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button asChild variant="outline" size="sm" className="text-red-600 border-red-500/20 hover:bg-red-500/10 dark:text-red-400 hover:text-red-600">
                          <a href="tel:+2349137077242">
                            <Phone className="size-3.5 mr-1" />
                            Deji (Project Student): +234 913 707 7242
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="text-red-600 border-red-500/20 hover:bg-red-500/10 dark:text-red-400 hover:text-red-600">
                          <a href="tel:08007842433">
                            <Phone className="size-3.5 mr-1" />
                            0800-SUICIDE (0800-7842433)
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="text-red-600 border-red-500/20 hover:bg-red-500/10 dark:text-red-400 hover:text-red-600">
                          <a href="tel:+2348091116264">
                            <Phone className="size-3.5 mr-1" />
                            MANI: +234 809 111 6264
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="text-red-600 border-red-500/20 hover:bg-red-500/10 dark:text-red-400 hover:text-red-600">
                          <a href="tel:09137077242">
                            <Phone className="size-3.5 mr-1" />
                            Helpline: 09137077242
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="text-red-600 border-red-500/20 hover:bg-red-500/10 dark:text-red-400 hover:text-red-600">
                          <a href="tel:08053897559">
                            <Phone className="size-3.5 mr-1" />
                            Helpline: 08053897559
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Emotion Regulation Banner */}
              {isSevereNegative && !isSuicidal && (
                <div className="px-4 md:px-6 py-3 animate-slide-in">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start">
                    <Heart className="size-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400">Emotion Regulation & Support</h4>
                      <p className="text-xs text-muted-foreground">
                        It seems you are feeling strong emotions right now. Would you like to try a quick exercise to ground yourself or see support resources?
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="xs" 
                          onClick={() => onSendMessage("I'd like to try a breathing exercise to help me calm down.")}
                          className="text-xs h-7 px-2.5 rounded-lg border-amber-500/20 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wind size-3.5"><path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 15.6A2 2 0 1 1 18 19H2"/><path d="M9.8 5.8A2 2 0 1 0 11 9H2"/><path d="M14.5 4.8A2 2 0 1 1 15 8H2"/></svg>
                          Breathing
                        </Button>
                        <Button 
                          variant="outline" 
                          size="xs" 
                          onClick={() => onSendMessage("Can you walk me through a Cognitive Behavioral Therapy technique to challenge my negative thoughts?")}
                          className="text-xs h-7 px-2.5 rounded-lg border-amber-500/20 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain size-3.5"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v14"/><path d="M12 12h6"/></svg>
                          CBT Challenge
                        </Button>
                        <Button 
                          variant="outline" 
                          size="xs" 
                          onClick={onShowCrisisResources}
                          className="text-xs h-7 px-2.5 rounded-lg border-amber-500/20 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1"
                        >
                          <Phone className="size-3.5" />
                          Helplines
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
