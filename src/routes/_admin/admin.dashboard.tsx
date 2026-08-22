import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, IndianRupee, PiggyBank, Target, TrendingUp, TrendingDown } from "lucide-react";

import { adminService, type PlatformStats } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_admin/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ["admin", "platform-stats"],
    queryFn: () => adminService.getPlatformStats(),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of GigSave platform metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.total_users}
          isLoading={isLoading}
          color="violet"
        />
        <StatCard
          icon={IndianRupee}
          label="Total Income Logged"
          value={stats?.total_income}
          isLoading={isLoading}
          isCurrency
          color="teal"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenses"
          value={stats?.total_expenses}
          isLoading={isLoading}
          isCurrency
          color="pink"
        />
        <StatCard
          icon={PiggyBank}
          label="Total Savings"
          value={stats?.total_savings}
          isLoading={isLoading}
          isCurrency
          color="amber"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Target}
          label="Total Goals"
          value={stats?.total_goals}
          isLoading={isLoading}
          subtitle={`${stats?.completed_goals ?? 0} completed`}
          color="purple"
        />
        <StatCard
          icon={Users}
          label="New Users Today"
          value={stats?.users_today}
          isLoading={isLoading}
          color="sky"
        />
        <StatCard
          icon={TrendingUp}
          label="Income Today"
          value={stats?.income_today}
          isLoading={isLoading}
          isCurrency
          color="teal"
        />
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900">Platform Health</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Savings Rate</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats && stats.total_income > 0
                  ? `${((stats.total_savings / stats.total_income) * 100).toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expense Ratio</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats && stats.total_income > 0
                  ? `${((stats.total_expenses / stats.total_income) * 100).toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Goal Completion Rate</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats && stats.total_goals > 0
                  ? `${((stats.completed_goals / stats.total_goals) * 100).toFixed(1)}%`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900">Today's Activity</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Income Logged</span>
              <span className="text-sm font-semibold text-teal-600">
                ₹{stats?.income_today?.toLocaleString("en-IN") ?? "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expenses Logged</span>
              <span className="text-sm font-semibold text-pink-600">
                ₹{stats?.expenses_today?.toLocaleString("en-IN") ?? "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Signups</span>
              <span className="text-sm font-semibold text-violet-600">
                {stats?.users_today ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  isCurrency,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value?: number;
  isLoading: boolean;
  isCurrency?: boolean;
  subtitle?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "bg-violet-50 text-violet-600",
    teal: "bg-teal-50 text-teal-600",
    pink: "bg-pink-50 text-pink-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    sky: "bg-sky-50 text-sky-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-lg ${colorMap[color] || colorMap.violet}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">
            {isCurrency
              ? `₹${(value ?? 0).toLocaleString("en-IN")}`
              : (value ?? 0).toLocaleString()}
          </p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
