"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
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
import { addItem, idleState, updateItem, type ActionState } from "@/lib/actions/items";
import type { CategoryRow } from "@/lib/validation/item";
import { CURRENCIES, RECURRENCES } from "@/lib/validation/item";

const RECURRENCE_LABELS: Record<string, string> = {
  none: "One-off",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export interface ItemFormDialogProps {
  categories: CategoryRow[];
  trigger: React.ReactNode;
  item?: ItemFormValues;
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

export function ItemFormDialog({ categories, trigger, item }: ItemFormDialogProps) {
  const isEdit = item != null;
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  // Wrap the server action so success handling (close + toast) happens in the
  // same async flow — avoids a setState-in-effect cascade.
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription>
            Track anything that expires, renews, or comes due.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          {isEdit && <input type="hidden" name="id" value={item.id} />}

          <div className="grid gap-2">
            <Label htmlFor={`${uid}-title`}>Title</Label>
            <Input
              id={`${uid}-title`}
              name="title"
              placeholder="Netflix, passport renewal, car insurance…"
              defaultValue={item?.title}
              aria-describedby={state.fieldErrors?.title ? `${uid}-title-err` : undefined}
              aria-invalid={state.fieldErrors?.title ? true : undefined}
            />
            {state.fieldErrors?.title && (
              <p id={`${uid}-title-err`} className="text-xs text-destructive">
                {state.fieldErrors.title}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${uid}-category`}>Category</Label>
            <Select name="categoryId" defaultValue={item?.categoryId ?? categories[0]?.id}>
              <SelectTrigger id={`${uid}-category`}>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.categoryId && (
              <p className="text-xs text-destructive">{state.fieldErrors.categoryId}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${uid}-due`}>Due date</Label>
            <Input
              id={`${uid}-due`}
              name="dueDate"
              type="date"
              required
              defaultValue={item?.dueDate}
             aria-describedby={state.fieldErrors?.dueDate ? `${uid}-due-err` : undefined}
              aria-invalid={state.fieldErrors?.dueDate ? true : undefined}
            />
            {state.fieldErrors?.dueDate && (
              <p id={`${uid}-due-err`} className="text-xs text-destructive">
                {state.fieldErrors.dueDate}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor={`${uid}-amount`}>Amount (optional)</Label>
              <Input
                id={`${uid}-amount`}
                name="amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="e.g. 1200"
                defaultValue={item?.amount ?? undefined}
                aria-describedby={state.fieldErrors?.amount ? `${uid}-amount-err` : undefined}
                aria-invalid={state.fieldErrors?.amount ? true : undefined}
              />
              {state.fieldErrors?.amount && (
                <p id={`${uid}-amount-err`} className="text-xs text-destructive">
                  {state.fieldErrors.amount}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${uid}-currency`}>Currency</Label>
              <Select name="currency" defaultValue={item?.currency ?? "BDT"}>
                <SelectTrigger id={`${uid}-currency`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${uid}-recurrence`}>Recurrence</Label>
            <Select name="recurrence" defaultValue={item?.recurrence ?? "none"}>
              <SelectTrigger id={`${uid}-recurrence`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCES.map((r) => (
                  <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.recurrence && (
              <p className="text-xs text-destructive">{state.fieldErrors.recurrence}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${uid}-notes`}>Notes (optional)</Label>
            <textarea
              id={`${uid}-notes`}
              name="notes"
              rows={3}
              maxLength={2000}
              className="field-sizing-content min-h-16 w-full rounded-[var(--radius)] border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
              placeholder="Login email, policy number, anything worth remembering."
              defaultValue={item?.notes ?? undefined}
            />
            {state.fieldErrors?.notes && (
              <p id={`${uid}-notes-err`} className="text-xs text-destructive">
                {state.fieldErrors.notes}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="autoRenews"
              defaultChecked={item?.autoRenews ?? false}
              className="size-4 rounded-[4px] accent-[var(--accent)]"
            />
            Auto-renews
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
