import { CommandRegistry } from "./registry";
import { Command, CommandContext } from "./types";

export const createHelpCommand = (commandRegistry: CommandRegistry): Command => ({
  name: "help",
  description: "Display help information",
  execute: async ({ context }: CommandContext) => {
    const commands = commandRegistry.getCommands();

    const helpMessage = commands
      .map((command) => (() => {
        const name = command.name;
        const description = command.description;
        const permissionRequired = command.permissionRequired ? ` (Permission required: ${command.permissionRequired})` : "";
        return `- \`/${name}\`: ${description}${permissionRequired}`;
      })())
      .join("\n");

    const helpComment = context.issue({ body: `Available commands:\n\n${helpMessage}` });
    await context.octokit.rest.issues.createComment(helpComment);
  },
});
