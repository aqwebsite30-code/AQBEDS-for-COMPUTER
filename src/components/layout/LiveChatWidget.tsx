import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { MessageCircle, X, Send, ChevronDown, Loader2, Sparkles, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage } from "@/lib/chat";
import { getChatMessages } from "@/lib/chat";

// Bare URLs become clickable; everything else stays plain text.
function linkify(text: string): ReactNode[] {
  return text.split(/(https?:\/\/[^\s<>()]+)/g).map((part, i) => {
    if (!/^https?:\/\//.test(part)) return part;
    const url = part.replace(/[.,;:!?'"]+$/, "");
    const trailing = part.slice(url.length);
    return (
      <span key={i}>
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline break-all">
          {url}
        </a>
        {trailing}
      </span>
    );
  });
}

// Generate or retrieve a persistent session ID for this browser
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("aq_chat_session");
  if (!id) {
    id = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("aq_chat_session", id);
  }
  return id;
}

interface Message {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type ChatMode = "ai" | "team";

export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(getSessionId);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      // @ts-ignore
      const res = await getChatMessages({ data: { sessionId } });
      if (res?.success && res.messages) {
        // @ts-ignore - Handle date to string conversion if needed
        const newMsgs = res.messages as any[];
        setMessages((prev) => {
          const prevLen = prev.length;
          const adminNewMsgs = newMsgs.slice(prevLen).filter((m) => m.isAdmin);
          if (!open && adminNewMsgs.length > 0) {
            setUnread((u) => u + adminNewMsgs.length);
          }
          return newMsgs;
        });
      }
    } catch (_) {}
  }, [sessionId, open]);

  // Poll for team messages every 5 seconds
  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(scrollToBottom, 100);
    }
  }, [open, messages, aiMessages]);

  const askAssistant = async (text: string, history: AiMessage[]) => {
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: history.map((m) => ({ role: m.role, text: m.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const reply =
        data?.reply ||
        (res.status === 429
          ? "Slow down a moment and try again — or email info@aqbeds.com."
          : "Our assistant is unavailable right now. Email info@aqbeds.com or use the contact page.");
      return reply;
    } catch (_) {
      return "Our assistant is unavailable right now. Email info@aqbeds.com or use the contact page.";
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    if (mode === "ai") {
      const userMsg: AiMessage = {
        id: "ai_u_" + Date.now(),
        role: "user",
        content: text,
      };
      const history = [...aiMessages];
      setAiMessages((prev) => [...prev, userMsg]);
      setTimeout(scrollToBottom, 50);

      const reply = await askAssistant(text, history);
      setAiMessages((prev) => [
        ...prev,
        { id: "ai_a_" + Date.now(), role: "assistant", content: reply },
      ]);
      setTimeout(scrollToBottom, 50);
      setSending(false);
      return;
    }

    // Team mode — persisted, admin replies here
    const tempMsg: Message = {
      id: "temp_" + Date.now(),
      content: text,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      // @ts-ignore
      await sendChatMessage({ data: { sessionId, content: text, isAdmin: false } });
      await fetchMessages();
    } catch (_) {}
    setSending(false);
  };

  const visibleMessages: { id: string; content: string; fromSupport: boolean; isAi?: boolean }[] =
    mode === "ai"
      ? aiMessages.map((m) => ({
          id: m.id,
          content: m.content,
          fromSupport: m.role === "assistant",
          isAi: m.role === "assistant",
        }))
      : messages.map((m) => ({
          id: m.id,
          content: m.content,
          fromSupport: m.isAdmin,
        }));

  const isEmpty = visibleMessages.length === 0;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            aria-label="Open live chat"
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 h-14 w-14 rounded-full bg-brand text-white shadow-[0_8px_32px_rgba(11,60,93,0.45)] flex items-center justify-center"
          >
            <MessageCircle className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                {unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-[380px] rounded-3xl overflow-hidden shadow-2xl shadow-black/30 flex flex-col"
            style={{
              height: "520px",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-brand text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/20 grid place-items-center font-black text-sm">
                  AQ
                </div>
                <div>
                  <p className="font-bold text-sm leading-none">AQ Beds Support</p>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    {mode === "ai"
                      ? "Instant answers · team is a tap away"
                      : "We usually reply in minutes"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 hover:bg-white/20 transition-colors grid place-items-center"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mode switch */}
            <div className="flex-shrink-0 px-4 pt-3">
              <div className="flex gap-1 p-1 rounded-full bg-muted text-xs font-bold">
                <button
                  onClick={() => setMode("ai")}
                  aria-pressed={mode === "ai"}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-full transition-colors ${
                    mode === "ai" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask instantly
                </button>
                <button
                  onClick={() => setMode("team")}
                  aria-pressed={mode === "team"}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-full transition-colors ${
                    mode === "team" ? "bg-card text-brand shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Message the team
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
              {isEmpty && (
                <div className="text-center pt-8 pb-4">
                  <div className="h-14 w-14 rounded-full bg-brand/10 grid place-items-center mx-auto mb-3">
                    {mode === "ai" ? (
                      <Sparkles className="h-6 w-6 text-brand" />
                    ) : (
                      <MessageCircle className="h-6 w-6 text-brand" />
                    )}
                  </div>
                  <p className="font-bold text-sm">
                    {mode === "ai" ? "Ask our assistant" : "Chat with us!"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1 max-w-[220px] mx-auto">
                    {mode === "ai"
                      ? "Sizes, delivery, returns, payment — answered in seconds."
                      : "Ask us anything about our beds, sizes, delivery, or orders."}
                  </p>
                </div>
              )}

              {visibleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.fromSupport ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.fromSupport
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-brand text-white rounded-tr-sm"
                    }`}
                  >
                    {linkify(msg.content)}
                    {msg.isAi && (
                      <span className="block mt-1.5 text-[10px] text-muted-foreground">
                        AI assistant ·{" "}
                        <a href="/contact" className="underline">
                          talk to a human
                        </a>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <label className="sr-only" htmlFor="chat-input">
                  Type a message
                </label>
                <input
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === "ai" ? "Ask a question…" : "Type a message…"}
                  className="flex-1 h-10 px-4 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  aria-label="Send message"
                  className="min-h-[44px] min-w-[44px] rounded-full bg-brand text-white grid place-items-center disabled:opacity-40 hover:bg-brand/90 active:scale-90 transition-all flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
