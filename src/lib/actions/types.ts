/** Form action state for the add/edit item dialog (useActionState). */
export interface ActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export const idleState: ActionState = { ok: false };

/**
 * Result for non-form actions (markDone / snoozeItem / deleteItem).
 * Clients toast on these; the add/edit form uses useActionState instead.
 */
export type MutationResult = { ok: true; rolled?: boolean } | { ok: false; error: string };
