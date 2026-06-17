"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { APP_NAME, LANGUAGES } from "@/lib/constants";
import type { LanguageCode } from "@/lib/types";
import { Send, Loader2, Languages } from "lucide-react";
import { useState, useRef, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
}

export function ChatInput({
  onSend,
  disabled,
  language,
  onLanguageChange,
}: ChatInputProps) {
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
    <div className="fixed md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto md:bottom-auto z-10 shrink-0 border-t bg-background/95 md:bg-background backdrop-blur-sm md:backdrop-blur-none p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:p-4 md:pb-4 supports-[backdrop-filter]:bg-background/60 md:supports-[backdrop-filter]:bg-background">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl px-3 py-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            className="min-h-8 max-h-30 resize-none border-0 bg-transparent p-1 text-base md:text-sm focus-visible:ring-0 focus-visible:border-0 shadow-none placeholder:text-muted-foreground/60"
            disabled={disabled}
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
            className="shrink-0 h-9 w-9 md:h-8 md:w-8"
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Languages className="size-3.5 shrink-0" aria-hidden="true" />
            <NativeSelect
              size="sm"
              aria-label="Reply language"
              value={language}
              onChange={(e) =>
                onLanguageChange(e.target.value as LanguageCode)
              }
              className="border-0"
            >
              {LANGUAGES.map((lang) => (
                <NativeSelectOption key={lang.code} value={lang.code}>
                  {lang.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <p className="text-[10px] text-muted-foreground text-right">
            {APP_NAME} is not a substitute for professional mental health care.
          </p>
        </div>
      </div>
    </div>
  );
}
