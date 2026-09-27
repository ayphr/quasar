import { Command, CommandContext } from "./types";

export const unlabelCommand: Command = {
  name: "unlabel",
  description: "Remove labels from the issue or PR (e.g. `/unlabel firmware`)",
  execute: async ({ context, args }: CommandContext) => {
    const labels = args.join(" ").trim().split(/[\s,]+/).filter(Boolean);

    if (labels.length === 0) {
      await context.octokit.rest.issues.createComment(
        context.issue({ body: "Please provide labels to remove, e.g. `/unlabel firmware` or `/unlabel firmware,companion`." })
      );
      return;
    }

    const removed: string[] = [];
    const notFound: string[] = [];

    for (const label of labels) {
      try {
        await context.octokit.rest.issues.removeLabel({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: context.payload.issue.number,
          name: label,
        });
        removed.push(label);
      } catch {
        notFound.push(label);
      }
    }

    let body = `Removed labels: ${removed.join(", ") || "none"}.`;
    if (notFound.length > 0) {
      body += `\nNot found or already removed: ${notFound.join(", ")}.`;
    }

    await context.octokit.rest.issues.createComment(context.issue({ body }));
  },
};
