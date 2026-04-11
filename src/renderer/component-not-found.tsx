/**
 * Component Not Found Fallback
 * Logs error when a component type is not registered in the registry
 */

interface ComponentNotFoundProps {
  type: string;
  config: Record<string, unknown>;
  availableTypes: string[];
  componentKind: "section" | "block";
}

export default function ComponentNotFound({
  type,
  config,
  availableTypes,
  componentKind,
}: ComponentNotFoundProps) {
  const isDev = process.env.NODE_ENV === "development";

  const errorDetails = {
    componentKind,
    type,
    config,
    availableTypes,
    timestamp: new Date().toISOString(),
    suggestion: `Create components/${componentKind}s/${type}.tsx and register it in lib/registries/${componentKind}-registry.ts`,
  };

  if (isDev) {
    console.error(
      `[${componentKind === "section" ? "SectionRenderer" : "BlockRenderer"}] Component not found: "${type}"`,
      errorDetails,
    );
  } else {
    console.error(`[CMS] Unknown ${componentKind}: "${type}"`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined" && (window as any).__CMS_ERROR_HANDLER__) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__CMS_ERROR_HANDLER__({
        errorType: "COMPONENT_NOT_FOUND",
        severity: "warning",
        ...errorDetails,
      });
    } catch {
      // Ignore errors from error handler
    }
  }

  return (
    <div
      style={{
        minHeight: "40px",
        border: "1px dashed #e5e7eb",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9ca3af",
        fontSize: "12px",
        fontFamily: "monospace",
      }}
      aria-hidden="true"
    >
      {type}
    </div>
  );
}
