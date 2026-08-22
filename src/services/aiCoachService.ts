// GigSave AI Assistant — calls Groq's Chat Completions API directly from the
// browser using VITE_GROQ_API_KEY.
//
// ⚠️  This key ships inside the client JS bundle and is visible to anyone who
// inspects the network tab or the built files — there is no way to hide a
// key that has to be usable from the browser. If you ever expect real
// traffic beyond your own testing, move this call behind a server-side proxy
// (e.g. a Supabase Edge Function) instead, so the key never leaves the
// server.
//
// Tool calling: the model can call create_jar / create_goal / log_income /
// log_expense (defined in aiToolsService.ts). When it does, we actually run
// them against Supabase via the same services the rest of the app uses, feed
// the result back to the model, and let it compose a natural-language reply.

import { AI_TOOLS, executeAiTool, type AiToolResult } from "./aiToolsService";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const GROQ_MODEL = "openai/gpt-oss-120b";
const MAX_TOOL_ROUNDS = 3;

export interface AiCoachMessage {
  role: "user" | "assistant";
  content: string;
}

/** Compact, privacy-conscious snapshot sent as ground truth to the AI — no raw transaction lists. */
export interface AiCoachContext {
  currency: string;
  availableBalance: number;
  totalEarned: number;
  totalSpent: number;
  totalSaved: number;
  dailySavingsRate: number;
  streak: number;
  health: { score: number; label: string };
  jars: { name: string; percentage: number; balance: number }[];
  goals: { name: string; targetAmount: number; currentAmount: number; percentComplete: number }[];
}

export interface AiCoachReply {
  reply: string;
  /** Actions actually executed against the user's real data, for the UI to confirm + refresh. */
  actions: { summary: string; success: boolean }[];
}

const SYSTEM_PROMPT = `You are the GigSave AI Assistant — a friendly, practical money coach for gig workers
(delivery riders, drivers, freelancers) who earn irregular income.

Rules:
- Be warm, concise and encouraging. Keep replies under ~120 words unless the user asks for more detail.
- Only use the financial numbers given to you in the "User's current snapshot" JSON below. Never invent numbers.
- If the snapshot doesn't contain something you'd need to answer precisely, say so and suggest where in the
  app the user can find or add it (Income, Expenses, Jars, Goals, Analytics).
- You can take real action using the provided tools: create_jar, create_goal, log_income, log_expense.
  When the user confirms they want something done (e.g. they say "yes" to creating a goal, or directly ask
  you to log an expense/income or set up a jar), CALL THE TOOL — don't just describe what you would do.
  If you don't have enough details yet (e.g. no amount or name), ask a short clarifying question first
  instead of guessing.
- After a tool runs, tell the user plainly what actually happened using the tool's result.
- Use the currency shown in the snapshot when quoting amounts.`;

interface RawMessage {
  role: string;
  content: string | null;
  tool_calls?: { id: string; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
  name?: string;
}

async function callGroq(messages: RawMessage[], includeTools: boolean) {
  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.6,
        max_tokens: 500,
        ...(includeTools ? { tools: AI_TOOLS, tool_choice: "auto" } : {}),
      }),
    });
  } catch {
    throw new Error("Couldn't reach Groq. Check your connection and try again.");
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("[aiCoachService] Groq error", response.status, errText);
    if (response.status === 401) {
      throw new Error("Groq rejected the request — check that VITE_GROQ_API_KEY is valid.");
    }
    throw new Error("The AI service is unavailable right now. Please try again shortly.");
  }

  const data = await response.json();
  const message: RawMessage | undefined = data?.choices?.[0]?.message;
  if (!message) throw new Error("The AI didn't return a reply. Please try again.");
  return message;
}

export const aiCoachService = {
  async ask(message: string, context: AiCoachContext, history: AiCoachMessage[]): Promise<AiCoachReply> {
    if (!GROQ_API_KEY) {
      throw new Error(
        "The AI assistant isn't configured yet. Add VITE_GROQ_API_KEY to your .env file and restart the dev server.",
      );
    }

    const contextSummary = `User's current snapshot (ground truth — treat as accurate, do not contradict it):\n${JSON.stringify(context)}`;

    const messages: RawMessage[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${contextSummary}` },
      ...history.slice(-8),
      { role: "user", content: message },
    ];

    const actions: AiToolResult[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const assistantMessage = await callGroq(messages, true);
      messages.push(assistantMessage);

      if (!assistantMessage.tool_calls?.length) {
        return {
          reply: assistantMessage.content?.trim() || "Done.",
          actions: actions.map((a) => ({ summary: a.summary, success: a.success })),
        };
      }

      for (const call of assistantMessage.tool_calls) {
        const result = await executeAiTool(call.function.name, call.function.arguments);
        actions.push(result);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: result.resultForModel,
        });
      }
    }

    // Ran out of tool rounds — ask once more without tools to force a final text reply.
    const final = await callGroq(messages, false);
    return {
      reply: final.content?.trim() || "Done.",
      actions: actions.map((a) => ({ summary: a.summary, success: a.success })),
    };
  },
};
