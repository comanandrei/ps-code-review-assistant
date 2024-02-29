import * as core from "@actions/core";

export const GITHUB_TOKEN: string = core.getInput("GITHUB_TOKEN");
export const PS_CHAT_TOKEN: string = core.getInput("PS_CHAT_TOKEN");
export const PROMPT: string = core.getInput("prompt");
export const EXCLUDE: string = core.getInput("exclude");

export const URL = "https://api.psnext.info";
