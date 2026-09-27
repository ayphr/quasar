import { Probot, ProbotOctokit } from "probot";
import { CONFIG } from "../config";
import { addLabel, removeLabel, getLabelNames } from "../utils/labelManager";
import { isMergeConflict } from "../utils/conflictChecker";
import { assignRandomTeamMember } from "../utils/teamAssigner";
import { isPrStale } from "../utils/staleChecker";

export async function processPr(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });
  const ownerRepo = { owner, repo };
  const labelNames = getLabelNames(pr);
  const labelSet = new Set(labelNames);
  const assignees = pr.assignees?.map((a) => a.login).filter((v): v is string => !!v) ?? [];

  if (labelSet.has(CONFIG.STALE_LABEL)) {
    await removeLabel(octokit, ownerRepo, prNumber, CONFIG.STALE_LABEL);
  }

  const hasConflict = await isMergeConflict(octokit, owner, repo, prNumber);

  if (hasConflict) {
    const wasAlreadyLabeled = labelSet.has(CONFIG.MERGE_CONFLICT_LABEL);
    await addLabel(octokit, ownerRepo, prNumber, CONFIG.MERGE_CONFLICT_LABEL);
    if (!wasAlreadyLabeled) {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `This pull request has merge conflicts. Please resolve them before it can be merged.`,
      });
    }
    if (labelSet.has(CONFIG.AUTO_ASSIGNED_LABEL)) {
      await removeLabel(octokit, ownerRepo, prNumber, CONFIG.AUTO_ASSIGNED_LABEL);
    }
    return;
  }

  if (labelSet.has(CONFIG.MERGE_CONFLICT_LABEL)) {
    await removeLabel(octokit, ownerRepo, prNumber, CONFIG.MERGE_CONFLICT_LABEL);
  }

  if (pr.draft) {
    return;
  }

  if (isPrStale(pr.updated_at)) {
    await addLabel(octokit, ownerRepo, prNumber, CONFIG.STALE_LABEL);
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `This pull request has been marked as stale due to inactivity.`,
    });
    return;
  }

  if (labelSet.has("awaiting author")) {
    return;
  }

  if (labelSet.has(CONFIG.AUTO_ASSIGNED_LABEL)) {
    return;
  }

  if (assignees.length > 0) {
    await addLabel(octokit, ownerRepo, prNumber, CONFIG.AUTO_ASSIGNED_LABEL);
    return;
  }

  const result = await assignRandomTeamMember(octokit, owner, repo, prNumber, []);

  if (!result) {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `No available team members from the \`${CONFIG.AUTOASSIGN_TEAM_SLUG}\` team to assign.`,
    });
    return;
  }

  await addLabel(octokit, ownerRepo, prNumber, CONFIG.AUTO_ASSIGNED_LABEL);

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `I've assigned this pull request to @${result.assignee}. If they are unable to review, they can add a :thumbsdown: reaction to this comment and I'll assign someone else.`,
  });
}

export async function checkAllPrsForStale(app: Probot): Promise<void> {
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

      const { data: prs } = await installationOctokit.rest.pulls.list({
        owner,
        repo: repo.name,
        state: "open",
        per_page: 100,
      });

      for (const pr of prs) {
        if (pr.draft) continue;

        const ownerRepo = { owner, repo: repo.name };
        const labelNames = getLabelNames(pr);
        const labelSet = new Set(labelNames);

        if (isPrStale(pr.updated_at)) {
          if (!labelSet.has(CONFIG.STALE_LABEL)) {
            await addLabel(installationOctokit, ownerRepo, pr.number, CONFIG.STALE_LABEL);
            await installationOctokit.rest.issues.createComment({
              owner,
              repo: repo.name,
              issue_number: pr.number,
              body: `This pull request has been marked as stale due to inactivity of ${CONFIG.PR_STALE_DAYS} days.`,
            });
          }
        } else if (labelSet.has(CONFIG.STALE_LABEL)) {
          await removeLabel(installationOctokit, ownerRepo, pr.number, CONFIG.STALE_LABEL);
        }
      }
    }
  }
}

export async function processThumbsDownReactions(app: Probot): Promise<void> {
  const appOctokit = await app.auth();
  const installations = await appOctokit.rest.apps.listInstallations({});

  for (const installation of installations.data) {
    const installationOctokit = await app.auth(installation.id);

    const { data: repos } = await installationOctokit.rest.apps.listReposAccessibleToInstallation({
      installation_id: installation.id,
    });

    const { data: bot } = await installationOctokit.rest.users.getAuthenticated();

    for (const repo of repos.repositories ?? []) {
      const owner = repo.owner?.login ?? "";
      if (!owner || !repo.name) continue;

      const { data: prs } = await installationOctokit.rest.pulls.list({
        owner,
        repo: repo.name,
        state: "open",
        per_page: 100,
      });

      for (const pr of prs) {
        const labelNames = getLabelNames(pr);
        if (!labelNames.includes(CONFIG.AUTO_ASSIGNED_LABEL)) continue;

        const currentAssignees = pr.assignees?.map((a) => a.login).filter((v): v is string => !!v) ?? [];
        if (currentAssignees.length === 0) continue;

        const { data: comments } = await installationOctokit.rest.issues.listComments({
          owner,
          repo: repo.name,
          issue_number: pr.number,
          per_page: 100,
        });

        const assignmentComments = comments.filter(
          (c) => c.user?.id === bot.id && (c.body ?? "").includes("I've assigned this pull request to")
        );

        if (assignmentComments.length === 0) continue;

        const latestAssignmentComment = assignmentComments[assignmentComments.length - 1];

        const { data: reactions } = await installationOctokit.rest.reactions.listForIssueComment({
          owner,
          repo: repo.name,
          comment_id: latestAssignmentComment.id,
          per_page: 100,
        });

        const hasThumbsDown = reactions.some((r) => r.content === "-1");

        if (!hasThumbsDown) continue;

        const newResult = await assignRandomTeamMember(
          installationOctokit,
          owner,
          repo.name,
          pr.number,
          currentAssignees
        );

        if (newResult) {
          await installationOctokit.rest.issues.createComment({
            owner,
            repo: repo.name,
            issue_number: pr.number,
            body: `I've reassigned this pull request to @${newResult.assignee} (the previous assignee indicated they couldn't review via a :thumbsdown: reaction).`,
          });
        }
      }
    }
  }
}
