import { Probot, ProbotOctokit } from "probot";
import { CONFIG } from "../config";
import { addLabel, removeLabel, getLabelNames } from "../utils/labelManager";
import { requestAuthorTriage, isBodyWellFormed, isBugReportWellFormed } from "../utils/triageRequest";
import { isIssueEligibleForClose, isIssueEligibleForWarning } from "../utils/staleChecker";

export async function processIssue(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<void> {
  const { data: issue } = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });
  const ownerRepo = { owner, repo };
  const labelNames = getLabelNames(issue);
  const labelSet = new Set(labelNames);

  if (labelSet.has(CONFIG.STALE_LABEL)) {
    await removeLabel(octokit, ownerRepo, issueNumber, CONFIG.STALE_LABEL);
  }

  if (labelSet.has(CONFIG.TRIAGE_NEEDED_LABEL)) {
    await removeLabel(octokit, ownerRepo, issueNumber, CONFIG.TRIAGE_NEEDED_LABEL);
  }

  const body = issue.body ?? "";
  const authorLogin = issue.user?.login ?? "unknown";

  if (!isBodyWellFormed(body)) {
    if (!labelSet.has("invalid")) {
      await addLabel(octokit, ownerRepo, issueNumber, "invalid");
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: `Hi @${authorLogin}, this issue appears to be invalid because it lacks sufficient detail. Please provide a clear description and, if applicable, steps to reproduce.`,
      });
    }
    await removeLabel(octokit, ownerRepo, issueNumber, "awaiting author");
    await removeLabel(octokit, ownerRepo, issueNumber, "confirmed");
    return;
  }

  if (labelSet.has("invalid")) {
    await removeLabel(octokit, ownerRepo, issueNumber, "invalid");
  }

  if (isBugReportWellFormed(body)) {
    if (!labelSet.has("confirmed")) {
      await addLabel(octokit, ownerRepo, issueNumber, "confirmed");
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: `Hi @${authorLogin}, this bug report looks well-formed. I've marked it as \`confirmed\`.`,
      });
    }
    await removeLabel(octokit, ownerRepo, issueNumber, "awaiting author");
  } else if (!isBugReportWellFormed(body) && body.length < 50) {
    if (!labelSet.has("awaiting author")) {
      await addLabel(octokit, ownerRepo, issueNumber, "awaiting author");
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: `Hi @${authorLogin}, this issue is missing some important information. Could you provide more details (e.g. steps to reproduce, expected vs actual behavior)? Once updated, I'll re-evaluate.`,
      });
    }
    await removeLabel(octokit, ownerRepo, issueNumber, "confirmed");
  } else {
    if (labelSet.has("awaiting author")) {
      await removeLabel(octokit, ownerRepo, issueNumber, "awaiting author");
    }
    if (labelSet.has("confirmed")) {
      await removeLabel(octokit, ownerRepo, issueNumber, "confirmed");
    }
  }

  await requestAuthorTriage(
    octokit,
    ownerRepo,
    issueNumber,
    authorLogin,
    issue.pull_request ? "pull_request" : "issue"
  );
}

export async function checkAllIssuesForStale(app: Probot): Promise<void> {
  const appOctokit = await app.auth();
  const installations = await appOctokit.rest.apps.listInstallations({});

  for (const installation of installations.data) {
    const installationOctokit = await app.auth(installation.id);

    const { data: repos } = await installationOctokit.rest.apps.listReposAccessibleToInstallation({
      installation_id: installation.id,
    });

    for (const repo of repos.repositories ?? []) {
      const owner = repo.owner?.login ?? "";
      if (!owner || !repo.name) continue;

      const { data: issues } = await installationOctokit.rest.issues.listForRepo({
        owner,
        repo: repo.name,
        state: "open",
        per_page: 100,
      });

      for (const issue of issues) {
        if (issue.pull_request) continue;

        const ownerRepo = { owner, repo: repo.name };
        const labelNames = getLabelNames(issue);
        const labelSet = new Set(labelNames);
        const hasStaleLabel = labelSet.has(CONFIG.STALE_LABEL);

        if (hasStaleLabel) {
          if (isIssueEligibleForClose(issue.updated_at)) {
            await installationOctokit.rest.issues.update({
              owner,
              repo: repo.name,
              issue_number: issue.number,
              state: "closed",
            });
            await installationOctokit.rest.issues.createComment({
              owner,
              repo: repo.name,
              issue_number: issue.number,
              body: `This issue has been closed after being stale for ${CONFIG.ISSUE_STALE_DAYS + CONFIG.ISSUE_CLOSE_WARNING_DAYS} days without any updates.`,
            });
          }
        } else if (isIssueEligibleForWarning(issue.updated_at)) {
          await addLabel(installationOctokit, ownerRepo, issue.number, CONFIG.STALE_LABEL);
          await installationOctokit.rest.issues.createComment({
            owner,
            repo: repo.name,
            issue_number: issue.number,
            body: `Hi @${issue.user?.login}, this issue has been inactive for ${CONFIG.ISSUE_STALE_DAYS} days. If the issue is still present, please respond within the next ${CONFIG.ISSUE_CLOSE_WARNING_DAYS} days to confirm. Otherwise, it will be closed automatically.`,
          });
        }
      }
    }
  }
}
