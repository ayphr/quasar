import { Command, CommandContext } from "./types";

export const awaitingCommand: Command = {
  name: "awaiting",
  description: "Mark an issue as awaiting the author's response",
  permissionRequired: "maintainer",
  execute: async ({ context }: CommandContext) => {
    await context.octokit.rest.issues.addLabels({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: context.payload.issue.number,
      labels: ["awaiting author"],
    });

    const successComment = context.issue({ body: "Issue marked as awaiting the author's response." });
    await context.octokit.rest.issues.createComment(successComment);
  },
};
