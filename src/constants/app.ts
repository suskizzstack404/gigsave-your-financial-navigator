export const APP_NAME = "GigSave";
export const APP_TAGLINE = "Earn Today. Save Automatically. Achieve Tomorrow.";

export const INCOME_SOURCES = [
  "Zomato",
  "Swiggy",
  "Blinkit",
  "Zepto",
  "Uber",
  "Ola",
  "Rapido",
  "Freelance",
  "Daily Wage",
  "Tips",
  "Other",
] as const;

export type ExpenseCategory =
  "Fuel" | "Food" | "Rent" | "Shopping" | "Medical" | "Recharge" | "Bike Repair" | "Other";

export const EXPENSE_CATEGORIES: { name: ExpenseCategory; icon: string; tone: string }[] = [
  { name: "Fuel", icon: "fuel", tone: "violet" },
  { name: "Food", icon: "utensils", tone: "pink" },
  { name: "Rent", icon: "home", tone: "sky" },
  { name: "Shopping", icon: "shopping-bag", tone: "amber" },
  { name: "Medical", icon: "heart-pulse", tone: "teal" },
  { name: "Recharge", icon: "smartphone", tone: "purple" },
  { name: "Bike Repair", icon: "wrench", tone: "violet" },
  { name: "Other", icon: "circle-dashed", tone: "sky" },
];

export const JAR_ICONS = [
  "shield",
  "heart",
  "trending-up",
  "bike",
  "graduation-cap",
  "plane",
  "home",
  "piggy-bank",
  "gift",
  "briefcase",
] as const;

export const JAR_COLORS = ["violet", "purple", "pink", "sky", "amber", "teal"] as const;
export type JarColor = (typeof JAR_COLORS)[number];

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "mr", label: "मराठी (Marathi)" },
];

export const OCCUPATIONS = [
  "Zomato Delivery Partner",
  "Swiggy Delivery Partner",
  "Blinkit Rider",
  "Zepto Rider",
  "Uber Driver",
  "Ola Driver",
  "Rapido Captain",
  "Freelancer",
  "Daily Wage Worker",
  "Other",
];
