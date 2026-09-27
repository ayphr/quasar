import { CONFIG } from "../config";

export function daysSince(date: string | Date): number {
  const d = new Date(date);
  const now = new Date();
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
}

export function isPrStale(updatedAt: string | Date): boolean {
  return daysSince(updatedAt) >= CONFIG.PR_STALE_DAYS;
}

export function isIssueEligibleForWarning(updatedAt: string | Date): boolean {
  return daysSince(updatedAt) >= CONFIG.ISSUE_STALE_DAYS;
}

export function isIssueEligibleForClose(updatedAt: string | Date): boolean {
  return daysSince(updatedAt) >= CONFIG.ISSUE_STALE_DAYS + CONFIG.ISSUE_CLOSE_WARNING_DAYS;
}
