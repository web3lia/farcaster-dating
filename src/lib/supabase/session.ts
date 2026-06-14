import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SECRET = process.env.SUPABASE_SECRET_KEY!;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export interface MintedSession {
  access_token: string;
  refresh_token: string;
}

function emailFor(fid: number) {
  return `fid-${fid}@farcaster.local`;
}

function passwordFor(fid: number) {
  return createHmac("sha256", SECRET).update(`farcaster-fid-${fid}`).digest("hex");
}

export async function mintSessionForFid(fid: number): Promise<MintedSession | null> {
  const email = emailFor(fid);
  const password = passwordFor(fid);

  try {
    const admin = createClient(URL, SECRET, { auth: { persistSession: false } });

    // Try to create the user. If they already exist we get an error — that's fine.
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { fid },
    });

    // Always sync password + app_metadata on the existing user so a stale
    // account (created before this HMAC scheme, or with a different secret)
    // never blocks sign-in. listUsers is paginated but fid emails are unique,
    // so we use getUserByEmail via the admin API.
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1 });
    // listUsers doesn't filter — use a direct lookup instead.
    // Supabase admin doesn't expose getUserByEmail, so we sign in and on
    // failure we reset via a one-shot magic approach: update by searching.
    // Simpler: always attempt signIn first; only on failure do we repair.
    const authClient = createClient(URL, PUBLISHABLE, { auth: { persistSession: false } });
    let { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      // Password mismatch — the account existed before this HMAC scheme.
      // Find the user by listing and filtering, then force-update the password.
      const pageSize = 1000;
      let page = 1;
      let userId: string | null = null;

      outer: while (true) {
        const { data: page_data, error: page_error } = await admin.auth.admin.listUsers({
          page,
          perPage: pageSize,
        });
        if (page_error || !page_data?.users?.length) break;
        for (const u of page_data.users) {
          if (u.email === email) {
            userId = u.id;
            break outer;
          }
        }
        if (page_data.users.length < pageSize) break;
        page++;
      }

      if (userId) {
        await admin.auth.admin.updateUserById(userId, {
          password,
          app_metadata: { fid },
          email_confirm: true,
        });
        // Retry sign-in with the updated password.
        const retry = await authClient.auth.signInWithPassword({ email, password });
        data = retry.data;
        error = retry.error;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (error || !data?.session) {
      console.error("mintSessionForFid: signIn failed", error?.message);
      return null;
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  } catch (e) {
    console.error("mintSessionForFid error", e instanceof Error ? e.message : e);
    return null;
  }
}
