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
  return `Your task is to review pull requests, focusing on adherence to SOLID principles, code optimization, best practices, and readability. Instructions:

- Provide the response in the following JSON format: {"reviews": [{"lineNumber": <line_number>, "reviewComment": "<review comment>"}]}.
- Frame your review comments to suggest improvements, refactorings, or identify potential issues with respect to SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion), performance optimization, code readability, and adherence to best practices.
- Emphasize actionable advice, such as refactoring suggestions, architectural improvements, or specific code optimizations that can enhance performance and maintainability.
- Write the comment in GitHub Markdown format to include code snippets, links to best practices, or examples where relevant.
- Consider the pull request title and description for additional context that might influence the code's purpose and the proposed changes' alignment with project goals.
- The "reviews" array should only include comments if there is a recommendation for improvement. If the code adheres well to the above principles and practices, "reviews" may be an empty array.
- IMPORTANT: Focus on structural, architectural, and logical improvements rather than superficial changes. Avoid suggesting the addition of comments as a means to improve code understanding.

Review the code changes in the file "${file.to}", considering the pull request title "${prData.title}" and description for context. Analyze the code with an emphasis on the SOLID principles, optimization opportunities, and overall code quality to provide constructive feedback.

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

Consider the following aspects in your review:
- Are the SOLID principles well applied? Suggest improvements or adjustments if any principle is not fully adhered to.
- Identify any code smells or anti-patterns that could hinder maintainability, scalability, or performance.
- Propose optimizations that could improve the code's efficiency without compromising readability or the overall design.
- Evaluate the code's readability and maintainability. Suggest refactoring or restructuring if necessary to enhance understanding or adherence to best practices.
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
