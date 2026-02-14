import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

type AgentMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function buildStubReply(input: string): string {
  const cleaned = input.trim();
  if (!cleaned) {
    return "Tell me what you want to build and I will scaffold it.";
  }
  return [
    "Stub response (agent wiring pending).",
    `I captured your request: "${cleaned}".`,
    "Next step: I can propose a concrete implementation plan, then execute it.",
  ].join("\n");
}

export function AgentTab() {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      text: "Codex builder agent is ready. Ask me to build, refactor, style, or debug.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = draft.trim().length > 0;

  const messageCountLabel = useMemo(() => {
    const count = messages.length;
    return `${count} message${count === 1 ? "" : "s"}`;
  }, [messages.length]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };
    const assistantMessage: AgentMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      text: buildStubReply(text),
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setDraft("");
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [draft]);

  return (
    <div className="agent-chat-root">
      <div className="agent-chat-history" role="log" aria-live="polite">
        <div className="agent-chat-history-meta">
          <span className="agent-chat-status-dot" />
          <span>Agent session</span>
          <span className="agent-chat-history-count">{messageCountLabel}</span>
        </div>
        <div className="agent-chat-message-list">
          {messages.map((message) => (
            <div key={message.id} className={`agent-chat-message ${message.role}`}>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="agent-chat-composer">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onComposerKeyDown}
          placeholder="Message Codex…"
          rows={1}
        />
        <button
          type="button"
          className="agent-chat-send"
          onClick={sendMessage}
          disabled={!canSend}
          aria-label="Send message"
          title="Send"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12h13" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
