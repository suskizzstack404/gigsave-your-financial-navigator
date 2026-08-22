import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, BarChart3, Shield, LogOut, PiggyBank } from "lucide-react";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants/app";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin-login" });

    const isAdmin = await adminService.checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/admin-login" });

    const role = await adminService.getAdminRole();
    return { user: data.user, adminRole: role };
  },
  component: AdminLayout,
});

const NAV_ITEMS = [
  { to: "/admin/dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users" as const, icon: Users, label: "Users" },
  { to: "/admin/analytics" as const, icon: BarChart3, label: "Analytics" },
];

function AdminLayout() {
  const navigate = useNavigate();
  const { adminRole } = Route.useRouteContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin-login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">{APP_NAME} Admin</p>
            <p className="text-[11px] text-gray-500 capitalize">{adminRole || "admin"}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 [&.active]:bg-violet-50 [&.active]:text-violet-700"
              activeProps={{ className: "active" }}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <PiggyBank className="h-4.5 w-4.5" />
            Back to App
          </Link>
          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleSignOut}
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/80 px-6 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="ml-3 text-sm font-bold text-gray-900">{APP_NAME} Admin</span>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
