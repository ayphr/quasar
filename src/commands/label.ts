import { Command, CommandContext } from "./types";

export const labelCommand: Command = {
  name: "label",
  description: "Add labels to the issue or PR (e.g. `/label firmware`)",
  execute: async ({ context, args }: CommandContext) => {
    const labels = args.join(" ").trim().split(/[\s,]+/).filter(Boolean);

    if (labels.length === 0) {
      await context.octokit.rest.issues.createComment(
        context.issue({ body: "Please provide labels to add, e.g. `/label firmware` or `/label firmware,companion`." })
      );
      return;
    }

    await context.octokit.rest.issues.addLabels({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      issue_number: context.payload.issue.number,
      labels,
    });

    await context.octokit.rest.issues.createComment(
      context.issue({ body: `Labels added: ${labels.join(", ")}` })
    );
  },
};
