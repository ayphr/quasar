import { Context } from "probot";

export interface CommandContext {
  context: Context<"issue_comment.created">;
  args: string[];
}

export interface Command {
  name: string;
  description: string;
  permissionRequired?: "maintainer" | "anyone";
  execute: (cmdContext: CommandContext) => Promise<void>;
}
