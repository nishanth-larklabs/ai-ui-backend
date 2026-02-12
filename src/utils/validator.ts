/**
 * Safety / Validation Layer
 *
 * Parses the AI-generated JSX code and strips any unauthorized content:
 * - Inline styles (style={...})
 * - className attributes
 * - HTML tags not in the component manifest
 * - Script tags or event handlers beyond the allowed set
 *
 * Returns sanitized code + a list of violations found.
 */

import { ALLOWED_COMPONENTS } from "../agents/componentManifest";

export interface ValidationResult {
  sanitizedCode: string;
  violations: string[];
  isClean: boolean;
}

export function validateAndSanitize(code: string): ValidationResult {
  const violations: string[] = [];
  let sanitized = code;

  // 1. Strip inline style attributes: style={{...}} or style="..."
  const styleRegex = /\s+style=\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g;
  const styleStringRegex = /\s+style="[^"]*"/g;
  if (styleRegex.test(sanitized)) {
    violations.push("Inline style={{}} attributes were found and removed.");
    sanitized = sanitized.replace(styleRegex, "");
  }
  if (styleStringRegex.test(sanitized)) {
    violations.push('Inline style="..." attributes were found and removed.');
    sanitized = sanitized.replace(styleStringRegex, "");
  }

  // 2. Strip className attributes
  const classNameRegex = /\s+className=(?:\{[^}]*\}|"[^"]*")/g;
  if (classNameRegex.test(sanitized)) {
    violations.push("className attributes were found and removed.");
    sanitized = sanitized.replace(classNameRegex, "");
  }

  // 3. Check for unauthorized HTML tags
  // Match opening tags like <div, <span, <p, etc. but not allowed components or fragments
  const tagRegex = /<\/?([A-Za-z][A-Za-z0-9]*)/g;
  let match;
  const unauthorizedTags = new Set<string>();

  while ((match = tagRegex.exec(sanitized)) !== null) {
    const tagName = match[1];
    // Allow: whitelisted components, React fragments aren't captured by this regex
    if (!ALLOWED_COMPONENTS.includes(tagName)) {
      unauthorizedTags.add(tagName);
    }
  }

  if (unauthorizedTags.size > 0) {
    const tagList = Array.from(unauthorizedTags).join(", ");
    violations.push(
      `Unauthorized HTML tags found: ${tagList}. These tags were replaced with Container wrappers.`
    );

    // Replace unauthorized opening/closing tags with Container
    for (const tag of unauthorizedTags) {
      const openRegex = new RegExp(`<${tag}(\\s|>|\\/)`, "g");
      const closeRegex = new RegExp(`</${tag}>`, "g");
      sanitized = sanitized.replace(openRegex, `<Container$1`);
      sanitized = sanitized.replace(closeRegex, "</Container>");
    }
  }

  // 4. Strip dangerous attributes (onLoad, onError, dangerouslySetInnerHTML, etc.)
  const dangerousAttrs =
    /\s+(onLoad|onError|onAbort|dangerouslySetInnerHTML|ref|key)=\{[^}]*\}/g;
  if (dangerousAttrs.test(sanitized)) {
    violations.push("Dangerous attributes were found and removed.");
    sanitized = sanitized.replace(dangerousAttrs, "");
  }

  return {
    sanitizedCode: sanitized,
    violations,
    isClean: violations.length === 0,
  };
}
