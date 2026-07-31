import { Probot } from "probot";
import { CommandRegistry } from "./commands/registry";
import { issueHandler } from "./handlers/issueHandler";
import { pullRequestHandler } from "./handlers/pullRequestHandler";
import { createCommentHandler } from "./handlers/commentHandler";

const appEntryPoint = (app: Probot) => {
  const commandRegistry = new CommandRegistry();

  const handlers = [
    issueHandler,
    pullRequestHandler,
    createCommentHandler(commandRegistry),
  ];

  handlers.forEach((handler) => handler.register(app));
};

export default appEntryPoint;
