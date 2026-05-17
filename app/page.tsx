"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ChatMessages } from "@/components/chat/chat-messages";

export default function ChatPage() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text });
      setInput("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-dvh flex-col">
      <ChatHeader />

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4">
          <Conversation>
            <ConversationContent>
              {messages.length === 0 ? (
                <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
              ) : (
                <ChatMessages
                  messages={messages}
                  status={status}
                  onRegenerate={regenerate}
                />
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Prompt Input */}
          <div className="pb-4 pt-2">
            <PromptInput
              onSubmit={handleSubmit}
              className="w-full"
            >
              <PromptInputBody>
                <PromptInputTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanya Kak Duta tentang PPDB..."
                  disabled={isStreaming}
                />
              </PromptInputBody>
              <PromptInputFooter>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground/50">
                    Enter untuk kirim · Shift+Enter baris baru
                  </span>
                </div>
                <PromptInputSubmit
                  status={status}
                  disabled={!input.trim() && !isStreaming}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </main>
    </div>
  );
}
