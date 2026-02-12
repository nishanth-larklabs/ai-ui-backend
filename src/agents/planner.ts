/**
 * Planner Agent — "The Architect"
 *
 * Takes a user prompt + current UI state and produces a JSON layout tree
 * using ONLY allowed components from the manifest.
 */

import { GoogleGenAI } from "@google/genai";
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
  "type": "ComponentName",
  "props": { "propName": "value" },
  "children": [ ...child nodes or string text ]
}

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
  genai: GoogleGenAI,
  input: PlannerInput
): Promise<LayoutNode> {
  const userMessage = input.currentBlueprint
    ? `Current UI layout (JSON):\n${JSON.stringify(input.currentBlueprint, null, 2)}\n\nUser request: ${input.prompt}`
    : `User request: ${input.prompt}`;

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userMessage,
    config: {
      systemInstruction: PLANNER_SYSTEM_PROMPT,
      temperature: 0.8,
      responseMimeType: "application/json",
    },
  });

  const text = response.text?.trim() || "{}";

  // Parse JSON — strip markdown fences if the model wraps them
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");

  try {
    return JSON.parse(cleaned) as LayoutNode;
  } catch {
    throw new Error(`Planner returned invalid JSON:\n${text}`);
  }
}
