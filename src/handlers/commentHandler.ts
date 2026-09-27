import { Probot } from "probot";
import { EventHandler } from "./types";
import { CommandRegistry } from "../commands/registry";
import { CONFIG } from "../config";
import { getLabelNames, removeLabel } from "../utils/labelManager";

export const createCommentHandler = (commandRegistry: CommandRegistry): EventHandler => ({
  register: (app: Probot) => {
    app.on("issue_comment.created", async (context) => {
      if (context.payload.comment.user?.type === "Bot") return;

      const owner = context.payload.repository.owner.login;
      const repo = context.payload.repository.name;
      const issueNumber = context.payload.issue.number;

      const labelNames = getLabelNames(context.payload.issue);
      if (labelNames.includes(CONFIG.STALE_LABEL)) {
        try {
          await removeLabel(context.octokit, { owner, repo }, issueNumber, CONFIG.STALE_LABEL);
        } catch (error) {
          context.log.error({ err: error }, `Failed to remove stale label from #${issueNumber}`);
        }
      }

      const body = context.payload.comment.body.trim();

      if (!body.startsWith("/")) return;

      const [rawCommand, ...args] = body.slice(1).split(/\s+/);

      await commandRegistry.execute(rawCommand, { context, args });
    });
  },
});
