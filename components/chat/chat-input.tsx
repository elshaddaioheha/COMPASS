"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { APP_NAME } from "@/lib/constants";
import { Send, Loader2 } from "lucide-react";
import { useState, useRef, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto md:bottom-auto z-10 shrink-0 border-t bg-background/95 md:bg-background backdrop-blur-sm md:backdrop-blur-none p-3 md:p-4 supports-[backdrop-filter]:bg-background/60 md:supports-[backdrop-filter]:bg-background">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl px-3 py-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            className="min-h-8 max-h-30 resize-none border-0 bg-transparent p-1 text-sm focus-visible:ring-0 focus-visible:border-0 shadow-none placeholder:text-muted-foreground/60"
            disabled={disabled}
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="shrink-0 h-8 w-8"
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {APP_NAME} is not a substitute for professional mental health care.
        </p>
      </div>
    </div>
  );
}
