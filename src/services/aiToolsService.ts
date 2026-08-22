import { jarService } from "./jarService";
import { goalService } from "./goalService";
import { incomeService } from "./incomeService";
import { expenseService } from "./expenseService";
import { JAR_ICONS, JAR_COLORS, EXPENSE_CATEGORIES } from "@/constants/app";
import { localISODate } from "@/utils/format";

/** OpenAI/Groq-compatible tool schemas the model can choose to call. */
export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_jar",
      description:
        "Create a new automatic savings jar. A percentage of every future income the user logs is split into this jar automatically.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short name for the jar, e.g. 'Emergency Fund'." },
          percentage: {
            type: "number",
            description: "Percent of every income to route into this jar (1-100).",
          },
          icon: { type: "string", enum: [...JAR_ICONS], description: "Icon id for the jar." },
          color: { type: "string", enum: [...JAR_COLORS], description: "Color tone for the jar." },
        },
        required: ["name", "percentage"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_goal",
      description:
        "Create a savings goal the user wants to reach (e.g. a new bike, an emergency fund target). Optionally link it to an existing jar by name so it fills automatically as that jar grows.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short name for the goal." },
          targetAmount: { type: "number", description: "The amount the user wants to save, > 0." },
          deadline: {
            type: "string",
            description: "Optional target date in YYYY-MM-DD format.",
          },
          jarName: {
            type: "string",
            description: "Optional: name of an existing jar to link this goal to.",
          },
          icon: {
            type: "string",
            enum: ["target", ...JAR_ICONS],
            description: "Icon id for the goal.",
          },
        },
        required: ["name", "targetAmount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_income",
      description:
        "Record income the user earned. This automatically splits it across their existing jars according to each jar's saving percentage, and updates their available balance.",
      parameters: {
        type: "object",
        properties: {
          source: { type: "string", description: "Where the money came from, e.g. 'Swiggy', 'Uber'." },
          amount: { type: "number", description: "Amount earned, > 0." },
          date: { type: "string", description: "Optional date in YYYY-MM-DD format, defaults to today." },
          notes: { type: "string", description: "Optional note." },
        },
        required: ["source", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_expense",
      description: "Record money the user spent.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: EXPENSE_CATEGORIES.map((c) => c.name),
            description: "Expense category.",
          },
          amount: { type: "number", description: "Amount spent, > 0." },
          date: { type: "string", description: "Optional date in YYYY-MM-DD format, defaults to today." },
          note: { type: "string", description: "Optional note." },
        },
        required: ["category", "amount"],
      },
    },
  },
] as const;

export interface AiToolResult {
  /** Short line shown under the assistant's message in the UI, e.g. "Created jar “Rent” (20%)". */
  summary: string;
  success: boolean;
  /** Fed back to the model so it can compose a natural-language reply. */
  resultForModel: string;
}

function clampPercent(n: number) {
  return Math.max(1, Math.min(100, Math.round(n)));
}

function positiveAmount(n: unknown): number {
  const value = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(value) || value <= 0) throw new Error("Amount must be a positive number.");
  return Math.round(value * 100) / 100;
}

export async function executeAiTool(name: string, rawArgs: string): Promise<AiToolResult> {
  let args: Record<string, unknown>;
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    return { success: false, summary: "Couldn't understand the request.", resultForModel: "Invalid arguments JSON." };
  }

  try {
    switch (name) {
      case "create_jar": {
        const jarName = String(args.name ?? "").trim();
        if (!jarName) throw new Error("Jar needs a name.");
        const percentage = clampPercent(Number(args.percentage ?? 0));
        const icon = JAR_ICONS.includes(args.icon as (typeof JAR_ICONS)[number])
          ? (args.icon as string)
          : "piggy-bank";
        const color = JAR_COLORS.includes(args.color as (typeof JAR_COLORS)[number])
          ? (args.color as string)
          : "violet";

        const jar = await jarService.create({ jar_name: jarName, percentage, icon, color });
        return {
          success: true,
          summary: `Created jar "${jar.jar_name}" (${percentage}%)`,
          resultForModel: `Created jar "${jar.jar_name}" saving ${percentage}% of every income. id=${jar.id}`,
        };
      }

      case "create_goal": {
        const goalName = String(args.name ?? "").trim();
        if (!goalName) throw new Error("Goal needs a name.");
        const targetAmount = positiveAmount(args.targetAmount);
        const deadline = typeof args.deadline === "string" && args.deadline ? args.deadline : null;
        const icon =
          typeof args.icon === "string" && ["target", ...JAR_ICONS].includes(args.icon)
            ? args.icon
            : "target";

        let jarId: string | null = null;
        let jarNote = "";
        if (typeof args.jarName === "string" && args.jarName.trim()) {
          const jars = await jarService.list();
          const match = jars.find(
            (jar) => jar.jar_name.toLowerCase() === (args.jarName as string).trim().toLowerCase(),
          );
          if (match) {
            jarId = match.id;
            jarNote = ` linked to jar "${match.jar_name}"`;
          } else {
            jarNote = ` (no jar named "${args.jarName}" was found, so it wasn't linked to one)`;
          }
        }

        const goal = await goalService.create({
          goal_name: goalName,
          target_amount: targetAmount,
          deadline,
          icon,
          jar_id: jarId,
        });
        return {
          success: true,
          summary: `Created goal "${goal.goal_name}"${jarNote}`,
          resultForModel: `Created goal "${goal.goal_name}" with target ${targetAmount}${jarNote}. id=${goal.id}`,
        };
      }

      case "log_income": {
        const source = String(args.source ?? "").trim() || "Other";
        const amount = positiveAmount(args.amount);
        const date = typeof args.date === "string" && args.date ? args.date : localISODate();
        const notes = typeof args.notes === "string" ? args.notes : "";

        await incomeService.create({ amount, source, income_date: date, notes });
        return {
          success: true,
          summary: `Logged income: ${source} +${amount}`,
          resultForModel: `Recorded income of ${amount} from ${source} on ${date}, split into jars automatically.`,
        };
      }

      case "log_expense": {
        const category =
          EXPENSE_CATEGORIES.find(
            (c) => c.name.toLowerCase() === String(args.category ?? "").toLowerCase(),
          )?.name ?? "Other";
        const amount = positiveAmount(args.amount);
        const date = typeof args.date === "string" && args.date ? args.date : localISODate();
        const note = typeof args.note === "string" ? args.note : null;

        await expenseService.create({ category, amount, expense_date: date, note });
        return {
          success: true,
          summary: `Logged expense: ${category} -${amount}`,
          resultForModel: `Recorded expense of ${amount} for ${category} on ${date}.`,
        };
      }

      default:
        return {
          success: false,
          summary: `Unknown action "${name}"`,
          resultForModel: `No tool named "${name}" exists.`,
        };
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Something went wrong.";
    return {
      success: false,
      summary: `Couldn't complete that: ${messageText}`,
      resultForModel: `Failed: ${messageText}`,
    };
  }
}
