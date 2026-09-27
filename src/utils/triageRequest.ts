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
  const issueTypeText = issueType === "issue" ? "issue" : "pull request";

  const body = `
Hi @${authorLogin}! Thanks for opening this ${issueTypeText}.

Before we can proceed, please add appropriate labels from the following list using the \`/label\` command:

${labelList}

These help us categorize and route your ${issueTypeText}. You can add multiple labels.
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

export function isBugReportWellFormed(text = ""): boolean {
  const lower = text.toLowerCase();
  return text.length >= 50 && lower.includes("reproduc");
}
