"use client";

import { Button } from "@/components/ui/button";
import { CrisisResourcesDialog } from "./crisis-resources-dialog";
import { AnimatedThemeToggler } from "@/components/theme-toggler";
import { Menu, Compass } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  conversationTitle?: string;
}

export function ChatHeader({
  onToggleSidebar,
  conversationTitle,
}: ChatHeaderProps) {
  return (
    <header className="fixed md:sticky top-0 left-0 right-0 md:left-auto md:right-auto z-20 flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 py-2 supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          className="md:hidden"
        >
          <Menu className="size-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </div>

        {conversationTitle && (
          <>
            <span className="text-muted-foreground hidden md:inline">/</span>
            <span className="text-sm text-muted-foreground truncate max-w-[200px] hidden md:inline">
              {conversationTitle}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <CrisisResourcesDialog />
        <AnimatedThemeToggler />
      </div>
    </header>
  );
}
