/**
 * Generator Agent — "The Builder"
 *
 * Takes a JSON layout blueprint + the component manifest and produces
 * executable React JSX code using ONLY whitelisted components.
 */

import Groq from "groq-sdk";
import { getManifestPromptString } from "./componentManifest";

const GENERATOR_SYSTEM_PROMPT = `You are the Generator Agent — "The Builder" of a deterministic UI generation system.

Your job is to convert a JSON layout blueprint into valid React JSX code.

RULES (NON-NEGOTIABLE):
1. Output ONLY the JSX body — do NOT include import statements, function declarations, or export statements.
2. The code must render ONLY using components from the Component Library below.
3. NO arbitrary HTML tags (no <div>, <span>, <p>, <a>, <h1> etc.). Use ONLY the whitelisted components.
4. NO inline styles (no style={{}}), NO className attributes, NO CSS of any kind.
5. NO custom React components. Only use the components from the library.
6. String text content is allowed inside component children.
7. For event handler props like onClick, use a no-op: {() => {}}
8. Output ONLY the raw JSX code. No markdown code fences, no explanation.
9. The JSX must be a single root element (wrap in a Container if needed).

${getManifestPromptString()}
`;

export interface GeneratorInput {
  blueprint: object;
}

export async function runGenerator(
  groq: Groq,
  input: GeneratorInput
): Promise<string> {
  const userMessage = `Convert this JSON layout blueprint into React JSX code:\n\n${JSON.stringify(input.blueprint, null, 2)}`;

  const response = await groq.chat.completions.create({
    messages: [
      { role: "system", content: GENERATOR_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
  });

  const text = response.choices[0]?.message?.content?.trim() || "";

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:jsx|tsx|react)?\n?/i, "")
    .replace(/\n?```$/i, "");

  return cleaned;
}
