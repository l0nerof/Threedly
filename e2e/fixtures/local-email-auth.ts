import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../../src/business/types/database.generated";
import { readLocalStatus } from "./local-marketplace";

const addressSchema = z.object({ Address: z.email() });
const summarySchema = z.object({
  ID: z.string().min(1),
  Created: z.iso.datetime({ offset: true }),
  To: z.array(addressSchema),
});
const searchSchema = z.object({ messages: z.array(summarySchema) });
const messageSchema = z.object({
  ID: z.string().min(1),
  To: z.array(addressSchema),
  HTML: z.string(),
  Text: z.string(),
});
const userSchema = z.object({
  id: z.guid(),
  email: z.email(),
  created_at: z.iso.datetime({ offset: true }),
  email_confirmed_at: z.iso.datetime({ offset: true }).nullish(),
  user_metadata: z.object({ username: z.string() }),
});
const profileSchema = z.object({
  username: z.string(),
  plan_key: z.enum(["free", "pro", "max"]),
  downloads_limit_monthly: z.number().int(),
  can_upload: z.boolean(),
});
const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

export async function createLocalEmailAuth() {
  const status = await readLocalStatus();
  const admin = createClient<Database>(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
    clientOptions,
  );
  const account = {
    email: "e2e-email-auth@threedly.local",
    username: "e2e_email_auth",
    password: "LocalEmailE2E123!",
    nextPassword: "LocalEmailChanged456!",
  };
  const startedAt = Date.now();
  let createdId: string | null = null;

  async function findAccount() {
    for (let page = 1; ; page += 1) {
      const result = await admin.auth.admin.listUsers({ page, perPage: 100 });
      if (result.error)
        throw new Error("Could not inspect isolated Auth account");
      const match = result.data.users.find(
        (user) => user.email === account.email,
      );
      if (match) return userSchema.parse(match);
      if (result.data.users.length < 100) return null;
    }
  }

  async function ownedAccount() {
    const user = await findAccount();
    if (!user) return null;
    if (
      user.user_metadata.username !== account.username ||
      Date.parse(user.created_at) < startedAt - 2000 ||
      (createdId !== null && createdId !== user.id)
    )
      throw new Error("Refusing to adopt an account outside this test");
    createdId = user.id;
    return user;
  }

  async function mailRequest(path: string, options?: RequestInit) {
    const response = await fetch(new URL(path, status.MAILPIT_URL), {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok)
      throw new Error(`Local Mailpit request failed (${response.status})`);
    return response;
  }

  async function searchMail() {
    const messages: z.infer<typeof summarySchema>[] = [];
    for (let start = 0; ; start += 50) {
      const query = new URLSearchParams({
        query: `to:${account.email}`,
        start: String(start),
        limit: "50",
      });
      const response = await mailRequest(`/api/v1/search?${query}`);
      const data: unknown = await response.json();
      const rows = searchSchema.parse(data).messages;
      messages.push(
        ...rows.filter((row) =>
          row.To.some((recipient) => recipient.Address === account.email),
        ),
      );
      if (rows.length < 50) return messages;
    }
  }

  if (await findAccount())
    throw new Error(
      "Isolated email account already exists; existing users are never reused or deleted",
    );
  const priorMessages = new Set(
    (await searchMail()).map((message) => message.ID),
  );

  async function currentMessages() {
    return (await searchMail())
      .filter((message) => !priorMessages.has(message.ID))
      .sort((left, right) => right.Created.localeCompare(left.Created));
  }

  async function latestMessage(excluded: string[] = []) {
    const summary = (await currentMessages()).find(
      (message) => !excluded.includes(message.ID),
    );
    if (!summary) return null;
    const response = await mailRequest(
      `/api/v1/message/${encodeURIComponent(summary.ID)}`,
    );
    const value: unknown = await response.json();
    const message = messageSchema.parse(value);
    if (
      message.ID !== summary.ID ||
      !message.To.some((recipient) => recipient.Address === account.email)
    )
      throw new Error(
        "Mailpit returned a message outside this test's recipient",
      );
    return message;
  }

  return {
    account,
    async createConfirmedAccount() {
      const result = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { username: account.username },
      });
      if (result.error || !result.data.user)
        throw new Error("Could not create isolated recovery account");
      createdId = userSchema.parse(result.data.user).id;
    },
    async accountState() {
      const user = await ownedAccount();
      if (!user) return null;
      const result = await admin
        .from("profiles")
        .select("username, plan_key, downloads_limit_monthly, can_upload")
        .eq("id", user.id)
        .single();
      if (result.error)
        throw new Error("Could not inspect isolated account profile");
      return {
        confirmed: Boolean(user.email_confirmed_at),
        ...profileSchema.parse(result.data),
      };
    },
    async confirmation(excluded: string[] = []) {
      const message = await latestMessage(excluded);
      if (!message) return null;
      const code = message.HTML.match(/<strong>\s*(\d{6})\s*<\/strong>/i)?.[1];
      if (!code)
        throw new Error(
          "Confirmation email did not contain the configured six-digit code",
        );
      return { id: message.ID, code };
    },
    async recovery() {
      const message = await latestMessage();
      if (!message) return null;
      const href = message.HTML.match(/href=["']([^"']+)["']/i)?.[1];
      if (!href) throw new Error("Recovery email did not contain a link");
      const url = new URL(z.url().parse(href.replaceAll("&amp;", "&")));
      const destination = new URL(
        z.url().parse(url.searchParams.get("redirect_to")),
      );
      if (
        url.origin !== new URL(status.API_URL).origin ||
        url.pathname !== "/auth/v1/verify" ||
        url.searchParams.get("type") !== "recovery" ||
        destination.origin !== "http://localhost:3000" ||
        !["/ua/reset-password", "/en/reset-password"].includes(
          destination.pathname,
        )
      )
        throw new Error("Recovery link is outside the verified local flow");
      return { id: message.ID, url: url.toString() };
    },
    async dispose() {
      const failures: string[] = [];
      let user: Awaited<ReturnType<typeof ownedAccount>> = null;
      try {
        user = await ownedAccount();
      } catch {
        failures.push("account ownership verification");
      }
      try {
        if (user?.email_confirmed_at) {
          const client = createClient<Database>(
            status.API_URL,
            status.ANON_KEY,
            clientOptions,
          );
          let revoked = false;
          for (const password of [account.nextPassword, account.password]) {
            const signed = await client.auth.signInWithPassword({
              email: account.email,
              password,
            });
            if (!signed.data.session) continue;
            const result = await admin.auth.admin.signOut(
              signed.data.session.access_token,
              "global",
            );
            if (result.error) throw new Error("Session revocation failed");
            revoked = true;
            break;
          }
          if (!revoked) throw new Error("Could not revoke isolated sessions");
        }
      } catch {
        failures.push("session revocation");
      }
      try {
        if (user) {
          const result = await admin.auth.admin.deleteUser(user.id);
          if (result.error) throw new Error("Account cleanup failed");
          if (await findAccount())
            throw new Error("Isolated Auth account remains");
          const profile = await admin
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();
          if (profile.error || profile.data)
            throw new Error("Isolated profile remains");
        }
      } catch {
        failures.push("account cleanup");
      }
      try {
        const ids = (await currentMessages()).map((message) => message.ID);
        if (ids.length)
          await mailRequest("/api/v1/messages", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ IDs: ids }),
          });
        if ((await currentMessages()).length)
          throw new Error("Isolated messages remain");
      } catch {
        failures.push("mail cleanup");
      }
      if (failures.length)
        throw new Error(`Local email fixture failed: ${failures.join(", ")}`);
    },
  };
}

export type LocalEmailAuth = Awaited<ReturnType<typeof createLocalEmailAuth>>;
