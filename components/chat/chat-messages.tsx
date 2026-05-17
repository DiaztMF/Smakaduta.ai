"use client";

import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { RefreshCcw, Copy, Check, Sparkles } from "lucide-react";
import { Fragment, useState } from "react";
import type { UIMessage } from "ai";

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
  onRegenerate: () => void;
}

export function ChatMessages({
  messages,
  status,
  onRegenerate,
}: ChatMessagesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {messages.map((message, messageIndex) => (
        <Fragment key={message.id}>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text": {
                const isLastAssistant =
                  message.role === "assistant" &&
                  messageIndex === messages.length - 1;
                const partKey = `${message.id}-${i}`;

                return (
                  <Fragment key={partKey}>
                    <Message from={message.role}>
                      <MessageContent>
                        <MessageResponse>{part.text}</MessageResponse>
                      </MessageContent>
                    </Message>

                    {/* Actions on last assistant message */}
                    {isLastAssistant &&
                      status !== "streaming" &&
                      status !== "submitted" && (
                        <MessageActions>
                          <MessageAction
                            onClick={onRegenerate}
                            label="Coba Lagi"
                          >
                            <RefreshCcw className="size-3" />
                          </MessageAction>
                          <MessageAction
                            onClick={() => handleCopy(part.text, partKey)}
                            label="Salin"
                          >
                            {copiedId === partKey ? (
                              <Check className="size-3" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </MessageAction>
                        </MessageActions>
                      )}
                  </Fragment>
                );
              }
              default:
                return null;
            }
          })}
        </Fragment>
      ))}

      {/* Thinking indicator */}
      {(status === "submitted" || status === "streaming") &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && (
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 animate-pulse text-primary" />
                <Shimmer duration={1.5}>
                  Kak Duta sedang berpikir...
                </Shimmer>
              </div>
            </MessageContent>
          </Message>
        )}
    </>
  );
}
