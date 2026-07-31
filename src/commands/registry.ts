import { Command, CommandContext } from "./types";
import { pingCommand } from "./ping";
import { triageCommand } from "./triage";
import { invalidCommand } from "./invalid";
import { awaitingCommand } from "./awaiting";
import { createHelpCommand } from "./help";

export class CommandRegistry {
  private readonly commands: Map<string, Command> = new Map();

  constructor() {
    this.register(pingCommand);
    this.register(triageCommand);
    this.register(invalidCommand);
    this.register(awaitingCommand);

    this.register(createHelpCommand(this));
  }

  public register(command: Command) {
    this.commands.set(command.name.toLowerCase(), command);
  }

  public async execute(name: string, cmdContext: CommandContext): Promise<boolean> {
    const command = this.commands.get(name.toLowerCase());
    if (!command) return false;

    const permissionRequired = command.permissionRequired || "anyone";

    if (permissionRequired === "maintainer") {
      const { data: permission } = await cmdContext.context.octokit.rest.repos.getCollaboratorPermissionLevel({
        owner: cmdContext.context.payload.repository.owner.login,
        repo: cmdContext.context.payload.repository.name,
        username: cmdContext.context.payload.comment.user?.login || "",
      });

      if (permission.permission !== "admin" && permission.permission !== "write") {
        const errorComment = cmdContext.context.issue({ body: "You do not have permission to execute this command." });
        await cmdContext.context.octokit.rest.issues.createComment(errorComment);
        return true;
      }
    }

    await command.execute(cmdContext);
    return true;
  }

  public getCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}
