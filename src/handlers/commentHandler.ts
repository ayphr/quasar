import { Probot } from "probot";
import { EventHandler } from "./types";
import { CommandRegistry } from "../commands/registry";

export const createCommentHandler = (commandRegistry: CommandRegistry): EventHandler => ({
  register: (app: Probot) => {
    app.on("issue_comment.created", async (context) => {
      if (context.payload.comment.user?.type === "Bot") return;

      const body = context.payload.comment.body.trim();

      if (!body.startsWith("/")) return;

      const [rawCommand, ...args] = body.slice(1).split(/\s+/);

      await commandRegistry.execute(rawCommand, { context, args });
    });
  },
});
