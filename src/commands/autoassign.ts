import { Command, CommandContext } from "./types";

export const autoassignCommand: Command = {
  name: "autoassign",
  description: "Auto-assign an issue",
  permissionRequired: "maintainer",
  execute: async ({ context }: CommandContext) => {
    const teamMembers = await context.octokit.paginate(
      context.octokit.rest.teams.listMembersInOrg,
      {
        org: context.payload.repository.owner.login,
        team_slug: "autoassign",
      }
    );

    const randomIndex = Math.floor(Math.random() * teamMembers.length);
    const selectedAssignee = teamMembers[randomIndex];

    await context.octokit.rest.issues.addAssignees({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: context.payload.issue.number,
      assignees: [selectedAssignee.login],
    });

    const successComment = context.issue({ body: `Issue auto-assigned to @${selectedAssignee.login}.` });
    await context.octokit.rest.issues.createComment(successComment);
  },
};
