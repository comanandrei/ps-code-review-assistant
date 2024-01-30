import { Chunk, File } from "parse-diff";
import { PullRequestData } from "./types";
import { getPSChatbotResponse } from "./pschatService";

export default async function analyzeCode(
  filteredDiff: File[],
  prData: PullRequestData,
): Promise<Array<{ body: string; path: string; line: number }>> {
  const comments: Array<{ body: string; path: string; line: number }> = [];
  for (const file of filteredDiff) {
    if (file.to === "/dev/null") continue; // Skip deleted files
    for (const chunk of file.chunks) {
      console.log("====chunk", chunk);
      const prompt = createPrompt(file, chunk, prData);
      const psChatResponse = await getPSChatbotResponse(prompt);
      if (psChatResponse) {
        comments.push(...createComment(file, psChatResponse));
      }
    }
  }
  return comments;
}

function createPrompt(
  file: File,
  chunk: Chunk,
  prData: PullRequestData,
): string {
  return `Your task is to review pull requests. Instructions:
- Provide the response in following JSON format:  {"reviews": [{"lineNumber":  <line_number>, "reviewComment": "<review comment>"}]}
- Do not give positive comments or compliments.
- Provide comments and suggestions ONLY if there is something to improve, otherwise "reviews" should be an empty array.
- Write the comment in GitHub Markdown format.
- Use the given description only for the overall context and only comment the code.
- IMPORTANT: NEVER suggest adding comments to the code.

Review the following code diff in the file "${
    file.to
  }" and take the pull request title and description into account when writing the response.

Pull request title: ${prData.title}
Pull request description:

---
${prData.description}
---

Git diff to review:

\`\`\`diff
${chunk.content}
${chunk.changes
  // @ts-expect-error - ln and ln2 exists where needed
  .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
  .join("\n")}
\`\`\`
`;
}

function createComment(
  file: File,
  psChatResponse: Array<{
    lineNumber: string;
    reviewComment: string;
  }>,
): Array<{ body: string; path: string; line: number }> {
  return psChatResponse.map((review) => {
    console.log("====aiResponse", review);
    return {
      body: review.reviewComment,
      path: file.to ?? "defaultPath", // Handle the undefined case
      line: Number(review.lineNumber),
    };
  });
}
