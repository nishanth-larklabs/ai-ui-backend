/**
 * Component Manifest — The single source of truth for allowed components.
 * The AI can ONLY use these components and their listed props.
 * No custom CSS, inline styles, or arbitrary HTML tags are permitted.
 */

export interface ComponentDef {
  props: readonly string[];
  description: string;
}

export interface ManifestCategory {
  [componentName: string]: ComponentDef;
}

export const COMPONENT_MANIFEST = {
  Layout: {
    Navbar: {
      props: ["title", "variant"] as const,
      description:
        "Horizontal navigation bar at the top of the page. Variants: default, dark.",
    },
    Sidebar: {
      props: ["items", "variant"] as const,
      description:
        'Vertical sidebar navigation. "items" is an array of {label, icon?} objects. Variants: default, compact.',
    },
    Container: {
      props: ["maxWidth", "padding"] as const,
      description:
        'Content wrapper. maxWidth: "sm"|"md"|"lg"|"xl"|"full". padding: "none"|"sm"|"md"|"lg".',
    },
    Grid: {
      props: ["columns", "gap"] as const,
      description:
        'CSS Grid layout. columns: 1-6 (number). gap: "none"|"sm"|"md"|"lg".',
    },
  },
  Elements: {
    Button: {
      props: ["variant", "size", "children", "onClick"] as const,
      description:
        'Clickable button. variant: "primary"|"secondary"|"danger"|"outline"|"ghost". size: "sm"|"md"|"lg".',
    },
    Input: {
      props: ["type", "placeholder", "label", "value"] as const,
      description:
        'Form input. type: "text"|"email"|"password"|"number"|"tel". label: optional label text above the input.',
    },
    Table: {
      props: ["columns", "data"] as const,
      description:
        "Data table. columns: array of column header strings. data: 2D array of cell values.",
    },
    Card: {
      props: ["title", "variant", "children"] as const,
      description:
        'Content card container. variant: "default"|"bordered"|"elevated". title: optional header text.',
    },
    Modal: {
      props: ["title", "open", "children"] as const,
      description:
        "Dialog overlay popup. open: boolean to control visibility. title: header text.",
    },
    Chart: {
      props: ["type", "data", "title"] as const,
      description:
        'Mocked chart component. type: "bar"|"line"|"pie". data: array of {label, value} objects.',
    },
  },
} as const;

/** Flat list of all allowed component names */
export const ALLOWED_COMPONENTS = [
  ...Object.keys(COMPONENT_MANIFEST.Layout),
  ...Object.keys(COMPONENT_MANIFEST.Elements),
];

/** Get a stringified version of the manifest for LLM system prompts */
export function getManifestPromptString(): string {
  const lines: string[] = [
    "## Allowed Component Library",
    "",
    "You may ONLY use the following components. No other HTML tags, custom components, inline styles, or arbitrary CSS classes are allowed.",
    "",
    "### Layout Components",
  ];

  for (const [name, def] of Object.entries(COMPONENT_MANIFEST.Layout)) {
    lines.push(
      `- **<${name}>**: ${def.description} | Props: ${def.props.join(", ")}`
    );
  }

  lines.push("", "### Element Components");

  for (const [name, def] of Object.entries(COMPONENT_MANIFEST.Elements)) {
    lines.push(
      `- **<${name}>**: ${def.description} | Props: ${def.props.join(", ")}`
    );
  }

  return lines.join("\n");
}
