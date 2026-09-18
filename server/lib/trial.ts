import type { Account } from '@prisma/client';

/**
 * Free-trial window for a newly provisioned doctor account.
 *
 * Expiry is computed on every request from `trialEndsAt` rather than written
 * by a scheduled job: there is no cron to run, nothing to drift, and the moment
 * the date passes the account is out — no job lag in between.
 */

/** Trial length in days. Override with TRIAL_DAYS to run shorter or longer. */
export function trialDays(): number {
  const raw = Number.parseInt(process.env.TRIAL_DAYS ?? '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 14;
}

/**
 * The trial end for an account created now.
 *
 * Anchored to account creation, not first sign-in, so the back office has a
 * predictable end date it can plan around.
 */
export function trialEndFromNow(now: Date = new Date()): Date {
  const end = new Date(now);
  end.setDate(end.getDate() + trialDays());
  return end;
}

/** True once the trial window has closed. Null `trialEndsAt` means unlimited. */
export function isTrialExpired(
  account: Pick<Account, 'trialEndsAt'>,
  now: Date = new Date(),
): boolean {
  return account.trialEndsAt !== null && account.trialEndsAt.getTime() <= now.getTime();
}

/**
 * Whole days left, for the countdown the back office shows.
 * Null when the account has no trial; 0 once it has expired.
 */
export function trialDaysLeft(
  account: Pick<Account, 'trialEndsAt'>,
  now: Date = new Date(),
): number | null {
  if (account.trialEndsAt === null) return null;
  const ms = account.trialEndsAt.getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}
