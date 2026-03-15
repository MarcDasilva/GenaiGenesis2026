"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import GlassSurface from "@/components/GlassSurface";
import { IconSend, IconLoader2 } from "@tabler/icons-react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatbotPanelProps {
  onSend?: () => void;
  messages: ChatMessage[];
  onNewMessage: (userText: string) => void;
  isLoading: boolean;
}

export function ChatbotPanel({
  onSend,
  messages,
  onNewMessage,
  isLoading,
}: ChatbotPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    onSend?.();
    onNewMessage(text);
  };

  return (
    <aside className="w-full max-w-2xl px-4 flex flex-col gap-3">
      {messages.length > 0 && (
        <GlassSurface
          width={"100%" as unknown as number}
          height={"fit-content" as unknown as number}
          borderRadius={16}
          className="overflow-hidden"
          contentClassName="!flex !flex-col !items-stretch !justify-start !p-0 !gap-0"
        >
          <div className="max-h-96 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-black/10 text-black"
                      : "bg-white/60 text-black border border-black/5"
                  }`}
                >
                  <div className="whitespace-pre-wrap wrap-break-word">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3.5 py-2.5 text-sm text-black/60 border border-black/5">
                  <IconLoader2 className="size-4 animate-spin" />
                  <span>Analyzing…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </GlassSurface>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <GlassSurface
          width={"100%" as unknown as number}
          height={"fit-content" as unknown as number}
          borderRadius={16}
          className="overflow-hidden"
          contentClassName="!flex !flex-col !items-stretch !justify-center !p-0 !gap-0"
        >
          <div className="flex flex-col gap-3 px-4 pt-4 pb-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about genome primer design…"
              className="w-full bg-transparent text-sm text-black placeholder:text-black/50 outline-none md:text-base"
              aria-label="Message"
              disabled={isLoading}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="submit"
                size="icon-sm"
                className="size-8 shrink-0 rounded-lg bg-black/15 text-black hover:bg-black/25"
                disabled={!input.trim() || isLoading}
                aria-label="Send"
              >
                {isLoading ? (
                  <IconLoader2 className="size-4 text-black animate-spin" />
                ) : (
                  <IconSend className="size-4 text-black stroke-[2.5]" />
                )}
              </Button>
            </div>
          </div>
        </GlassSurface>
      </form>
    </aside>
  );
}
