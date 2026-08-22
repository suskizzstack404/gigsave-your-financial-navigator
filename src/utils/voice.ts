import { INCOME_SOURCES, EXPENSE_CATEGORIES } from "@/constants/app";
import { localISODate, addDays } from "./format";

export interface ParsedVoiceEntry {
  kind: "income" | "expense";
  amount: number | null;
  source: string;
  category: string;
  date: string;
  raw: string;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
};

const EXPENSE_WORDS = [
  "spent",
  "spend",
  "paid",
  "pay",
  "bought",
  "buy",
  "expense",
  "cost",
  "kharch",
];
const INCOME_WORDS = ["earn", "earned", "income", "made", "got", "received", "kamaya", "salary"];

/**
 * Turns a spoken sentence such as "I earned 1200 rupees from Swiggy today"
 * into a structured entry the forms can pre-fill.
 */
export function parseVoiceEntry(transcript: string): ParsedVoiceEntry {
  const text = transcript.toLowerCase().trim();

  const expenseHits = EXPENSE_WORDS.filter((word) => text.includes(word)).length;
  const incomeHits = INCOME_WORDS.filter((word) => text.includes(word)).length;
  const kind: "income" | "expense" = expenseHits > incomeHits ? "expense" : "income";

  let amount: number | null = null;
  const digits = text
    .replace(/,/g, "")
    .match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(k|thousand|hazaar|hazar)?/i);
  if (digits) {
    amount = Number(digits[1]);
    if (digits[2]) amount *= 1000;
  } else {
    let total = 0;
    let current = 0;
    for (const word of text.split(/\s+/)) {
      const value = WORD_NUMBERS[word];
      if (value === undefined) continue;
      if (value === 100 || value === 1000) {
        current = (current || 1) * value;
        total += current;
        current = 0;
      } else {
        current += value;
      }
    }
    const sum = total + current;
    if (sum > 0) amount = sum;
  }

  let date = localISODate();
  if (text.includes("yesterday") || text.includes("kal"))
    date = localISODate(addDays(new Date(), -1));

  const source =
    INCOME_SOURCES.find((item) => text.includes(item.toLowerCase())) ??
    (text.includes("delivery") ? "Other" : "Other");

  const category =
    EXPENSE_CATEGORIES.find((item) => text.includes(item.name.toLowerCase()))?.name ??
    (text.includes("petrol") || text.includes("diesel") || text.includes("cng")
      ? "Fuel"
      : text.includes("lunch") ||
          text.includes("dinner") ||
          text.includes("tea") ||
          text.includes("breakfast")
        ? "Food"
        : text.includes("mobile") || text.includes("data")
          ? "Recharge"
          : text.includes("doctor") || text.includes("medicine")
            ? "Medical"
            : text.includes("service") || text.includes("puncture") || text.includes("repair")
              ? "Bike Repair"
              : "Other");

  return { kind, amount, source, category, date, raw: transcript.trim() };
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}
