import { Probot } from "probot";
import { EventHandler } from "./types";
import { processPr } from "../services/prService";

export const pullRequestHandler: EventHandler = {
  register: (app: Probot) => {
    app.on(
      [
        "pull_request.opened",
        "pull_request.synchronize",
        "pull_request.reopened",
        "pull_request.ready_for_review",
        "pull_request.edited",
      ],
      async (context) => {
        const owner = context.payload.repository.owner.login;
        const repo = context.payload.repository.name;
        const prNumber = context.payload.pull_request.number;

        try {
          await processPr(context.octokit, owner, repo, prNumber);
        } catch (error) {
          context.log.error({ err: error }, `Failed to process PR #${prNumber}`);
        }
      }
    );
  },
};
