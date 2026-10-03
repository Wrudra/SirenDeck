// SirenDeck Phase 6: send-reminders Edge Function.
//
// Scans due reminders via the service role, then dispatches them according
// to REMINDER_MODE:
//   "log"    (default) — logs what would be sent, marks reminders sent.
//                         Zero email, zero cost.
//   "smtp"/"resend"/…  — reserved for a real provider, wired only after
//                         explicit owner approval + env secrets.
//
// Deploy: supabase functions deploy send-reminders --no-verify-jwt
// (the function authenticates via SERVICE_ROLE_KEY header from pg_cron).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REMINDER_MODE = Deno.env.get("REMINDER_MODE") ?? "log";

interface DueReminder {
  reminder_id: string;
  user_id: string;
  item_id: string;
  user_email: string;
  item_title: string;
  due_date: string;
  days_before: number;
  amount: number | null;
  currency: string;
}

function authorize(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  return auth === `Bearer ${SERVICE_ROLE_KEY}`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!authorize(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 1. Fetch due reminders (helper enforces active + window logic).
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/due_reminders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!rpcRes.ok) {
      throw new Error(`due_reminders failed: ${rpcRes.status} ${await rpcRes.text()}`);
    }
    const due = (await rpcRes.json()) as DueReminder[];

    // 2. Dispatch per mode.
    let sent = 0;
    const sentIds: string[] = [];
    for (const r of due) {
      const subject =
        r.days_before === 0
          ? `Due today: ${r.item_title}`
          : `Due in ${r.days_before} day${r.days_before === 1 ? "" : "s"}: ${r.item_title}`;

      if (REMINDER_MODE === "log") {
        console.log(
          `[reminder:log] to=${r.user_email} subject="${subject}" due=${r.due_date} amount=${r.amount ?? "—"} ${r.currency}`,
        );
      } else {
        // Real dispatch is intentionally unimplemented until the owner
        // provides a provider + secret. Fail loud rather than silently skip.
        throw new Error(`REMINDER_MODE "${REMINDER_MODE}" is not implemented`);
      }
      sentIds.push(r.reminder_id);
      sent += 1;
    }

    // 3. Mark sent (batched; idempotent).
    if (sentIds.length > 0) {
      const markRes = await fetch(
        `${SUPABASE_URL}/rest/v1/reminders?id=in.(${sentIds.join(",")})`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            apikey: SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ sent_at: new Date().toISOString() }),
        },
      );
      if (!markRes.ok) {
        throw new Error(`marking sent failed: ${markRes.status}`);
      }
    }

    return new Response(JSON.stringify({ ok: true, mode: REMINDER_MODE, due: due.length, sent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-reminders]", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
