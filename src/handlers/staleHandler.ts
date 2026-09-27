import { Probot } from "probot";
import cron from "node-cron";
import { EventHandler } from "./types";
import { CONFIG } from "../config";
import { checkAllPrsForStale, processThumbsDownReactions } from "../services/prService";
import { checkAllIssuesForStale } from "../services/issueService";

export const staleHandler: EventHandler = {
  register: (app: Probot) => {
    if (process.env.NODE_ENV !== "test") {
      cron.schedule(CONFIG.CRON_SCHEDULE, async () => {
        app.log.info("Running scheduled stale check...");

        try {
          await checkAllPrsForStale(app);
        } catch (error) {
          app.log.error({ err: error }, "Failed to check PRs for staleness");
        }

        try {
          await checkAllIssuesForStale(app);
        } catch (error) {
          app.log.error({ err: error }, "Failed to check issues for staleness");
        }

        try {
          await processThumbsDownReactions(app);
        } catch (error) {
          app.log.error({ err: error }, "Failed to process thumbs-down reactions");
        }

        app.log.info("Scheduled stale check complete.");
      });
    }
  },
};
