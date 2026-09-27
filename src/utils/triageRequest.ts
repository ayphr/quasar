import { ProbotOctokit } from "probot";
import { getAuthorLabels } from "./labelManager";

export async function requestAuthorTriage(
  octokit: ProbotOctokit,
  ownerRepo: { owner: string; repo: string },
  issueNumber: number,
  authorLogin: string,
  issueType: "issue" | "pull_request"
): Promise<void> {
  const authorLabels = await getAuthorLabels(octokit, ownerRepo);

  if (authorLabels.length === 0) {
    return;
  }

  const labelList = authorLabels.map((l) => `- \`${l}\``).join("\n");

  const body = `
Hi @${authorLogin}! Thanks for opening this ${issueType}.

Before we can proceed, please add appropriate labels from the following list:

${labelList}

These help us categorize and route your ${issueType}. You can add multiple labels.

Note: Status labels like \`invalid\`, \`awaiting author\`, \`confirmed\`, \`stale\`, and \`merge conflict\` are managed automatically by the bot.
`;

  await octokit.rest.issues.createComment({
    owner: ownerRepo.owner,
    repo: ownerRepo.repo,
    issue_number: issueNumber,
    body,
  });
}

export function isBodyWellFormed(body: string | null | undefined): boolean {
  return (body ?? "").length >= 20;
}

const BUG_REPORT_KEYWORDS = [
  "reproduc",
  "steps to reproduce",
  "expected behavior",
  "actual behavior",
  "what happened",
  "what did",
  "reproduce steps",
];

export function isBugReportWellFormed(
  body: string | null | undefined,
  issueType?: string | null
): boolean {
  const text = body ?? "";
  if (text.length < 20) return false;
  const lower = text.toLowerCase();
  const hasBugKeyword = BUG_REPORT_KEYWORDS.some((kw) => lower.includes(kw));
  const isBugType = issueType?.toLowerCase().includes("bug");
  return hasBugKeyword || isBugType === true;
}
