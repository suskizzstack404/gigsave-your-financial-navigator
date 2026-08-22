import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, PiggyBank, Flame } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav, SideNav } from "./Navigation";
import { authService } from "@/services/authService";
import { useMarkNotificationsRead, useNotifications, useProfile } from "@/hooks/useGigSaveData";
import { APP_NAME } from "@/constants/app";
import { firstName, initials, relativeDay } from "@/utils/format";
import { cn } from "@/lib/utils";

export function AppShell({ children, streak = 0 }: { children: React.ReactNode; streak?: number }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = notifications.filter((item) => !item.is_read).length;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await authService.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 animate-slide-down border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/dashboard" className="group flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime-400 text-black shadow-glow transition-transform duration-200 group-hover:scale-105">
              <PiggyBank className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight">{APP_NAME}</span>
              <span className="block truncate text-xs text-muted-foreground">
                Hi, {firstName(profile?.full_name)}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5">
            {streak > 0 ? (
              <span className="hidden items-center gap-1 rounded-full bg-amber/15 px-2.5 py-1 text-xs font-semibold text-amber sm:inline-flex">
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                {streak}d
              </span>
            ) : null}

            <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative transition-transform duration-200 hover:scale-105"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 ? (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-destructive" />
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2 overflow-y-auto px-4 pb-6">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">You're all caught up.</p>
                  ) : (
                    <>
                      {unread > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markRead.mutate(undefined)}
                        >
                          Mark all as read
                        </Button>
                      ) : null}
                      {notifications.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => markRead.mutate(item.id)}
                          className={cn(
                            "w-full rounded-xl border border-border/60 p-3 text-left transition-all duration-150 hover:border-primary/30 hover:bg-accent active:scale-[0.99]",
                            !item.is_read && "bg-accent/60",
                          )}
                        >
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {relativeDay(item.created_at.slice(0, 10))}
                          </p>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <Avatar className="h-8 w-8 transition-transform duration-200 hover:scale-105">
                    <AvatarFallback className="bg-zinc-900 text-xs font-semibold text-white">
                      {initials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">
                  {profile?.full_name ?? "Your account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-28 pt-5 lg:pb-10">
        <aside className="hidden w-56 shrink-0 animate-fade-up lg:block">
          <div className="sticky top-24 rounded-3xl border border-border bg-card p-2 shadow-sm">
            <SideNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1 animate-fade-in [animation-delay:80ms]">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
