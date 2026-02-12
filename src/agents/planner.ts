/**
 * Planner Agent — "The Architect"
 *
 * Takes a user prompt + current UI state and produces a JSON layout tree
 * using ONLY allowed components from the manifest.
 */

import Groq from "groq-sdk";
import { getManifestPromptString } from "./componentManifest";

const PLANNER_SYSTEM_PROMPT = `You are the Planner Agent — "The Architect" of a deterministic UI generation system.

Your job is to take a user's natural-language UI description and convert it into a JSON layout tree.

RULES (NON-NEGOTIABLE):
1. You may ONLY use components from the provided Component Library. No other HTML elements.
2. You may ONLY set props that are listed for each component. No custom props.
3. NO inline styles, NO CSS classes, NO style props whatsoever.
4. Output ONLY valid JSON — no markdown code fences, no explanation, no extra text.
5. If the user asks to MODIFY an existing UI, you will receive the current layout. Merge changes carefully — do NOT discard existing components unless explicitly asked to remove them.

OUTPUT FORMAT — a single JSON object representing the component tree:
{
  "thinking": "Brief explanation of your design choices...",
  "layout": {
    "type": "ComponentName",
    "props": { "propName": "value" },
    "children": [ ...child nodes or string text ]
  }
}

- "thinking": A string explaining WHY you chose this layout and these components.
- "layout": The actual component tree.
- "children" can be an array of component objects or plain strings for text content.
- If a component has no children, omit the "children" key.

${getManifestPromptString()}
`;

export interface PlannerInput {
  prompt: string;
  currentBlueprint: object | null;
}

export interface LayoutNode {
  type: string;
  props?: Record<string, unknown>;
  children?: (LayoutNode | string)[];
}

export async function runPlanner(
  groq: Groq,
  input: PlannerInput
): Promise<LayoutNode> {
  const userMessage = input.currentBlueprint
    ? `Current UI layout (JSON):\n${JSON.stringify(input.currentBlueprint, null, 2)}\n\nUser request: ${input.prompt}`
    : `User request: ${input.prompt}`;

  const response = await groq.chat.completions.create({
    messages: [
      { role: "system", content: PLANNER_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content?.trim() || "{}";

  // Parse JSON — strip markdown fences if the model wraps them
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");

  try {
    const parsed = JSON.parse(cleaned);
    // Support both old format (direct node) and new CoT format ({ thinking, layout })
    if ("layout" in parsed) {
      console.log("\n🧠 [Planner Thinking]:", parsed.thinking, "\n");
      return parsed.layout as LayoutNode;
    }
    return parsed as LayoutNode;
  } catch {
    throw new Error(`Planner returned invalid JSON:\n${text}`);
  }
}
