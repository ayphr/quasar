import { Command, CommandContext } from "./types";

export const readyCommand: Command = {
  name: "ready",
  description: "Mark a draft PR as ready for review (triggers auto-assignment)",
  permissionRequired: "maintainer",
  execute: async ({ context }: CommandContext) => {
    const pr = context.payload.issue?.pull_request;

    if (!pr) {
      await context.octokit.rest.issues.createComment(
        context.issue({ body: "This command can only be used on pull requests." })
      );
      return;
    }

    const { data: fullPR } = await context.octokit.rest.pulls.get({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      pull_number: context.payload.issue.number,
    });

    if (!fullPR.draft) {
      await context.octokit.rest.issues.createComment(
        context.issue({ body: "This pull request is not a draft." })
      );
      return;
    }

    await context.octokit.rest.pulls.update({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      pull_number: fullPR.number,
      draft: false,
    });

    await context.octokit.rest.issues.createComment(
      context.issue({ body: "Pull request marked as ready for review. Auto-assignment will be triggered." })
    );
  },
};
