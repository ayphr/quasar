import { Command, CommandContext } from "./types";

export const pingCommand: Command = {
  name: "ping",
  description: "Responds with pong and a reaction",
  execute: async ({ context }: CommandContext) => {
    await context.octokit.rest.reactions.createForIssueComment({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      comment_id: context.payload.comment.id,
      content: "+1",
    });

    // Create reply comment
    const pingComment = context.issue({ body: "Pong!" });
    await context.octokit.rest.issues.createComment(pingComment);
  },
};
