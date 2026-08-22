import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAddIncome,
  useDeleteIncome,
  useIncome,
  useJars,
  useUpdateIncome,
} from "@/hooks/useGigSaveData";
import { useProfile } from "@/hooks/useGigSaveData";
import { INCOME_SOURCES } from "@/constants/app";
import { formatCurrency, localISODate, relativeDay, toNumber } from "@/utils/format";
import { previewAllocation } from "@/utils/finance";
import type { Income } from "@/services/types";

export const Route = createFileRoute("/_authenticated/income")({
  component: IncomePage,
});

const addSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Enter an amount above zero")
    .max(10_000_000, "That amount looks too large"),
  source: z.string().trim().min(1, "Pick a source").max(60),
  income_date: z.string().min(1, "Pick a date"),
  notes: z.string().trim().max(280, "Keep notes under 280 characters").optional(),
});

const editSchema = z.object({
  source: z.string().trim().min(1, "Pick a source").max(60),
  income_date: z.string().min(1, "Pick a date"),
  notes: z.string().trim().max(280, "Keep notes under 280 characters").optional(),
});

function IncomePage() {
  const { data: income = [], isLoading } = useIncome();
  const { data: jars = [] } = useJars();
  const { data: profile } = useProfile();
  const addIncome = useAddIncome();
  const deleteIncome = useDeleteIncome();
  const updateIncome = useUpdateIncome();
  const currency = profile?.preferred_currency ?? "INR";

  const [form, setForm] = useState({
    amount: "",
    source: INCOME_SOURCES[0] as string,
    income_date: localISODate(),
    notes: "",
  });

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Income | null>(null);
  const [editForm, setEditForm] = useState({ source: "", income_date: "", notes: "" });

  const preview = useMemo(
    () => previewAllocation(Number(form.amount) || 0, jars),
    [form.amount, jars],
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = addSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    addIncome.mutate(
      {
        amount: parsed.data.amount,
        source: parsed.data.source,
        income_date: parsed.data.income_date,
        notes: parsed.data.notes || null,
      },
      { onSuccess: () => setForm((current) => ({ ...current, amount: "", notes: "" })) },
    );
  }

  function openEdit(row: Income) {
    setEditingRow(row);
    setEditForm({
      source: row.source,
      income_date: row.income_date,
      notes: row.notes ?? "",
    });
    setEditOpen(true);
  }

  function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingRow) return;
    const parsed = editSchema.safeParse(editForm);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    updateIncome.mutate(
      {
        id: editingRow.id,
        patch: {
          source: parsed.data.source,
          income_date: parsed.data.income_date,
          notes: parsed.data.notes || null,
        },
      },
      { onSuccess: () => setEditOpen(false) },
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading
          title="Income"
          description="Log what you earned — savings happen automatically."
        />

        <GlassCard>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="1200"
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => setForm((s) => ({ ...s, source: value }))}
                >
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_SOURCES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="income-date">Date</Label>
                <Input
                  id="income-date"
                  type="date"
                  max={localISODate()}
                  value={form.income_date}
                  onChange={(e) => setForm((s) => ({ ...s, income_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  rows={1}
                  placeholder="12 orders, evening shift"
                  value={form.notes}
                  onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                />
              </div>
            </div>

            {preview.lines.length > 0 && Number(form.amount) > 0 ? (
              <div className="rounded-xl bg-accent/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  This income will be split as
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {preview.lines.map((line) => (
                    <li key={line.jarId} className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        {line.jarName} · {line.percentage}%
                      </span>
                      <span className="shrink-0 font-semibold">
                        {formatCurrency(line.amount, currency)}
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-3 border-t border-border/60 pt-1 font-semibold">
                    <span>Left to spend</span>
                    <span>{formatCurrency(preview.available, currency)}</span>
                  </li>
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="hero" disabled={addIncome.isPending}>
                {addIncome.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add income
              </Button>
              <VoiceCapture
                onParsed={(entry) =>
                  setForm((current) => ({
                    ...current,
                    amount: entry.amount ? String(entry.amount) : current.amount,
                    source: entry.source,
                    income_date: entry.date,
                  }))
                }
              />
            </div>
          </form>
        </GlassCard>

        <section className="space-y-3">
          <SectionHeading title="History" />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your income…</p>
          ) : income.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-8 w-8" />}
              title="No income recorded yet"
              description="Add your first payout to start building savings."
            />
          ) : (
            <GlassCard className="divide-y divide-border/60 p-0">
              {income.map((row) => (
                <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.source}</p>
                    <p className="text-xs text-muted-foreground">
                      {relativeDay(row.income_date)} · saved{" "}
                      {formatCurrency(toNumber(row.allocated_amount), currency)}
                      {row.notes ? ` · ${row.notes}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-teal">
                    +{formatCurrency(toNumber(row.amount), currency)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit income from ${row.source}`}
                    onClick={() => openEdit(row)}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete income from ${row.source}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this income?</AlertDialogTitle>
                        <AlertDialogDescription>
                          The amount saved into your jars from this entry will also be reversed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteIncome.mutate(row.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </GlassCard>
          )}
        </section>
      </div>

      {/* Edit Income Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit income</DialogTitle>
            <DialogDescription>
              Update source, date or notes. To change the amount, delete this entry and add a new
              one so jar balances stay correct.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="edit-source">Source</Label>
              <Select
                value={editForm.source}
                onValueChange={(value) => setEditForm((s) => ({ ...s, source: value }))}
              >
                <SelectTrigger id="edit-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_SOURCES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-income-date">Date</Label>
              <Input
                id="edit-income-date"
                type="date"
                max={localISODate()}
                value={editForm.income_date}
                onChange={(e) => setEditForm((s) => ({ ...s, income_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Notes (optional)</Label>
              <Textarea
                id="edit-notes"
                rows={2}
                placeholder="12 orders, evening shift"
                value={editForm.notes}
                onChange={(e) => setEditForm((s) => ({ ...s, notes: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="submit" variant="hero" disabled={updateIncome.isPending}>
                {updateIncome.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
