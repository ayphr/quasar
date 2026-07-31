import { Probot } from "probot";
import { EventHandler } from "./types";

export const issueHandler: EventHandler = {
  register: (app: Probot) => {
    app.on("issues.opened", async (context) => {
      const labels = context.payload.issue.labels?.map((label) => label.name);

      if (labels?.includes("triage needed")) {
        const issueComment = context.issue({
          body: "Thanks for opening this issue! A maintainer will triage it as soon as possible.",
        });

        await context.octokit.rest.issues.createComment(issueComment);
      }
    });
  },
};
