import { Command, CommandContext } from "./types";
import { pingCommand } from "./ping";

export class CommandRegistry {
  private readonly commands: Map<string, Command> = new Map();

  constructor() {
    this.register(pingCommand);
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
}
