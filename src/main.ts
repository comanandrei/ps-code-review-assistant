import { readFileSync } from "fs";
import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import parseDiff from "parse-diff";
import minimatch from "minimatch";
import { PullRequestData } from "./types";
import analyzeCode from "./analyzeCode";
import { GITHUB_TOKEN } from "./config";

const octokit = new Octokit({ auth: GITHUB_TOKEN });
export async function getPullRequest(): Promise<PullRequestData> {
  // Destructure necessary properties from the event JSON
  const {
    repository: {
      owner: { login: owner },
      name: repo,
    },
    number,
  } = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH || "", "utf8"));

  // Fetch pull request details from GitHub
  const {
    data: { title = "", body = "" },
  } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: number,
  });

  // Construct and return PullRequestData object
  return {
    owner,
    repo,
    pull_number: number,
    title,
    description: body || "",
  };
}

// Function to fetch the diff of a specific pull request
export async function getPullRequestDiff(
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<string | null> {
  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: { format: "diff" },
  });
  console.log("====getPullRequestDiff", response);

  return response.data as unknown as string;
}

// Function to post review comments on a pull request
async function postPullRequestReview(
  owner: string,
  repo: string,
  pullNumber: number,
  reviewComments: Array<{ body: string; path: string; line: number }>,
): Promise<void> {
  try {
    // Post comments to the specified pull request
    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      comments: reviewComments,
      event: "COMMENT", // Specifies the type of review action
    });
  } catch (error) {
    console.error("Error posting review comments:", error);
    throw error;
  }
}

async function main() {
  console.log("=======START=======");
  const pullRequestData = await getPullRequest();
  let diff: string | null;
  // JSON file that contains information about the event that triggered the workflow. This file typically includes details about a pull request, push, issue, or other GitHub-related events.
  const eventData = JSON.parse(
    readFileSync(process.env.GITHUB_EVENT_PATH ?? "", "utf8"),
  );
  console.log('====process.env.GITHUB_EVENT_PATH', process.env.GITHUB_EVENT_PATH);
  console.log("====pullRequest", pullRequestData);
  console.log("====eventData", eventData);
  if (eventData.action === "opened") {
    diff = await getPullRequestDiff(
      pullRequestData.owner,
      pullRequestData.repo,
      pullRequestData.pull_number,
    );
  } else if (eventData.action === "synchronize") {
    const newBaseSha = eventData.before;
    const newHeadSha = eventData.after;

    const response = await octokit.repos.compareCommits({
      headers: {
        accept: "application/vnd.github.v3.diff",
      },
      owner: pullRequestData.owner,
      repo: pullRequestData.repo,
      base: newBaseSha,
      head: newHeadSha,
    });
    console.log("====compareCommits", JSON.stringify(response.data));
    diff = String(response.data);
  } else {
    console.log("Unsupported event:", process.env.GITHUB_EVENT_NAME);
    return;
  }

  if (!diff) {
    console.log("No diff found");
    return;
  }
  console.log("====diff", diff);
  const parsedDiff = parseDiff(diff);
  console.log("====parsedDiff", parsedDiff);
  // Gets a string of comma-separated patterns from the action's input (defined in the workflow YAML).
  const excludePatterns = core
    .getInput("exclude")
    .split(",")
    .map((s) => s.trim());

  const filteredDiff = parsedDiff.filter((file) => {
    return !excludePatterns.some((pattern) =>
      minimatch(file.to ?? "", pattern),
    );
  });
  console.log("====filteredDiff", filteredDiff);
  const comments = await analyzeCode(filteredDiff, pullRequestData);
  console.log("====comments", comments);
  if (comments.length > 0) {
    await postPullRequestReview(
      pullRequestData.owner,
      pullRequestData.repo,
      pullRequestData.pull_number,
      comments,
    );
  }
  console.log('======= end ===========');
}
main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
