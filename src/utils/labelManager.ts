import { ProbotOctokit } from "probot";
import { CONFIG } from "../config";

type BotLabel = (typeof CONFIG)["BOT_MANAGED_LABELS"][number];

export interface OwnerRepo {
  owner: string;
  repo: string;
}

export function hasLabel(issue: { labels?: unknown[] }, label: string): boolean {
  return issue.labels?.some((l) => {
    if (typeof l === "string") return l === label;
    return l && typeof l === "object" && (l as { name?: string }).name === label;
  }) ?? false;
}

export function getLabelNames(issue: { labels?: unknown[] }): string[] {
  if (!issue.labels) return [];
  return issue.labels
    .map((l) => {
      if (typeof l === "string") return l;
      if (l && typeof l === "object") return (l as { name?: string }).name ?? "";
      return "";
    })
    .filter((name) => name !== "");
}

export async function labelExists(
  octokit: ProbotOctokit,
  ownerRepo: OwnerRepo,
  label: string
): Promise<boolean> {
  try {
    await octokit.rest.issues.getLabel({
      owner: ownerRepo.owner,
      repo: ownerRepo.repo,
      name: label,
    });
    return true;
  } catch {
    return false;
  }
}

export async function ensureLabel(
  octokit: ProbotOctokit,
  ownerRepo: OwnerRepo,
  label: string
): Promise<void> {
  if (!(await labelExists(octokit, ownerRepo, label))) {
    await octokit.rest.issues.createLabel({
      owner: ownerRepo.owner,
      repo: ownerRepo.repo,
      name: label,
      color: "7057ff",
      description: "Managed by the Quasar bot",
    });
  }
}

export async function addLabel(
  octokit: ProbotOctokit,
  ownerRepo: OwnerRepo,
  issueNumber: number,
  label: string
): Promise<void> {
  await ensureLabel(octokit, ownerRepo, label);
  await octokit.rest.issues.addLabels({
    owner: ownerRepo.owner,
    repo: ownerRepo.repo,
    issue_number: issueNumber,
    labels: [label],
  });
}

export async function removeLabel(
  octokit: ProbotOctokit,
  ownerRepo: OwnerRepo,
  issueNumber: number,
  label: string
): Promise<boolean> {
  try {
    await octokit.rest.issues.removeLabel({
      owner: ownerRepo.owner,
      repo: ownerRepo.repo,
      issue_number: issueNumber,
      name: label,
    });
    return true;
  } catch {
    return false;
  }
}

export async function addLabelIfExists(
  octokit: ProbotOctokit,
  ownerRepo: OwnerRepo,
  issueNumber: number,
  label: string
): Promise<boolean> {
  if (!(await labelExists(octokit, ownerRepo, label))) {
    return false;
  }
  await octokit.rest.issues.addLabels({
    owner: ownerRepo.owner,
    repo: ownerRepo.repo,
    issue_number: issueNumber,
    labels: [label],
  });
  return true;
}

export async function removeLabelIfExists(
  octokit: ProbotOctokit,
  ownerRepo: OwnerRepo,
  issueNumber: number,
  label: string
): Promise<boolean> {
  return removeLabel(octokit, ownerRepo, issueNumber, label);
}

export async function getAuthorLabels(
  octokit: ProbotOctokit,
  ownerRepo: OwnerRepo
): Promise<string[]> {
  const { data: labels } = await octokit.rest.issues.listLabelsForRepo({
    owner: ownerRepo.owner,
    repo: ownerRepo.repo,
    per_page: 100,
  });
  return labels
    .map((l) => l.name)
    .filter((name): name is string => name !== null && !CONFIG.BOT_MANAGED_LABELS.includes(name as BotLabel));
}
