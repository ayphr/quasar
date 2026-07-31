import { Command, CommandContext } from "./types";

export const invalidCommand: Command = {
  name: "invalid",
  description: "Mark an issue as invalid",
  permissionRequired: "maintainer",
  execute: async ({ context }: CommandContext) => {
    await context.octokit.rest.issues.addLabels({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: context.payload.issue.number,
      labels: ["invalid"],
    });

    const existingLabels = context.payload.issue.labels.map((l) => l.name);
    if (existingLabels.includes("triage needed")) {
      await context.octokit.rest.issues.removeLabel({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: context.payload.issue.number,
        name: "triage needed",
      });
    }

    const successComment = context.issue({ body: "Issue marked as invalid." });
    await context.octokit.rest.issues.createComment(successComment);
  },
};
