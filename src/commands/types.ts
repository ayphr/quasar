import { Context } from "probot";

export interface CommandContext {
  context: Context<"issue_comment.created">;
  args: string[];
}

export interface Command {
  name: string;
  description: string;
  execute: (cmdContext: CommandContext) => Promise<void>;
}
