export const CONFIG = {
  PR_STALE_DAYS: 2,
  ISSUE_STALE_DAYS: 100,
  ISSUE_CLOSE_WARNING_DAYS: 7,
  AUTOASSIGN_TEAM_SLUG: "autoassign",
  MERGE_CONFLICT_LABEL: "merge conflict",
  STALE_LABEL: "stale",
  TRIAGE_NEEDED_LABEL: "triage needed",
  AUTO_ASSIGNED_LABEL: "auto-assigned",
  BOT_MANAGED_LABELS: [
    "invalid",
    "awaiting author",
    "confirmed",
    "stale",
    "merge conflict",
    "auto-assigned",
  ],
  MIN_BODY_LENGTH: 20,
  CRON_SCHEDULE: "0 */6 * * *",
} as const;

export type BotLabel = (typeof CONFIG)["BOT_MANAGED_LABELS"][number];
