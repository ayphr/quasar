import { ProbotOctokit } from "probot";

const MERGEABLE_POLL_INTERVAL_MS = 1000;
const MERGEABLE_MAX_POLL_ATTEMPTS = 5;

export async function isMergeConflict(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<boolean> {
  let attempts = 0;

  while (attempts < MERGEABLE_MAX_POLL_ATTEMPTS) {
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    if (pr.mergeable === true) {
      return false;
    }

    if (pr.mergeable === false) {
      return true;
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, MERGEABLE_POLL_INTERVAL_MS));
  }

  return false;
}

export async function getMergeableState(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<"clean" | "conflict" | "unstable" | "blocked" | "unknown" | null> {
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  if (pr.mergeable === false) {
    return "conflict";
  }

  if (pr.mergeable_state === null || pr.mergeable_state === undefined) {
    return null;
  }

  return pr.mergeable_state as "clean" | "conflict" | "unstable" | "blocked" | "unknown";
}
