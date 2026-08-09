import { Command, CommandContext } from "./types";

export const triageCommand: Command = {
  name: "triage",
  description: "Triage an issue",
  permissionRequired: "maintainer",
  execute: async ({ context, args }: CommandContext) => {
    const labelsInput = args.join(" ").trim();
    const labels = labelsInput.length > 0 ? labelsInput.split(",").map((label) => label.trim()).filter(Boolean) : [];

    if (context.payload.issue.type?.name === "bug" && !labels.includes("confirmed")) {
      labels.push("confirmed");
    }

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
