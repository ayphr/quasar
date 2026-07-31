import { Probot } from "probot";

export interface EventHandler {
  register: (app: Probot) => void;
}
