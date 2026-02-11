"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Compass } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function ChatTypingIndicator() {
  return (
    <div className="flex gap-3 py-4 px-4 md:px-6 animate-slide-in">
      <Avatar className="mt-0.5 shrink-0 size-8">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
          <Compass className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          {APP_NAME}
        </span>
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
          <div className="flex gap-1">
            <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
            <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
            <span className="size-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            Processing&hellip;
          </span>
        </div>
      </div>
    </div>
  );
}
