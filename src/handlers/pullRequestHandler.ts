import { Probot } from "probot";
import { EventHandler } from "./types";

export const pullRequestHandler: EventHandler = {
  register: (app: Probot) => {
    app.on("pull_request.opened", async (context) => {
      const labels = context.payload.pull_request.labels?.map((label) => label.name);

      if (labels?.includes("triage needed")) {
        const prComment = context.issue({
          body: "Thanks for opening this pull request! A maintainer will triage it as soon as possible.",
        });

        await context.octokit.rest.issues.createComment(prComment);
      }
    });
  },
};
