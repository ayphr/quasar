import { Command, CommandContext } from "./types";

export const triageCommand: Command = {
  name: "triage",
  description: "Triage an issue",
  execute: async ({ context, args }: CommandContext) => {
    if (!context.payload.comment.user) {
      return;
    }

    const { data: permission } = await context.octokit.rest.repos.getCollaboratorPermissionLevel({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      username: context.payload.comment.user.login,
    });

    if (permission.permission !== "admin" && permission.permission !== "write") {
      const errorComment = context.issue({ body: "You do not have permission to triage this issue." });
      await context.octokit.rest.issues.createComment(errorComment);
      return;
    }

    const labels = args.length > 0 ? args : [];
    if (labels.length === 0) {
      const errorComment = context.issue({ body: "Please provide labels to triage the issue." });
      await context.octokit.rest.issues.createComment(errorComment);
      return;
    }

    await context.octokit.rest.issues.addLabels({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: context.payload.issue.number,
      labels: labels,
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

    const successComment = context.issue({ body: `Issue triaged with labels: ${labels.join(", ")}` });
    await context.octokit.rest.issues.createComment(successComment);
  },
};
