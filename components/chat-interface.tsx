"use client";

import { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatArea, ConversationSidebar } from "@/components/chat";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatInterface() {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    isTyping,
    initialized,
    createConversation,
    switchConversation,
    deleteConversation,
    clearAllConversations,
    sendMessage,
    submitFeedback,
    renameConversation,
    language,
    setLanguage,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNew={createConversation}
        onSwitch={switchConversation}
        onDelete={deleteConversation}
        onRename={renameConversation}
        onClearAll={clearAllConversations}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatArea
        conversation={activeConversation}
        isTyping={isTyping}
        onSendMessage={sendMessage}
        onFeedback={submitFeedback}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        language={language}
        onLanguageChange={setLanguage}
      />
    </div>
  );
}
