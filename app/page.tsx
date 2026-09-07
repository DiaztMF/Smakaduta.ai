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
import { ChatEmptyState, defaultSuggestions } from "@/components/chat/chat-empty-state";
import { ChatErrorState } from "@/components/chat/chat-error-state";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { ChatMessages } from "@/components/chat/chat-messages";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ChatPage() {
  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    status,
    regenerate,
    stop,
    error,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  const handleReset = () => {
    if (isStreaming) {
      stop();
    }
    setMessages([]);
    setInput("");
  };

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text });
      setInput("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isStreaming) return;
    sendMessage({ text: suggestion });
  };

  return (
    <div className="flex h-svh flex-col">
      <ChatHeader onReset={handleReset} hasMessages={messages.length > 0} />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <Conversation className="flex-1 w-full">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-col px-4">
              {messages.length === 0 ? (
                <ChatEmptyState />
              ) : (
                <ChatMessages
                  messages={messages}
                  status={status}
                  onRegenerate={regenerate}
                />
              )}
              {error && (
                <div className="px-0 pb-2 pt-1">
                  <ChatErrorState error={error} onRetry={regenerate} />
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
        </Conversation>

        {/* Prompt Input */}
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
            {messages.length === 0 && (
              <div className="mb-4 flex w-full justify-center">
                <Suggestions className="!w-auto !flex-wrap justify-center overflow-visible [&_button:nth-child(n+4)]:hidden sm:[&_button:nth-child(n+4)]:inline-flex">
                  {defaultSuggestions.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      onClick={handleSuggestionClick}
                      suggestion={suggestion}
                      disabled={isStreaming}
                    />
                  ))}
                </Suggestions>
              </div>
            )}
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
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-[11px] text-muted-foreground/50">
                    Enter untuk kirim · Shift+Enter baris baru
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <SpeechInput
                          type="button"
                          lang="id-ID"
                          disabled={isStreaming}
                          onTranscriptionChange={(text) =>
                            setInput((prev) => (prev ? `${prev} ${text}` : text))
                          }
                          aria-label="Tanya lewat suara"
                          size="icon"
                          className="size-8"
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Tanya lewat suara
                    </TooltipContent>
                  </Tooltip>
                  <PromptInputSubmit
                    status={status}
                    onStop={stop}
                    disabled={!input.trim() && !isStreaming}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>
          </div>
      </main>
    </div>
  );
}
