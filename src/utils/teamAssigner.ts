import { ProbotOctokit } from "probot";
import { CONFIG } from "../config";

export interface AssignmentResult {
  assignee: string;
  poolSize: number;
  alreadyAssigned: number;
}

export async function assignRandomTeamMember(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  issueNumber: number,
  currentAssignees: string[] = []
): Promise<AssignmentResult | null> {
  const teamMembers = await octokit.paginate(
    octokit.rest.teams.listMembersInOrg,
    {
      org: owner,
      team_slug: CONFIG.AUTOASSIGN_TEAM_SLUG,
    }
  );

  const available = teamMembers.filter(
    (m) => !currentAssignees.includes(m.login)
  );

  if (available.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  const selected = available[randomIndex];

  await octokit.rest.issues.addAssignees({
    owner,
    repo,
    issue_number: issueNumber,
    assignees: [selected.login],
  });

  return {
    assignee: selected.login,
    poolSize: teamMembers.length,
    alreadyAssigned: currentAssignees.length,
  };
}

export async function unassignUser(
  octokit: ProbotOctokit,
  owner: string,
  repo: string,
  issueNumber: number,
  user: string
): Promise<void> {
  await octokit.rest.issues.removeAssignees({
    owner,
    repo,
    issue_number: issueNumber,
    assignees: [user],
  });
}
