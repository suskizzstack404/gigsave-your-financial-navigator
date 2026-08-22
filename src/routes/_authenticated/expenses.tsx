import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/layout/AppShell";
import { VoiceCapture } from "@/components/entry/VoiceCapture";
import { GlassCard, SectionHeading } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useAddExpense,
  useDeleteExpense,
  useExpenses,
  useProfile,
  useUpdateExpense,
} from "@/hooks/useGigSaveData";
import { EXPENSE_CATEGORIES } from "@/constants/app";
import { formatCurrency, localISODate, relativeDay, toNumber } from "@/utils/format";
import { toneStyle } from "@/utils/tone";
import type { Expense } from "@/services/types";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

const schema = z.object({
  amount: z.coerce.number().positive("Enter an amount above zero").max(10_000_000),
  category: z.string().trim().min(1, "Pick a category").max(40),
  expense_date: z.string().min(1, "Pick a date"),
  note: z.string().trim().max(280).optional(),
});

function ExpensesPage() {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: profile } = useProfile();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const updateExpense = useUpdateExpense();
  const currency = profile?.preferred_currency ?? "INR";

  const [form, setForm] = useState({
    amount: "",
    category: EXPENSE_CATEGORIES[0].name as string,
    expense_date: localISODate(),
    note: "",
  });

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    category: "",
    expense_date: "",
    note: "",
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    addExpense.mutate(
      {
        amount: parsed.data.amount,
        category: parsed.data.category,
        expense_date: parsed.data.expense_date,
        note: parsed.data.note || null,
      },
      { onSuccess: () => setForm((current) => ({ ...current, amount: "", note: "" })) },
    );
  }

  function openEdit(row: Expense) {
    setEditingRow(row);
    setEditForm({
      amount: String(toNumber(row.amount)),
      category: row.category,
      expense_date: row.expense_date,
      note: row.note ?? "",
    });
    setEditOpen(true);
  }

  function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingRow) return;
    const parsed = schema.safeParse(editForm);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    updateExpense.mutate(
      {
        id: editingRow.id,
        patch: {
          amount: parsed.data.amount,
          category: parsed.data.category,
          expense_date: parsed.data.expense_date,
          note: parsed.data.note || null,
        },
      },
      { onSuccess: () => setEditOpen(false) },
    );
  }

  function iconFor(category: string) {
    return EXPENSE_CATEGORIES.find((item) => item.name === category) ?? EXPENSE_CATEGORIES[0];
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading title="Expenses" description="Know exactly where your earnings go." />

        <GlassCard>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="expense-amount">Amount</Label>
                <Input
                  id="expense-amount"
                  inputMode="decimal"
                  placeholder="250"
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((s) => ({ ...s, category: value }))}
                >
                  <SelectTrigger id="expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  max={localISODate()}
                  value={form.expense_date}
                  onChange={(e) => setForm((s) => ({ ...s, expense_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-note">Note (optional)</Label>
                <Textarea
                  id="expense-note"
                  rows={1}
                  placeholder="Petrol top-up"
                  value={form.note}
                  onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="hero" disabled={addExpense.isPending}>
                {addExpense.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add expense
              </Button>
              <VoiceCapture
                onParsed={(entry) =>
                  setForm((current) => ({
                    ...current,
                    amount: entry.amount ? String(entry.amount) : current.amount,
                    category: entry.category,
                    expense_date: entry.date,
                  }))
                }
              />
            </div>
          </form>
        </GlassCard>

        <section className="space-y-3">
          <SectionHeading title="History" />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your expenses…</p>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8" />}
              title="No expenses yet"
              description="Track fuel, food and repairs to see your real take-home."
            />
          ) : (
            <GlassCard className="divide-y divide-border/60 p-0">
              {expenses.map((row) => {
                const meta = iconFor(row.category);
                return (
                  <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                      style={toneStyle(meta.tone)}
                    >
                      <DynamicIcon name={meta.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {relativeDay(row.expense_date)}
                        {row.note ? ` · ${row.note}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      −{formatCurrency(toNumber(row.amount), currency)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${row.category} expense`}
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${row.category} expense`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the expense record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteExpense.mutate(row.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </GlassCard>
          )}
        </section>
      </div>

      {/* Edit Expense Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit expense</DialogTitle>
            <DialogDescription>
              Update the amount, category, date or note for this expense.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="edit-expense-amount">Amount</Label>
              <Input
                id="edit-expense-amount"
                inputMode="decimal"
                placeholder="250"
                value={editForm.amount}
                onChange={(e) => setEditForm((s) => ({ ...s, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-expense-category">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm((s) => ({ ...s, category: value }))}
              >
                <SelectTrigger id="edit-expense-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((item) => (
                    <SelectItem key={item.name} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-expense-date">Date</Label>
              <Input
                id="edit-expense-date"
                type="date"
                max={localISODate()}
                value={editForm.expense_date}
                onChange={(e) => setEditForm((s) => ({ ...s, expense_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-expense-note">Note (optional)</Label>
              <Textarea
                id="edit-expense-note"
                rows={2}
                placeholder="Petrol top-up"
                value={editForm.note}
                onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="submit" variant="hero" disabled={updateExpense.isPending}>
                {updateExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
