/**
 * /api/generate — Orchestration Endpoint
 *
 * Runs the Agent Trinity pipeline:
 * 1. Planner  → JSON layout blueprint
 * 2. Generator → JSX code string
 * 3. Explainer → Plain-English reasoning
 * 4. Validator → Safety check on output
 */

import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { runPlanner, LayoutNode } from "../agents/planner";
import { runGenerator } from "../agents/generator";
import { runExplainer } from "../agents/explainer";
import { validateAndSanitize } from "../utils/validator";

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, currentCode, currentBlueprint } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "A valid 'prompt' string is required." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured on the server." });
      return;
    }

    const genai = new GoogleGenAI({ apiKey });

    // Step 1: Planner
    console.log("[Agent Trinity] Step 1/3: Planner running...");
    let blueprint: LayoutNode;
    try {
      blueprint = await runPlanner(genai, {
        prompt,
        currentBlueprint: currentBlueprint || null,
      });
    } catch (err) {
      console.error("[Planner Error]", err);
      res.status(500).json({
        error: "Planner agent failed to generate a layout blueprint.",
        details: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    // Step 2: Generator
    console.log("[Agent Trinity] Step 2/3: Generator running...");
    let rawCode: string;
    try {
      rawCode = await runGenerator(genai, { blueprint });
    } catch (err) {
      console.error("[Generator Error]", err);
      res.status(500).json({
        error: "Generator agent failed to produce JSX code.",
        details: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    // Step 3: Safety Validator
    console.log("[Agent Trinity] Validating output...");
    const validation = validateAndSanitize(rawCode);
    if (!validation.isClean) {
      console.warn("[Validator] Violations found:", validation.violations);
    }

    // Step 4: Explainer
    console.log("[Agent Trinity] Step 3/3: Explainer running...");
    let explanation: string;
    try {
      explanation = await runExplainer(genai, {
        prompt,
        blueprint,
        previousCode: currentCode || null,
        newCode: validation.sanitizedCode,
      });
    } catch (err) {
      console.error("[Explainer Error]", err);
      // Non-fatal — use a fallback explanation
      explanation =
        "Your UI has been updated based on your request. Check the preview to see the changes.";
    }

    // Response
    res.json({
      code: validation.sanitizedCode,
      blueprint,
      explanation,
      violations: validation.violations,
    });
  } catch (err) {
    console.error("[Generate Endpoint] Unexpected error:", err);
    res.status(500).json({
      error: "An unexpected error occurred.",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
