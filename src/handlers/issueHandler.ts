import { Probot } from "probot";
import { EventHandler } from "./types";
import { processIssue } from "../services/issueService";

export const issueHandler: EventHandler = {
  register: (app: Probot) => {
    app.on(
      ["issues.opened", "issues.reopened", "issues.edited", "issues.labeled"],
      async (context) => {
        if (context.isBot) return;

        const owner = context.payload.repository.owner.login;
        const repo = context.payload.repository.name;
        const issueNumber = context.payload.issue.number;

        try {
          await processIssue(context.octokit, owner, repo, issueNumber);
        } catch (error) {
          context.log.error({ err: error }, `Failed to process issue #${issueNumber}`);
        }
      }
    );
  },
};
