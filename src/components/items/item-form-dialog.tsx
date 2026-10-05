"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addItem, updateItem } from "@/lib/actions/items";
import { idleState, type ActionState } from "@/lib/actions/types";
import type { CategoryRow } from "@/lib/validation/item";
import { CURRENCIES, RECURRENCES } from "@/lib/validation/item";

const RECURRENCE_LABELS: Record<string, string> = {
  none: "One-off",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const fieldCls =
  "rounded-[var(--radius-control)] border-rule-input bg-surface shadow-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50";

export interface ItemFormDialogProps {
  categories: CategoryRow[];
  trigger?: React.ReactNode;
  item?: ItemFormValues;
  /** controlled open · useful when opening from a map tile click */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ItemFormValues {
  id: string;
  title: string;
  notes: string | null;
  categoryId: string;
  dueDate: string;
  recurrence: string;
  autoRenews: boolean;
  amount: number | null;
  currency: string;
}

export function ItemFormDialog({
  categories,
  trigger,
  item,
  open: controlledOpen,
  onOpenChange,
}: ItemFormDialogProps) {
  const isEdit = item != null;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  // Wrap the server action so success handling (close + toast) happens in the
  // same async flow · avoids a setState-in-effect cascade.
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await (isEdit ? updateItem : addItem)(prev, formData);
      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Item updated" : "Item added");
      } else if (result.error) {
        toast.error(result.error);
      }
      return result;
    },
    idleState,
  );

  // Reset the form whenever the dialog re-opens (Add mode).
  useEffect(() => {
    if (open && !isEdit) formRef.current?.reset();
  }, [open, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit item" : "Add item"}</DialogTitle>
            <DialogDescription>
              Track anything that expires, renews, or comes due.
            </DialogDescription>
          </DialogHeader>

          <form ref={formRef} action={formAction} className="grid gap-4" id={`${uid}-form`}>
            {isEdit && <input type="hidden" name="id" value={item.id} />}

            <div className="grid gap-1.5">
              <Label htmlFor={`${uid}-title`} className="ledger-cap text-[10px] text-ink-muted">
                Title
              </Label>
              <Input
                id={`${uid}-title`}
                name="title"
                placeholder="Netflix, passport renewal, car insurance…"
                defaultValue={item?.title}
                maxLength={120}
                className={fieldCls}
                aria-describedby={state.fieldErrors?.title ? `${uid}-title-err` : undefined}
                aria-invalid={state.fieldErrors?.title ? true : undefined}
              />
              {state.fieldErrors?.title ? (
                <p id={`${uid}-title-err`} className="text-xs text-ink">
                  {state.fieldErrors.title}
                </p>
              ) : (
                <p className="text-xs text-ink-muted">A name you will recognize on the map.</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`${uid}-category`} className="ledger-cap text-[10px] text-ink-muted">
                Category
              </Label>
              <Select name="categoryId" defaultValue={item?.categoryId ?? categories[0]?.id}>
                <SelectTrigger id={`${uid}-category`} className={fieldCls}>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent className="rounded-[var(--radius-control)] border-rule">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.categoryId && (
                <p className="text-xs text-ink">{state.fieldErrors.categoryId}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`${uid}-due`} className="ledger-cap text-[10px] text-ink-muted">
                Due date
              </Label>
              <Input
                id={`${uid}-due`}
                name="dueDate"
                type="date"
                required
                defaultValue={item?.dueDate}
                className={fieldCls}
                aria-describedby={state.fieldErrors?.dueDate ? `${uid}-due-err` : `${uid}-due-hint`}
                aria-invalid={state.fieldErrors?.dueDate ? true : undefined}
              />
              {state.fieldErrors?.dueDate ? (
                <p id={`${uid}-due-err`} className="text-xs text-ink">
                  {state.fieldErrors.dueDate}
                </p>
              ) : (
                <p id={`${uid}-due-hint`} className="text-xs text-ink-muted">
                  When it next renews or expires.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor={`${uid}-amount`} className="ledger-cap text-[10px] text-ink-muted">
                  Amount
                </Label>
                <Input
                  id={`${uid}-amount`}
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="e.g. 1200"
                  defaultValue={item?.amount ?? undefined}
                  className={`${fieldCls} tabular`}
                  style={{ fontFamily: "var(--font-mono-var)" }}
                  aria-describedby={
                    state.fieldErrors?.amount ? `${uid}-amount-err` : `${uid}-amount-hint`
                  }
                  aria-invalid={state.fieldErrors?.amount ? true : undefined}
                />
                {state.fieldErrors?.amount ? (
                  <p id={`${uid}-amount-err`} className="text-xs text-ink">
                    {state.fieldErrors.amount}
                  </p>
                ) : (
                  <p id={`${uid}-amount-hint`} className="text-xs text-ink-muted">
                    Optional. Unpriced items wait on the shelf.
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${uid}-currency`} className="ledger-cap text-[10px] text-ink-muted">
                  Currency
                </Label>
                <Select name="currency" defaultValue={item?.currency ?? "BDT"}>
                  <SelectTrigger id={`${uid}-currency`} className={fieldCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[var(--radius-control)] border-rule">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`${uid}-recurrence`} className="ledger-cap text-[10px] text-ink-muted">
                Recurrence
              </Label>
              <Select name="recurrence" defaultValue={item?.recurrence ?? "none"}>
                <SelectTrigger id={`${uid}-recurrence`} className={fieldCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[var(--radius-control)] border-rule">
                  {RECURRENCES.map((r) => (
                    <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.recurrence && (
                <p className="text-xs text-ink">{state.fieldErrors.recurrence}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`${uid}-notes`} className="ledger-cap text-[10px] text-ink-muted">
                Notes
              </Label>
              <textarea
                id={`${uid}-notes`}
                name="notes"
                rows={3}
                maxLength={2000}
                className="field-sizing-content min-h-16 w-full rounded-[var(--radius-control)] border border-rule-input bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-ink-muted focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50"
                placeholder="Login email, policy number, anything worth remembering."
                defaultValue={item?.notes ?? undefined}
              />
              {state.fieldErrors?.notes && (
                <p id={`${uid}-notes-err`} className="text-xs text-ink">
                  {state.fieldErrors.notes}
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="autoRenews"
                defaultChecked={item?.autoRenews ?? false}
                className="size-3.5 rounded-[2px] border border-rule-input accent-[var(--accent)]"
              />
              Auto-renews
            </label>
          </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="rounded-[var(--radius-control)] border-rule-strong"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={`${uid}-form`}
            disabled={pending}
            className="plate rounded-[var(--radius-control)] border-transparent hover:bg-ink"
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
