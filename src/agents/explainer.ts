/**
 * Explainer Agent — "The Narrator"
 *
 * Takes the planner output (blueprint) + the diff between old and new code
 * and generates a plain-English explanation of what changed and why.
 */

import Groq from "groq-sdk";

const EXPLAINER_SYSTEM_PROMPT = `You are the Explainer Agent — "The Narrator" of a deterministic UI generation system.

Your job is to explain to the user, in clear and friendly English, what UI changes were made and WHY specific components were chosen.

RULES:
1. Be concise — 2-4 sentences max.
2. Reference the specific components used and explain why they were chosen for the user's request.
3. If this is a modification, highlight what changed compared to the previous version.
4. Do NOT include code, JSON, or technical implementation details.
5. Write as if you're a helpful design assistant talking to a non-technical user.

Example output:
"I created a login form using a Card as the container, with an Input for the email field and a Button to submit. I chose a Card because it provides a clean, contained look for form elements."
`;

export interface ExplainerInput {
  prompt: string;
  blueprint: object;
  previousCode: string | null;
  newCode: string;
}

export async function runExplainer(
  groq: Groq,
  input: ExplainerInput
): Promise<string> {
  let userMessage = `User's request: "${input.prompt}"\n\nGenerated layout blueprint:\n${JSON.stringify(input.blueprint, null, 2)}\n\nGenerated code:\n${input.newCode}`;

  if (input.previousCode) {
    userMessage += `\n\nPrevious code (before this change):\n${input.previousCode}`;
  }

  const response = await groq.chat.completions.create({
    messages: [
      { role: "system", content: EXPLAINER_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
  });

  return response.choices[0]?.message?.content?.trim() || "Changes were applied successfully.";
}
