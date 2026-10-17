"use client";

import { useActionState, useCallback, useId, useRef, useState } from "react";
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

const RENEW_PERIODS = RECURRENCES.filter((r) => r !== "none");

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
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const [autoRenews, setAutoRenews] = useState(item?.autoRenews ?? false);
  const [period, setPeriod] = useState(
    item?.recurrence && item.recurrence !== "none" ? item.recurrence : "monthly",
  );
  const setOpen = useCallback(
    (next: boolean) => {
      if (next) {
        setAutoRenews(item?.autoRenews ?? false);
        setPeriod(item?.recurrence && item.recurrence !== "none" ? item.recurrence : "monthly");
        if (!isEdit) formRef.current?.reset();
      }
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange, isEdit, item],
  );

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="gap-5 rounded-3xl p-5 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit item" : "Add item"}</DialogTitle>
            <DialogDescription>
              Track anything that expires, renews, or comes due.
            </DialogDescription>
          </DialogHeader>

          <form ref={formRef} action={formAction} className="grid gap-4" id={`${uid}-form`}>
            {isEdit && <input type="hidden" name="id" value={item.id} />}

            <div className="grid gap-1.5">
              <Label htmlFor={`${uid}-title`} className="text-sm font-medium text-ink">
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
              <Label htmlFor={`${uid}-category`} className="text-sm font-medium text-ink">
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
              <Label htmlFor={`${uid}-due`} className="text-sm font-medium text-ink">
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

            <div className="grid gap-1.5">
              <Label htmlFor={`${uid}-amount`} className="text-sm font-medium text-ink">
                Amount
              </Label>
              <div className="flex items-center overflow-hidden rounded-[var(--radius-control)] border border-rule-input bg-surface focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/50">
                <Input
                  id={`${uid}-amount`}
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  defaultValue={item?.amount ?? undefined}
                  className="h-10 flex-1 border-0 bg-transparent tabular shadow-none focus-visible:ring-0"
                  style={{ fontFamily: "var(--font-mono-var)" }}
                  aria-describedby={
                    state.fieldErrors?.amount ? `${uid}-amount-err` : `${uid}-amount-hint`
                  }
                  aria-invalid={state.fieldErrors?.amount ? true : undefined}
                />
                <Label htmlFor={`${uid}-currency`} className="sr-only">
                  Currency
                </Label>
                <Select name="currency" defaultValue={item?.currency ?? "BDT"}>
                  <SelectTrigger
                    id={`${uid}-currency`}
                    className="h-10 w-[5.5rem] rounded-none border-0 border-l border-rule-input bg-surface-2 shadow-none focus-visible:ring-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[var(--radius-control)] border-rule">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {state.fieldErrors?.amount ? (
                <p id={`${uid}-amount-err`} className="text-xs text-ink">
                  {state.fieldErrors.amount}
                </p>
              ) : (
                <p id={`${uid}-amount-hint`} className="text-xs text-ink-muted">
                  Optional. Leave it blank and the tile still appears.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="autoRenews"
                  checked={autoRenews}
                  onChange={(event) => setAutoRenews(event.target.checked)}
                  className="size-3.5 rounded-[2px] border border-rule-input accent-[var(--accent)]"
                />
                Auto-renews
              </label>
              {autoRenews ? (
                <div className="grid gap-1.5">
                  <Label htmlFor={`${uid}-recurrence`} className="text-sm font-medium text-ink">
                    Recurrence
                  </Label>
                  <input type="hidden" name="recurrence" value={period} />
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger id={`${uid}-recurrence`} className={fieldCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[var(--radius-control)] border-rule">
                      {RENEW_PERIODS.map((r) => (
                        <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-ink-muted">
                    The day after it is due, the countdown starts again from this period.
                  </p>
                  {state.fieldErrors?.recurrence && (
                    <p className="text-xs text-ink">{state.fieldErrors.recurrence}</p>
                  )}
                </div>
              ) : (
                <>
                  <input type="hidden" name="recurrence" value="none" />
                  <p className="text-xs text-ink-muted">
                    It stays on the map the day it is due. The next day it is marked done.
                  </p>
                </>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`${uid}-notes`} className="text-sm font-medium text-ink">
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
