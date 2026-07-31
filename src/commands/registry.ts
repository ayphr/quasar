import { Command, CommandContext } from "./types";
import { pingCommand } from "./ping";
import { triageCommand } from "./triage";
import { createHelpCommand } from "./help";

export class CommandRegistry {
  private readonly commands: Map<string, Command> = new Map();

  constructor() {
    this.register(pingCommand);
    this.register(triageCommand);

    this.register(createHelpCommand(this));
  }

  public register(command: Command) {
    this.commands.set(command.name.toLowerCase(), command);
  }

  public async execute(name: string, cmdContext: CommandContext): Promise<boolean> {
    const command = this.commands.get(name.toLowerCase());
    if (!command) return false;

    await command.execute(cmdContext);
    return true;
  }

  public getCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}
