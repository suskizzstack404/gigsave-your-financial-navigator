import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  BarChart3,
  Lock,
  Mic,
  MoreHorizontal,
  PiggyBank,
  ShieldCheck,
  Share2,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ReferenceAnalyticsCard } from "@/components/analytics/ReferenceAnalyticsCard";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE } from "@/constants/app";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GigSave — Smart Expense & Goal Tracker for Gig Workers" },
      {
        name: "description",
        content:
          "Track daily gig earnings, control expenses and auto-split every payout into savings jars that fund your goals.",
      },
      { property: "og:title", content: "GigSave — Save automatically from every gig payout" },
      {
        property: "og:description",
        content: "Built for delivery riders, drivers and freelancers with irregular income.",
      },
    ],
  }),
  component: LandingPage,
});

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Analytics", href: "#analytics" },
  { label: "About", href: "#about" },
];

const SECTION_IDS = NAV_LINKS.map((link) => link.href.slice(1));

/** Lightweight scrollspy: highlights the nav link for whichever section is
 * currently near the vertical center of the viewport. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return active;
}

const SAMPLE_TREND = [
  { label: "Mar", income: 34500, expenses: 22100 },
  { label: "Apr", income: 37200, expenses: 24300 },
  { label: "May", income: 39800, expenses: 25600 },
  { label: "Jun", income: 36400, expenses: 23900 },
  { label: "Jul", income: 41200, expenses: 26800 },
  { label: "Aug", income: 42500, expenses: 27840 },
];

const SAMPLE_CATEGORIES = [
  { name: "Food", value: 8200 },
  { name: "Transport", value: 6100 },
  { name: "Bills", value: 5400 },
  { name: "Shopping", value: 4300 },
  { name: "Other", value: 3840 },
];

const SAMPLE_CATEGORY_COLORS = [
  "var(--chart-income)",
  "var(--lime-800)",
  "var(--chart-neutral)",
  "oklch(0.4 0.006 100)",
  "var(--lime-300)",
];

const SAMPLE_TRANSACTIONS = [
  { label: "Swiggy payout", amount: 1240, kind: "income" as const },
  { label: "Zomato payout", amount: 980, kind: "income" as const },
  { label: "Groceries", amount: -850, kind: "expense" as const },
  { label: "Uber ride", amount: -320, kind: "expense" as const },
  { label: "Electricity bill", amount: -1200, kind: "expense" as const },
];

const SAMPLE_OVERVIEW = {
  income: 42500,
  expenses: 27840,
  savings: 14660,
  savingsRate: 34.5,
};

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const FEATURES = [
  {
    icon: Wallet,
    title: "Log earnings in seconds",
    body: "Record every payout from Swiggy, Zomato, Uber, Ola or private clients in one tap.",
  },
  {
    icon: PiggyBank,
    title: "Automatic savings jars",
    body: "Set a percentage per jar and GigSave splits every rupee you earn the moment it lands.",
  },
  {
    icon: Target,
    title: "Goals that finish themselves",
    body: "Link jars to goals like a new bike or emergency fund and watch the countdown shrink.",
  },
  {
    icon: BarChart3,
    title: "Know your real numbers",
    body: "Weekly trends, category breakdowns and a financial health score out of 100.",
  },
  {
    icon: Mic,
    title: "Voice entry",
    body: 'Just say "earned 1200 from Zomato today" and the form fills itself.',
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your data is locked to your account with row-level security. Nobody else can read it.",
  },
];

const WEEK_BARS = [38, 55, 46, 70, 60, 88, 64];
const SPARK_POINTS = "0,18 15,14 30,16 45,9 60,11 75,4 100,6";

function LandingPage() {
  const navigate = useNavigate();
  const activeSection = useActiveSection(SECTION_IDS);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) navigate({ to: "/dashboard", replace: true });
      })
      .catch((error) => {
        console.error("[LandingPage] session check failed", error);
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f2f3ef] text-zinc-900">
      {/* ---------- Header ---------- */}
      <div className="sticky top-0 z-50 px-4 pt-5 sm:px-6">
        <header className="mx-auto flex max-w-6xl animate-slide-down items-center justify-between rounded-full bg-black px-3 py-2.5 pl-5 shadow-lg sm:px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-lime-400 text-black">
              <PiggyBank className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold tracking-tight text-white">{APP_NAME}</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.href.slice(1);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group relative py-1 transition-colors hover:text-white",
                    isActive && "text-white",
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-lime-400 transition-transform duration-200 group-hover:scale-x-100",
                      isActive && "scale-x-100",
                    )}
                  />
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-lime-400 font-semibold text-black hover:bg-lime-300"
            >
              <Link to="/auth">Create account</Link>
            </Button>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* ---------- Hero ---------- */}
        <section id="home" className="scroll-mt-28 py-14 text-center sm:py-20">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-lime-400 [animation-delay:80ms]">
            For riders, drivers &amp; freelancers
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl animate-fade-up text-4xl font-extrabold leading-[1.08] tracking-tight text-zinc-950 [animation-delay:160ms] sm:text-6xl">
            Turn irregular gig income into{" "}
            <span className="relative inline-block">
              <span className="absolute inset-x-0 bottom-1.5 h-3 -rotate-1 rounded bg-lime-300 sm:bottom-2.5 sm:h-5" />
              <span className="relative">steady savings</span>
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl animate-fade-up text-base text-zinc-500 [animation-delay:240ms] sm:text-lg">
            {APP_TAGLINE}
          </p>
          <div className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:320ms] sm:flex-row">
            <Button asChild size="pill" className="bg-black text-white hover:bg-zinc-800">
              <Link to="/auth">
                Start saving free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="pill"
              className="border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50"
            >
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>

          {/* ---------- Hero dashboard mockup ---------- */}
          <div
            id="how-it-works"
            className="relative mx-auto mt-20 max-w-4xl scroll-mt-28 animate-fade-up px-2 [animation-delay:420ms] sm:mt-24"
          >
            <div className="absolute inset-x-12 top-16 -z-10 h-72 rounded-full bg-lime-300/50 blur-[90px]" />

            <div className="relative rounded-[2rem] border border-black/5 bg-black p-2 shadow-2xl sm:p-3">
              <div className="rounded-[1.5rem] bg-[#f5f6f2] p-4 text-left sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-black text-lime-400">
                      <PiggyBank className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold sm:text-sm">{APP_NAME}</span>
                  </div>
                  <div className="hidden items-center gap-1 rounded-full bg-white px-1 py-1 text-[11px] font-medium shadow-sm sm:flex">
                    <span className="rounded-full bg-lime-400 px-3 py-1.5 font-semibold text-black">
                      Dashboard
                    </span>
                    <span className="px-3 py-1.5 text-zinc-500">Jars</span>
                    <span className="px-3 py-1.5 text-zinc-500">Goals</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2.5 shadow-sm sm:pr-3">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                      RK
                    </span>
                    <span className="hidden text-[11px] font-medium sm:inline">Rahul K.</span>
                  </div>
                </div>

                <p className="mt-5 text-base font-bold sm:text-lg">Welcome back, Rahul 👋</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatCard label="Available balance" value="₹12,480" delta="+9.4%" positive points={SPARK_POINTS} />
                  <StatCard label="This week's earnings" value="₹4,320" delta="+2.1%" positive points="0,10 15,13 30,8 45,15 60,10 75,17 100,6" />
                  <StatCard label="Saved to jars" value="₹3,150" delta="+14.7%" positive points="0,20 15,15 30,17 45,10 60,12 75,7 100,3" />
                </div>

                <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
                    <span>Weekly payout volume</span>
                    <span>Last 7 days</span>
                  </div>
                  <div className="mt-4 flex h-24 items-end gap-2 sm:h-28">
                    {WEEK_BARS.map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-lime-300 to-lime-500" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-zinc-400">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating chip: today's earning */}
            <div
              className="absolute -left-2 top-4 hidden animate-float rounded-2xl bg-white px-4 py-2.5 shadow-xl ring-1 ring-black/5 sm:block"
              style={{ "--float-rotate": "-4deg", animationDelay: "0.1s", animationDuration: "5.5s" } as React.CSSProperties}
            >
              <p className="text-[10px] font-semibold text-zinc-400">Today</p>
              <p className="text-base font-bold text-lime-600">+₹350.00</p>
            </div>

            {/* Floating chip: payout notification */}
            <div
              className="absolute -left-14 top-44 hidden w-48 animate-float rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 md:block"
              style={{ "--float-rotate": "-2deg", animationDelay: "0.6s", animationDuration: "6.5s" } as React.CSSProperties}
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
                  <Bike className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">Swiggy payout</p>
                  <p className="text-[10px] text-zinc-400">Received just now</p>
                </div>
              </div>
            </div>

            {/* Floating chip: rider card / withdraw */}
            <div
              className="absolute -left-10 bottom-2 hidden w-56 animate-float rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5 md:block"
              style={{ animationDelay: "1s", animationDuration: "7s" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                  AK
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">Amit Kumar</p>
                  <p className="text-[10px] text-zinc-400">Delivery partner</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-full bg-lime-400 px-3.5 py-1.5 text-xs font-semibold text-black">
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Withdraw
                </span>
                <span className="text-[10px] tracking-wide">UPI</span>
              </div>
            </div>

            {/* Floating chip: avg earnings chart */}
            <div
              className="absolute -right-4 top-0 hidden w-40 animate-float rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 md:block"
              style={{ "--float-rotate": "3deg", animationDelay: "0.3s", animationDuration: "6s" } as React.CSSProperties}
            >
              <p className="text-[10px] font-semibold leading-snug text-zinc-400">
                Avg. earnings per week
              </p>
              <div className="mt-2 flex h-14 items-end gap-1">
                {[40, 65, 50, 80, 60, 90].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-lime-400" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* Floating chip: split into jars */}
            <div
              className="absolute -right-10 bottom-10 hidden w-52 animate-float rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5 lg:block"
              style={{ animationDelay: "1.4s", animationDuration: "6.8s" }}
            >
              <div className="flex -space-x-2">
                {["bg-lime-400", "bg-zinc-900", "bg-orange-400"].map((c, i) => (
                  <span
                    key={i}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-white",
                      c,
                    )}
                  >
                    {["₹", "%", "₹"][i]}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <span>Split into jars</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-lime-400 text-black">
                  <Share2 className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            <div
              className="absolute -right-3 -top-3 hidden h-10 w-10 animate-float place-items-center rounded-full bg-lime-400 text-black shadow-lg md:grid"
              style={{ animationDelay: "0.2s", animationDuration: "5s" }}
            >
              <Zap className="h-5 w-5" />
            </div>
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" className="scroll-mt-28 pt-10 sm:pt-16">
          <Reveal className="mx-auto max-w-xl text-center">
            <span className="inline-flex items-center rounded-full bg-lime-300/60 px-3 py-1 text-xs font-semibold text-zinc-800">
              Why GigSave
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
              Everything you need to save on irregular income
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} index={i} stagger={80} className="card-hover rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-400 text-black">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-zinc-500">{body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Reference Analytics ---------- */}
        <section id="analytics" className="scroll-mt-28 pt-16 sm:pt-24">
          <Reveal className="mx-auto max-w-xl text-center">
            <span className="inline-flex items-center rounded-full bg-lime-300/60 px-3 py-1 text-xs font-semibold text-zinc-800">
              Reference Analytics
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
              This is what your dashboard looks like
            </h2>
            <p className="mt-3 text-sm text-zinc-500">
              Sample data below — sign up and it fills in with your own numbers.
            </p>
          </Reveal>

          <ReferenceAnalyticsCard
            className="mt-10"
            stats={[
              { label: "Monthly income", value: formatINR(SAMPLE_OVERVIEW.income) },
              { label: "Monthly expenses", value: formatINR(SAMPLE_OVERVIEW.expenses) },
              { label: "Total savings", value: formatINR(SAMPLE_OVERVIEW.savings) },
              { label: "Savings rate", value: `${SAMPLE_OVERVIEW.savingsRate}%` },
            ]}
            trend={SAMPLE_TREND}
            categories={SAMPLE_CATEGORIES}
            categoryColors={SAMPLE_CATEGORY_COLORS}
            transactions={SAMPLE_TRANSACTIONS}
            formatValue={formatINR}
          />
        </section>

        {/* ---------- About ---------- */}
        <section id="about" className="scroll-mt-28 pt-16 sm:pt-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <Reveal>
              <span className="inline-flex items-center rounded-full bg-lime-300/60 px-3 py-1 text-xs font-semibold text-zinc-800">
                About GigSave
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
                Built for the reality of gig work
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-500 sm:text-base">
                Payouts don't arrive on a schedule. Some weeks are great, some are thin — and most
                budgeting apps assume a steady paycheck that never shows up. GigSave was built
                around irregular income from day one: log what comes in from any platform, and it
                automatically sets money aside before you get a chance to spend it.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500 sm:text-base">
                No bank connection required, no assumptions about your schedule — just your
                numbers, split into jars, working toward goals you actually set.
              </p>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  icon: Sparkles,
                  title: "Made for irregular income",
                  body: "No fixed paycheck assumptions — log earnings whenever they land.",
                },
                {
                  icon: Lock,
                  title: "Private by default",
                  body: "Your data is scoped to your account with row-level security.",
                },
                {
                  icon: ShieldCheck,
                  title: "No bank link required",
                  body: "You stay in control — enter what you earn and spend yourself.",
                },
              ].map(({ icon: Icon, title, body }, i) => (
                <Reveal
                  key={title}
                  index={i}
                  stagger={80}
                  className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime-400 text-black">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <Reveal
          as="section"
          className="mt-16 rounded-[2.5rem] bg-black px-6 py-14 text-center text-white sm:py-16"
        >
          <h2 className="text-2xl font-bold sm:text-3xl">
            Your next payout can start a savings habit
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/70">
            Set up your jars once. GigSave handles the discipline from there.
          </p>
          <Button
            asChild
            size="pill"
            className="mt-7 bg-lime-400 font-semibold text-black hover:bg-lime-300"
          >
            <Link to="/auth">Create your free account</Link>
          </Button>
        </Reveal>
      </main>

      <footer className="border-t border-black/5 py-6 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} {APP_NAME}. Built for gig workers.
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  positive,
  points,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  points: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span className="truncate">{label}</span>
        <MoreHorizontal className="h-3.5 w-3.5 shrink-0" />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-lg font-bold sm:text-xl">{value}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            positive ? "bg-lime-100 text-lime-700" : "bg-red-100 text-red-600",
          )}
        >
          {delta}
        </span>
      </div>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="mt-2 h-6 w-full">
        <polyline
          points={points}
          fill="none"
          stroke={positive ? "#65a30d" : "#dc2626"}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
