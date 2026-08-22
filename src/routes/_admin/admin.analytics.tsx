import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, IndianRupee, PiggyBank, TrendingUp } from "lucide-react";

import { adminService, type PlatformStats, type UserListResult } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_admin/admin/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["admin", "platform-stats"],
    queryFn: () => adminService.getPlatformStats(),
  });

  const { data: topUsers, isLoading: usersLoading } = useQuery<UserListResult>({
    queryKey: ["admin", "top-users"],
    queryFn: () => adminService.listUsers(10, 0),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Detailed platform performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Avg Income per User"
          value={
            stats && stats.total_users > 0
              ? `₹${Math.round(stats.total_income / stats.total_users).toLocaleString("en-IN")}`
              : "—"
          }
          icon={IndianRupee}
          isLoading={statsLoading}
          color="teal"
        />
        <MetricCard
          label="Avg Expenses per User"
          value={
            stats && stats.total_users > 0
              ? `₹${Math.round(stats.total_expenses / stats.total_users).toLocaleString("en-IN")}`
              : "—"
          }
          icon={TrendingUp}
          isLoading={statsLoading}
          color="pink"
        />
        <MetricCard
          label="Avg Savings per User"
          value={
            stats && stats.total_users > 0
              ? `₹${Math.round(stats.total_savings / stats.total_users).toLocaleString("en-IN")}`
              : "—"
          }
          icon={PiggyBank}
          isLoading={statsLoading}
          color="violet"
        />
        <MetricCard
          label="Platform Savings Rate"
          value={
            stats && stats.total_income > 0
              ? `${((stats.total_savings / stats.total_income) * 100).toFixed(1)}%`
              : "—"
          }
          icon={Users}
          isLoading={statsLoading}
          color="amber"
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Financial Summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900">Financial Summary</h3>
          <div className="mt-4 space-y-4">
            <BarItem
              label="Total Income"
              value={stats?.total_income ?? 0}
              maxValue={Math.max(
                stats?.total_income ?? 1,
                stats?.total_expenses ?? 1,
                stats?.total_savings ?? 1,
              )}
              color="bg-teal-500"
              isLoading={statsLoading}
            />
            <BarItem
              label="Total Expenses"
              value={stats?.total_expenses ?? 0}
              maxValue={Math.max(
                stats?.total_income ?? 1,
                stats?.total_expenses ?? 1,
                stats?.total_savings ?? 1,
              )}
              color="bg-pink-500"
              isLoading={statsLoading}
            />
            <BarItem
              label="Total Savings"
              value={stats?.total_savings ?? 0}
              maxValue={Math.max(
                stats?.total_income ?? 1,
                stats?.total_expenses ?? 1,
                stats?.total_savings ?? 1,
              )}
              color="bg-violet-500"
              isLoading={statsLoading}
            />
          </div>
        </div>

        {/* Goals Overview */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900">Goals Overview</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Goals Created</span>
              {statsLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <span className="text-sm font-bold text-gray-900">{stats?.total_goals ?? 0}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Goals Completed</span>
              {statsLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <span className="text-sm font-bold text-green-600">
                  {stats?.completed_goals ?? 0}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Goals In Progress</span>
              {statsLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <span className="text-sm font-bold text-amber-600">
                  {(stats?.total_goals ?? 0) - (stats?.completed_goals ?? 0)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              {statsLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <span className="text-sm font-bold text-violet-600">
                  {stats && stats.total_goals > 0
                    ? `${((stats.completed_goals / stats.total_goals) * 100).toFixed(1)}%`
                    : "—"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900">Recent Users</h3>
        <p className="mt-1 text-xs text-gray-500">Latest registered users on the platform</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 text-left font-medium text-gray-500">Name</th>
                <th className="pb-2 text-left font-medium text-gray-500">Occupation</th>
                <th className="pb-2 text-right font-medium text-gray-500">Income</th>
                <th className="pb-2 text-right font-medium text-gray-500">Savings</th>
                <th className="pb-2 text-left font-medium text-gray-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-2.5">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : topUsers?.users && topUsers.users.length > 0 ? (
                topUsers.users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-2.5 font-medium text-gray-900">{user.full_name}</td>
                    <td className="py-2.5 text-gray-600">{user.occupation || "—"}</td>
                    <td className="py-2.5 text-right text-teal-600">
                      ₹{Number(user.total_income).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 text-right text-violet-600">
                      ₹{Number(user.total_savings).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  isLoading,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  isLoading: boolean;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    teal: "bg-teal-50 text-teal-600",
    pink: "bg-pink-50 text-pink-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-9 w-9 place-items-center rounded-lg ${colorMap[color] || colorMap.violet}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : (
        <p className="mt-3 text-xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  );
}

function BarItem({
  label,
  value,
  maxValue,
  color,
  isLoading,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  isLoading: boolean;
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span className="text-sm font-semibold text-gray-900">
            ₹{value.toLocaleString("en-IN")}
          </span>
        )}
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
