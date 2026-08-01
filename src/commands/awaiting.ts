import { Command, CommandContext } from "./types";

export const awaitingCommand: Command = {
  name: "awaiting",
  description: "Mark an issue as awaiting the author's response",
  permissionRequired: "maintainer",
  execute: async ({ context, args }: CommandContext) => {
    if (args[0] === "remove" || args[0] === "rm" || args[0] === "delete" || args[0] === "del" || args[0] === "unmark") {
      await context.octokit.rest.issues.removeLabel({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: context.payload.issue.number,
        name: "awaiting author",
      });

      const successComment = context.issue({ body: "Issue label removed." });
      await context.octokit.rest.issues.createComment(successComment);
      return;
    }

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
