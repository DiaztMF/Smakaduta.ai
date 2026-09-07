"use client";

import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RefreshCcw, Copy, Check, Sparkles, BookIcon } from "lucide-react";
import { Fragment, useState } from "react";
import type { UIMessage } from "ai";

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
  onRegenerate: () => void;
}

interface ExtractedSource {
  id: string;
  title: string;
  relevance?: string;
  url?: string;
}

const renderThinkingMessage = (isStreaming: boolean, duration?: number) => {
  if (isStreaming || duration === 0) {
    return <Shimmer duration={1.5}>Sedang menganalisis...</Shimmer>;
  }
  if (duration === undefined) {
    return <span>Dianalisis selama beberapa detik</span>;
  }
  return <span>Dianalisis selama {duration} detik</span>;
};

function extractSourcesAndCleanText(
  rawText: string,
  parts: UIMessage["parts"] = []
): {
  sources: ExtractedSource[];
  cleanedText: string;
} {
  const sourcesMap = new Map<string, ExtractedSource>();

  // 1. Native source parts from AI SDK if present
  if (parts && parts.length > 0) {
    for (const part of parts) {
      if (part.type === "source-url") {
        const title = part.title || part.url;
        if (title && !sourcesMap.has(title.toLowerCase())) {
          sourcesMap.set(title.toLowerCase(), {
            id: part.sourceId || `src-url-${sourcesMap.size}`,
            title,
            url: part.url,
          });
        }
      } else if (part.type === "source-document") {
        const title = part.title || part.filename || "Dokumen";
        if (title && !sourcesMap.has(title.toLowerCase())) {
          sourcesMap.set(title.toLowerCase(), {
            id: part.sourceId || `src-doc-${sourcesMap.size}`,
            title,
          });
        }
      }
    }
  }

  // 2. Bracketed citations: [Sumber X: Document Name (relevansi: YY%)] or [Dokumen: ...]
  const citationRegex =
    /\[(?:Sumber|Dokumen)(?:\s+\d+)?:?\s*([^\]\n(]+?)(?:\s*\(relevansi:\s*(\d+)%?\))?\]/gi;
  let match: RegExpExecArray | null;
  while ((match = citationRegex.exec(rawText)) !== null) {
    const title = match[1].trim();
    const relNum = match[2];
    const relevance = relNum ? `${relNum}%` : undefined;

    if (title && !sourcesMap.has(title.toLowerCase())) {
      sourcesMap.set(title.toLowerCase(), {
        id: `source-${sourcesMap.size + 1}`,
        title,
        relevance,
      });
    }
  }

  // 3. Bulleted or numbered list with (relevansi: YY%) under sources
  const listRegex =
    /(?:^|\n)\s*(?:[-*•]|\d+\.)\s*(?:(?:Sumber|Dokumen)(?:\s+\d+)?:?\s*)?([^[\n()]+?)\s*\(relevansi:\s*(\d+)%?\)/gi;
  while ((match = listRegex.exec(rawText)) !== null) {
    const title = match[1].replace(/^[-*•\s]+/, "").trim();
    const relNum = match[2];
    const relevance = relNum ? `${relNum}%` : undefined;

    if (
      title &&
      !sourcesMap.has(title.toLowerCase()) &&
      !title.toLowerCase().startsWith("http")
    ) {
      sourcesMap.set(title.toLowerCase(), {
        id: `source-${sourcesMap.size + 1}`,
        title,
        relevance,
      });
    }
  }

  // Clean rawText
  let cleanedText = rawText;

  // Clean RAG prompt delimiter block if echoed
  cleanedText = cleanedText
    .replace(/--- DOKUMEN REFERENSI ---[\s\S]*?--- AKHIR DOKUMEN ---/gi, "")
    .trim();

  // Clean trailing Sumber/Referensi block with citations or bulleted lists
  cleanedText = cleanedText
    .replace(
      /(?:\r?\n){1,2}(?:#{1,4}\s*)?(?:Sumber(?:\s+Informasi|\s+Referensi)?|Referensi|Dokumen Referensi):?\s*(?:\r?\n\s*(?:[-*•]|\d+\.)?\s*(?:\[(?:Sumber|Dokumen)[^\]]+\]|[^(\n]+\(relevansi:[^)]+\)))+/gi,
      ""
    )
    .trim();

  // Clean standalone lines with [Sumber ...] or [Dokumen ...]
  cleanedText = cleanedText
    .replace(
      /^\s*[-*•]?\s*\[(?:Sumber|Dokumen)(?:\s+\d+)?:?[^\]]+\]\s*$/gim,
      ""
    )
    .trim();

  // Clean excess blank lines
  cleanedText = cleanedText.replace(/\n{3,}/g, "\n\n").trim();

  return {
    sources: Array.from(sourcesMap.values()),
    cleanedText,
  };
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
      {messages.map((message, messageIndex) => {
        if (message.role === "user") {
          return (
            <Message from="user" key={message.id}>
              <MessageContent>
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <MessageResponse key={`${message.id}-${i}`}>
                        {part.text}
                      </MessageResponse>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          );
        }

        const isLastAssistant =
          message.role === "assistant" &&
          messageIndex === messages.length - 1;

        // Reasoning parts
        const reasoningParts = message.parts.filter(
          (part): part is Extract<UIMessage["parts"][number], { type: "reasoning" }> =>
            part.type === "reasoning"
        );
        const hasReasoning = reasoningParts.length > 0;
        const reasoningText = reasoningParts.map((p) => p.text).join("\n\n");
        const isAnyReasoningPartStreaming = reasoningParts.some(
          (p) => p.state === "streaming"
        );
        const areAllReasoningPartsDone =
          reasoningParts.length > 0 &&
          reasoningParts.every((p) => p.state === "done");

        const isReasoningStreaming =
          isLastAssistant &&
          (status === "streaming" || status === "submitted") &&
          (isAnyReasoningPartStreaming ||
            (!areAllReasoningPartsDone &&
              !message.parts.some(
                (p) => p.type === "text" && p.text.trim().length > 0
              )));

        // Text parts and RAG sources
        const textParts = message.parts.filter(
          (part): part is Extract<UIMessage["parts"][number], { type: "text" }> =>
            part.type === "text"
        );
        const rawFullText = textParts.map((p) => p.text).join("\n\n");
        const { sources, cleanedText } = extractSourcesAndCleanText(
          rawFullText,
          message.parts
        );

        return (
          <Fragment key={message.id}>
            <Message from="assistant">
              <MessageContent>
                {/* Reasoning accordion */}
                {hasReasoning && (
                  <Reasoning
                    className="w-full"
                    isStreaming={isReasoningStreaming}
                  >
                    <ReasoningTrigger getThinkingMessage={renderThinkingMessage} />
                    <ReasoningContent>{reasoningText}</ReasoningContent>
                  </Reasoning>
                )}

                {/* Initial thinking indicator before text arrives */}
                {!hasReasoning &&
                  cleanedText.trim().length === 0 &&
                  (status === "streaming" || status === "submitted") && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 animate-pulse text-primary" />
                      <Shimmer duration={1.5}>Kak Duta sedang berpikir...</Shimmer>
                    </div>
                  )}

                {/* Main response text */}
                {cleanedText.trim().length > 0 && (
                  <MessageResponse>{cleanedText}</MessageResponse>
                )}

                {/* RAG Sources collapsible */}
                {sources.length > 0 && (
                  <Sources className="mt-2 mb-0 w-full">
                    <SourcesTrigger count={sources.length} />
                    <SourcesContent className="w-full">
                      <div className="flex flex-col gap-1.5 w-full pt-1">
                        {sources.map((source) => (
                          <Source
                            key={source.id}
                            href={source.url}
                            title={source.title}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs transition-colors",
                              source.url
                                ? "hover:bg-muted/70 cursor-pointer"
                                : "cursor-default select-text"
                            )}
                            onClick={
                              !source.url
                                ? (e) => e.preventDefault()
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <BookIcon className="size-3.5 shrink-0 text-primary" />
                              <span className="truncate font-medium text-foreground">
                                {source.title}
                              </span>
                            </div>
                            {source.relevance && (
                              <Badge
                                variant="secondary"
                                className="h-4 shrink-0 px-1.5 py-0 text-[10px] font-normal"
                              >
                                {source.relevance.startsWith("relevansi")
                                  ? source.relevance
                                  : `relevansi: ${source.relevance}`}
                              </Badge>
                            )}
                          </Source>
                        ))}
                      </div>
                    </SourcesContent>
                  </Sources>
                )}
              </MessageContent>
            </Message>

            {/* Actions on last assistant message */}
            {isLastAssistant &&
              status !== "streaming" &&
              status !== "submitted" && (
                <MessageActions>
                  <MessageAction onClick={onRegenerate} label="Coba Lagi">
                    <RefreshCcw className="size-3" />
                  </MessageAction>
                  <MessageAction
                    onClick={() =>
                      handleCopy(cleanedText || rawFullText, message.id)
                    }
                    label="Salin"
                  >
                    {copiedId === message.id ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </MessageAction>
                </MessageActions>
              )}
          </Fragment>
        );
      })}

      {/* Thinking indicator */}
      {(status === "submitted" || status === "streaming") &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "user" && (
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 animate-pulse text-primary" />
                <Shimmer duration={1.5}>Kak Duta sedang berpikir...</Shimmer>
              </div>
            </MessageContent>
          </Message>
        )}
    </>
  );
}
