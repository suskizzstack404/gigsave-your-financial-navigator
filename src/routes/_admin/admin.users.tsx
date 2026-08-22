import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Shield } from "lucide-react";

import { adminService, type AdminUser, type UserDetail } from "@/services/adminService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_admin/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const limit = 20;

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
    // Simple debounce
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", debouncedSearch, page],
    queryFn: () => adminService.listUsers(limit, page * limit, debouncedSearch || undefined),
  });

  const totalPages = data ? Math.ceil(data.total_count / limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all registered gig workers ({data?.total_count ?? 0} total)
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name or occupation..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">User</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Occupation</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Income</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Expenses</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Savings</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Joined</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.users && data.users.length > 0 ? (
                data.users.map((user) => (
                  <UserRow key={user.id} user={user} onView={() => setSelectedUserId(user.id)} />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Dialog */}
      {selectedUserId && (
        <UserDetailDialog userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}

function UserRow({ user, onView }: { user: AdminUser; onView: () => void }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{user.full_name}</p>
      </td>
      <td className="px-4 py-3 text-gray-600">{user.occupation || "—"}</td>
      <td className="px-4 py-3 text-right font-medium text-teal-600">
        ₹{Number(user.total_income).toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 text-right font-medium text-pink-600">
        ₹{Number(user.total_expenses).toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 text-right font-medium text-violet-600">
        ₹{Number(user.total_savings).toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {new Date(user.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-3 text-center">
        {user.admin_role ? (
          <Badge variant="secondary" className="bg-violet-100 text-violet-700">
            <Shield className="mr-1 h-3 w-3" />
            {user.admin_role}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">user</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <Button variant="ghost" size="sm" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

function UserDetailDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery<UserDetail>({
    queryKey: ["admin", "user-detail", userId],
    queryFn: () => adminService.getUserDetail(userId),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? "Loading..." : data?.profile?.full_name || "User Details"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : data ? (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jars">Jars</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Full Name" value={data.profile.full_name} />
                <InfoItem label="Occupation" value={data.profile.occupation || "—"} />
                <InfoItem label="Phone" value={data.profile.phone || "—"} />
                <InfoItem label="Currency" value={data.profile.preferred_currency} />
                <InfoItem label="Language" value={data.profile.preferred_language} />
                <InfoItem label="Theme" value={data.profile.theme} />
                <InfoItem
                  label="Joined"
                  value={new Date(data.profile.created_at).toLocaleDateString("en-IN")}
                />
                <InfoItem
                  label="Monthly Budget"
                  value={`₹${Number(data.profile.monthly_expense_budget).toLocaleString("en-IN")}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-lg bg-teal-50 p-3 text-center">
                  <p className="text-xs text-teal-600">Total Income</p>
                  <p className="mt-1 text-lg font-bold text-teal-700">
                    ₹{Number(data.stats.total_income).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-lg bg-pink-50 p-3 text-center">
                  <p className="text-xs text-pink-600">Total Expenses</p>
                  <p className="mt-1 text-lg font-bold text-pink-700">
                    ₹{Number(data.stats.total_expenses).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-lg bg-violet-50 p-3 text-center">
                  <p className="text-xs text-violet-600">Total Savings</p>
                  <p className="mt-1 text-lg font-bold text-violet-700">
                    ₹{Number(data.stats.total_savings).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Goals */}
              {data.goals && data.goals.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">
                    Goals ({data.goals.length})
                  </h4>
                  <div className="mt-2 space-y-2">
                    {data.goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{goal.goal_name}</p>
                          <p className="text-xs text-gray-500">
                            ₹{Number(goal.current_amount).toLocaleString("en-IN")} / ₹
                            {Number(goal.target_amount).toLocaleString("en-IN")}
                          </p>
                        </div>
                        {goal.is_completed ? (
                          <Badge className="bg-green-100 text-green-700">Completed</Badge>
                        ) : (
                          <Badge variant="secondary">
                            {(
                              (Number(goal.current_amount) / Number(goal.target_amount)) *
                              100
                            ).toFixed(0)}
                            %
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="jars" className="mt-4">
              {data.jars && data.jars.length > 0 ? (
                <div className="space-y-2">
                  {data.jars.map((jar) => (
                    <div
                      key={jar.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{jar.jar_name}</p>
                        <p className="text-xs text-gray-500">{jar.percentage}% allocation</p>
                      </div>
                      <p className="text-sm font-bold text-violet-600">
                        ₹{Number(jar.balance).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No jars created yet</p>
              )}
            </TabsContent>

            <TabsContent value="income" className="mt-4">
              {data.recent_income && data.recent_income.length > 0 ? (
                <div className="space-y-2">
                  {data.recent_income.map((income) => (
                    <div
                      key={income.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{income.source}</p>
                        <p className="text-xs text-gray-500">{income.income_date}</p>
                      </div>
                      <p className="text-sm font-bold text-teal-600">
                        +₹{Number(income.amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No income recorded yet</p>
              )}
            </TabsContent>

            <TabsContent value="expenses" className="mt-4">
              {data.recent_expenses && data.recent_expenses.length > 0 ? (
                <div className="space-y-2">
                  {data.recent_expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{expense.category}</p>
                        <p className="text-xs text-gray-500">{expense.expense_date}</p>
                      </div>
                      <p className="text-sm font-bold text-pink-600">
                        -₹{Number(expense.amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No expenses recorded yet</p>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
