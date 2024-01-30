import * as core from "@actions/core";

export const GITHUB_TOKEN: string = core.getInput("GITHUB_TOKEN");
export const PS_CHAT_TOKEN: string = core.getInput("PS_CHAT_TOKEN");

export const URL = "https://api.psnext.info";
