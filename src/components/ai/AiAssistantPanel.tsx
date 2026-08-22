import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AiOrb } from "./AiOrb";
import { buildAiContext, AI_ACTION_QUERY_KEYS, type Overview } from "./aiContext";
import { getSpeechRecognition } from "@/utils/voice";
import { cn } from "@/lib/utils";
import { firstName } from "@/utils/format";
import { aiCoachService, type AiCoachMessage } from "@/services/aiCoachService";
import { chatHistoryService } from "@/services/chatHistoryService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SUGGESTIONS = [
  "How much have I saved this month?",
  "Help me create a savings goal",
  "Analyze my recent spending",
  "Give me a personalized saving tip",
];

type VoiceState = "idle" | "listening" | "thinking";

const VOICE_LABEL: Record<VoiceState, string> = {
  idle: "",
  listening: "Listening…",
  thinking: "Thinking…",
};

/** Short two-tone "activation" blip — no audio asset, synthesized on the fly. */
function playActivationTone() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(560, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close();
  } catch {
    // Sound is a nice-to-have — never let it block the actual flow.
  }
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speaking the reply aloud is a bonus — silently skip if unsupported.
  }
}

export function AiAssistantPanel({ overview }: { overview: Overview }) {
  const [messages, setMessages] = useState<AiCoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<ReturnType<typeof getSpeechRecognition>>(null);
  const queryClient = useQueryClient();
  const name = firstName(overview.profile?.full_name);
  const hasName = Boolean(overview.profile?.full_name);

  useEffect(() => {
    setVoiceSupported(getSpeechRecognition() !== null);
  }, []);

  // Load persisted conversation once on mount so it survives closing/reopening
  // the panel and page refreshes. Voice and text share this exact history.
  useEffect(() => {
    let cancelled = false;
    chatHistoryService
      .list()
      .then((rows) => {
        if (cancelled) return;
        setMessages(rows.map((row) => ({ role: row.role as "user" | "assistant", content: row.content })));
      })
      .catch((error) => {
        console.error("[AiAssistantPanel] failed to load chat history", error);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });
    return () => {
      cancelled = true;
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, pending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  async function send(text: string, viaVoice = false) {
    const trimmed = text.trim();
    if (!trimmed || pending || !historyLoaded) return;

    const nextMessages: AiCoachMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    if (viaVoice) setVoiceState("thinking");

    chatHistoryService.append("user", trimmed).catch((error) => {
      console.error("[AiAssistantPanel] failed to save user message", error);
    });

    try {
      const { reply, actions } = await aiCoachService.ask(trimmed, buildAiContext(overview), nextMessages);

      const confirmedActions = actions.filter((a) => a.success);
      const failedActions = actions.filter((a) => !a.success);
      const actionLines = [
        ...confirmedActions.map((a) => `✅ ${a.summary}`),
        ...failedActions.map((a) => `⚠️ ${a.summary}`),
      ];
      const finalContent = actionLines.length ? `${reply}\n\n${actionLines.join("\n")}` : reply;

      setMessages((current) => [...current, { role: "assistant", content: finalContent }]);
      chatHistoryService.append("assistant", finalContent).catch((error) => {
        console.error("[AiAssistantPanel] failed to save assistant message", error);
      });

      if (confirmedActions.length > 0) {
        AI_ACTION_QUERY_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      }

      if (viaVoice) speak(reply);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The assistant couldn't reply. Try again.");
    } finally {
      setPending(false);
      setVoiceState("idle");
    }
  }

  function toggleListening() {
    if (pending) return;

    if (voiceState === "listening") {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) {
      setVoiceSupported(false);
      toast("Voice input isn't supported on this device. You can type instead.");
      textareaRef.current?.focus();
      return;
    }

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const heard = event.results[0]?.[0]?.transcript ?? "";
      if (heard) {
        send(heard, true);
      } else {
        setVoiceState("idle");
        toast("Didn't catch that — try again.");
      }
    };
    recognition.onerror = (event) => {
      setVoiceState("idle");
      toast.error(
        event.error === "not-allowed"
          ? "Microphone access is needed for voice entry."
          : "Couldn't catch that — please try again.",
      );
    };
    recognition.onend = () => {
      setVoiceState((current) => (current === "listening" ? "idle" : current));
    };

    recognitionRef.current = recognition;
    playActivationTone();
    setVoiceState("listening");
    recognition.start();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    send(input);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  }

  async function clearChat() {
    const previous = messages;
    // Optimistic: snap back to the empty/welcome state immediately.
    setMessages([]);
    try {
      // Only deletes this user's ai_chat_messages rows — no other table is
      // touched, so financial data, jars, goals and profile are unaffected.
      await chatHistoryService.clear();
      toast.success("Chat cleared");
    } catch (error) {
      setMessages(previous);
      toast.error(error instanceof Error ? error.message : "Couldn't clear the chat. Try again.");
    }
  }

  const isEmpty = messages.length === 0;
  const orbActive = voiceState !== "idle";
  const orbLabel =
    voiceState === "listening"
      ? "GigSave AI is listening"
      : voiceState === "thinking"
        ? "GigSave AI is thinking"
        : "Talk to GigSave AI";

  return (
    <div className="relative animate-fade-up overflow-hidden rounded-[2.25rem] border border-border bg-gradient-to-b from-lime-100/50 via-card to-card p-5 shadow-sm sm:p-7">
      <div className="pointer-events-none absolute inset-x-10 top-0 -z-10 h-40 rounded-full bg-lime-300/25 blur-3xl" />

      {!isEmpty ? (
        <div className="mb-1 flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground"
                aria-label="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear chat
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to clear this chat?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes your conversation with GigSave AI. Your income, expenses, jars,
                  goals and profile are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearChat}>Clear chat</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}

      {voiceState !== "idle" ? (
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-lime-700">
          {VOICE_LABEL[voiceState]}
        </p>
      ) : null}

      {isEmpty ? (
        <div className="flex flex-col items-center px-1 py-6 text-center sm:py-10">
          <button
            type="button"
            onClick={toggleListening}
            aria-label={orbLabel}
            className="relative rounded-full outline-none transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
          >
            {voiceState === "listening" ? (
              <>
                <span className="absolute inset-0 -z-10 animate-ping-ring rounded-full border-2 border-lime-400" />
                <span className="absolute inset-0 -z-10 animate-ping-ring rounded-full border-2 border-lime-400 [animation-delay:0.5s]" />
              </>
            ) : null}
            <AiOrb size={88} active={orbActive} />
          </button>

          <h2 className="mt-5 max-w-xs text-xl font-semibold tracking-tight text-foreground sm:max-w-sm">
            {voiceState !== "idle"
              ? VOICE_LABEL[voiceState]
              : `What can I help you with today${hasName ? `, ${name}` : ""}?`}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {voiceSupported ? "Tap the orb to talk, or type below" : "Type below to chat"}
          </p>

          <div className="mt-7 w-full max-w-md space-y-2.5">
            {SUGGESTIONS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => send(prompt)}
                className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-left text-sm text-foreground/80 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/60 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="max-h-[26rem] space-y-3 overflow-y-auto py-2 pr-1 sm:max-h-[30rem]">
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} content={m.content} />
          ))}
          {pending ? <TypingBubble label={voiceState === "thinking" ? "Thinking…" : undefined} /> : null}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex items-end gap-2 rounded-3xl border border-border bg-background/80 p-2 pl-3 shadow-sm transition-all duration-200 focus-within:border-primary/40 focus-within:shadow-[0_0_0_4px_var(--lime-100)]"
      >
        <button
          type="button"
          onClick={() => toast("Attachments aren't available yet.")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-transform duration-200 hover:scale-105 hover:text-foreground active:scale-95"
          aria-label="Add attachment"
        >
          <Plus className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask GigSave AI anything about your money…"
          className="max-h-[120px] flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />

        {!isEmpty ? (
          <button
            type="button"
            onClick={toggleListening}
            aria-label={orbLabel}
            className="relative grid h-10 w-10 shrink-0 place-items-center transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            {voiceState === "listening" ? (
              <span className="absolute inset-0 -z-10 animate-ping-ring rounded-full border-2 border-lime-400" />
            ) : null}
            <AiOrb size={36} active={orbActive} />
          </button>
        ) : null}

        <button
          type="submit"
          disabled={!input.trim() || pending || !historyLoaded}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ role, content }: { role: AiCoachMessage["role"]; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex animate-fade-up", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-md bg-black text-white"
            : "rounded-bl-md border border-border bg-background text-foreground",
        )}
      >
        {content}
      </div>
    </div>
  );
}

function TypingBubble({ label }: { label?: string }) {
  return (
    <div className="flex animate-fade-in justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 shadow-sm">
        {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
        <span className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-lime-600"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
