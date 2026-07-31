import { Command, CommandContext } from "./types";

export const triageCommand: Command = {
  name: "triage",
  description: "Triage an issue",
  execute: async ({ context, args }: CommandContext) => {
    const label = args[0];
    if (!label) {
      const errorComment = context.issue({ body: "Please provide a label to triage the issue." });
      await context.octokit.rest.issues.createComment(errorComment);
      return;
    }

    await context.octokit.rest.issues.addLabels({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: context.payload.issue.number,
      labels: [label],
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

    const successComment = context.issue({ body: `Issue triaged with label: ${label}` });
    await context.octokit.rest.issues.createComment(successComment);
  },
};
